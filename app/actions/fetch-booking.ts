'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { scrapeBooking, type Airline, type BookingDetails } from '@/lib/scraper'

export async function fetchBookingDetails(pnr: string, lastname: string, airline: Airline) {
    const supabase = await createClient()

    // 1. Verificação de Usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        throw new Error('User not authenticated')
    }

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
