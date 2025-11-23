'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function updatePassengerName(ticketId: string, newName: string) {
    try {
        const { error } = await supabase
            .from('tickets')
            .update({ passenger_name: newName })
            .eq('id', ticketId)

        if (error) throw error

        revalidatePath('/dashboard/flights')
        return { success: true }
    } catch (error) {
        console.error('Failed to update passenger name:', error)
        return { success: false, error: 'Failed to update name' }
    }
}
