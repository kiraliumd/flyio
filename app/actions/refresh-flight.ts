'use server'

import { createClient } from '@/lib/supabase/server'
import { scrapeBooking } from '@/lib/scraper'
import { revalidatePath } from 'next/cache'

export async function refreshFlight(ticketId: string, pnr: string, lastName: string, airline: string) {
    const supabase = await createClient()

    try {
        console.log(`Refreshing flight ${pnr}...`)

        // Re-run scraper
        const details = await scrapeBooking(pnr, lastName, airline as any)

        // Update DB
        const { error } = await supabase
            .from('tickets')
            .update({
                flight_number: details.flightNumber,
                flight_date: details.departureDate,
                origin: details.origin,
                destination: details.destination,
                updated_at: new Date().toISOString()
            })
            .eq('id', ticketId)

        if (error) throw error

        revalidatePath('/dashboard/flights')
        return { success: true }
    } catch (error) {
        console.error('Falha ao atualizar voo:', error)
        return { success: false, error: 'Falha ao atualizar dados do voo' }
    }
}
