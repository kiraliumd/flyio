'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { scrapeBooking, type Airline } from '@/lib/scraper'

export async function fetchBookingDetails(pnr: string, lastname: string, airline: Airline) {
    // 1. Aguarde os cookies (Obrigatório no Next 16)
    const cookieStore = await cookies()

    // Debug de Cookies (Sherlock Holmes)
    const allCookies = cookieStore.getAll().map(c => c.name)
    console.log("🍪 COOKIES CHEGANDO NO SERVIDOR:", allCookies)

    // 2. Crie o cliente manualmente dentro da Action
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Ignorar erros de setar cookies em Server Action
                    }
                },
            },
        }
    )

    // 3. Verifique o usuário de forma segura
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user) {
        console.error("❌ Erro Auth: Usuário nulo. Erro Supabase:", authError)
        throw new Error(`User not authenticated. Cookies visíveis: ${allCookies.join(', ')}`)
    }

    console.log("✅ Usuário Autenticado:", user.id)

    try {
        // 2. Scrape Data
        const bookingDetails = await scrapeBooking(pnr, lastname, airline)

        // 3. Inserção no Banco de Dados (Server-Side)
        const { error: dbError } = await supabase
            .from('tickets')
            .insert({
                agency_id: user.id, // ID do usuário autenticado
                pnr: pnr.toUpperCase(),
                passenger_lastname: lastname.toUpperCase(),
                passenger_name: 'Passageiro (Editar)',
                airline: airline,
                flight_number: bookingDetails.flightNumber,
                flight_date: bookingDetails.departureDate,
                origin: bookingDetails.origin,
                destination: bookingDetails.destination,
                status: 'Confirmado',
                checkin_status: 'Fechado'
            })

        if (dbError) throw dbError

        revalidatePath('/dashboard/flights')
        return { success: true, data: bookingDetails }

    } catch (error) {
        console.error(`Action failed for ${airline} ${pnr}:`, error)
        throw new Error(`Failed to add flight: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}
