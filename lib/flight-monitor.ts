import { supabaseAdmin } from '@/lib/supabase/admin';
import { getRealTimeFlightStatus } from '@/lib/aviation-stack';
import { addDays, endOfDay, startOfDay } from 'date-fns';

export async function updateFlightStatus() {
    console.log('Starting flight status update...');

    // 1. Get tickets for today and tomorrow
    const today = startOfDay(new Date());
    const tomorrow = endOfDay(addDays(today, 1));

    const { data: tickets, error } = await supabaseAdmin
        .from('tickets')
        .select('*')
        .gte('flight_date', today.toISOString())
        .lte('flight_date', tomorrow.toISOString());

    if (error) {
        console.error('Error fetching tickets:', error);
        return;
    }

    if (!tickets || tickets.length === 0) {
        console.log('No tickets found for today or tomorrow.');
        return;
    }

    console.log(`Found ${tickets.length} tickets to check.`);

    // 2. Check status for each ticket
    for (const ticket of tickets) {
        try {
            console.log(`Checking flight ${ticket.flight_number} (${ticket.pnr})...`);

            const flightData = await getRealTimeFlightStatus(ticket.flight_number);

            if (!flightData) {
                console.warn(`No data found for flight ${ticket.flight_number}`);
                continue;
            }

            const apiStatus = flightData.status;

            // 3. Compare and update if different
            if (apiStatus !== ticket.status) {
                console.log(`Updating status for ${ticket.flight_number}: ${ticket.status} -> ${apiStatus}`);

                const { error: updateError } = await supabaseAdmin
                    .from('tickets')
                    .update({ status: apiStatus })
                    .eq('id', ticket.id);

                if (updateError) {
                    console.error(`Failed to update ticket ${ticket.id}:`, updateError);
                }
            } else {
                console.log(`Status unchanged for ${ticket.flight_number} (${apiStatus})`);
            }

        } catch (err) {
            console.error(`Error processing ticket ${ticket.id}:`, err);
        }
    }

    console.log('Flight status update completed.');
}
