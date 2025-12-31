'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { submitScrapeJob, getScraperJobStatus, type Airline, type BookingDetails } from '@/lib/scraper'
import { z } from 'zod'

// Schema de validação para inputs do usuário
const bookingSchema = z.object({
    pnr: z.string().min(5, "Localizador muito curto").max(20).regex(/^[a-zA-Z0-9]+$/, "Localizador deve ser alfanumérico"),
    lastname: z.string().min(2, "Sobrenome muito curto").max(50),
    airline: z.enum(['LATAM', 'GOL', 'AZUL']),
    origin: z.string().transform(v => v === "" ? undefined : v).pipe(z.string().length(3, "Origem deve ter 3 letras").optional())
})

/**
 * 1. Inicia o Job no Scraper e retorna o JobID
 */
export async function startScraperJob(pnr: string, lastname: string, airline: Airline, origin?: string) {
    console.log(`🚀 startScraperJob: ${airline} ${pnr} (Origin: ${origin})`);

    const validated = bookingSchema.safeParse({ pnr, lastname, airline, origin })
    if (!validated.success) {
        const errorMsg = validated.error.errors.map(e => `${e.path}: ${e.message}`).join(', ');
        console.error('❌ Validação falhou:', errorMsg);
        throw new Error(`Dados inválidos: ${errorMsg}`);
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                    } catch { }
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autenticado.")

    // Inicia o job e retorna jobId
    const finalLastName = (airline === 'AZUL' && !lastname) ? 'AZUL-PASSENGER' : lastname;
    const result = await submitScrapeJob(pnr, finalLastName, airline, origin, user.id);

    return { success: true, jobId: result.jobId, initialStatus: result.status, initialResult: result.result };
}

/**
 * 2. Consulta o Status do Job (Ação segura para o cliente chamar)
 */
export async function checkScraperJobStatus(jobId: string) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                    } catch { }
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autenticado.")

    return await getScraperJobStatus(jobId);
}

/**
 * 3. Salva o resultado final no Banco de Dados
 */
export async function saveScraperResult(pnr: string, airline: Airline, bookingDetails: BookingDetails, originalLastname: string) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                    } catch { }
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autenticado.")

    try {
        // 1. Get or Create Flight
        const flightInsert = {
            flight_number: bookingDetails.flightNumber,
            departure_date: bookingDetails.departureDate,
            origin: bookingDetails.origin,
            destination: bookingDetails.destination,
            status: 'Confirmado'
        }

        const { data: flightData, error: flightError } = await supabase
            .from('flights')
            .upsert(flightInsert, { onConflict: 'flight_number, departure_date' })
            .select().single()

        if (flightError) throw flightError

        // 2. Normalização de Sobrenome
        let finalPassengerLastname = originalLastname.toUpperCase();
        if (originalLastname === 'AZUL-PASSENGER' && bookingDetails.itinerary_details?.passengers?.length > 0) {
            const firstPax = bookingDetails.itinerary_details.passengers[0];
            if (firstPax.name) {
                const parts = firstPax.name.trim().split(' ');
                if (parts.length > 1) finalPassengerLastname = parts.pop() || 'AZUL-PASSENGER';
            }
        }

        // 3. Upsert Ticket
        const { error: dbError } = await supabase
            .from('tickets')
            .upsert({
                agency_id: user.id,
                pnr: pnr.toUpperCase(),
                passenger_lastname: finalPassengerLastname,
                airline: airline,
                flight_id: flightData.id,
                flight_number: bookingDetails.flightNumber,
                flight_date: bookingDetails.departureDate,
                origin: bookingDetails.origin,
                destination: bookingDetails.destination,
                status: 'Confirmado',
                checkin_status: 'Fechado',
                itinerary_details: bookingDetails.itinerary_details
            }, { onConflict: 'pnr, agency_id' })

        if (dbError) throw dbError

        revalidatePath('/dashboard/flights')
        return { success: true }

    } catch (error) {
        console.error("Save result failed:", error)
        throw new Error("Falha ao salvar dados no banco.")
    }
}

// Mantendo para compatibilidade ou se necessário chamar síncrono internamente
export async function fetchBookingDetails(pnr: string, lastname: string, airline: Airline, origin?: string) {
    const job = await startScraperJob(pnr, lastname, airline, origin);
    if (job.initialStatus === 'completed' && job.initialResult) {
        return await saveScraperResult(pnr, airline, job.initialResult, lastname);
    }
    throw new Error("Esta ação agora requer polling no cliente e não pode ser chamada de forma síncrona simples.");
}
