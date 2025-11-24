'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteFlight(ticketId: string) {
    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('tickets')
            .delete()
            .eq('id', ticketId)

        if (error) throw error

        revalidatePath('/dashboard/flights')
        return { success: true }
    } catch (error) {
        console.error('Falha ao excluir voo:', error)
        return { success: false, error: 'Falha ao excluir voo' }
    }
}
