import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DoneContent } from './done-content'

export default async function DonePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if agency has completed onboarding
    const { data: agency } = await supabase
        .from('agencies')
        .select('name, cnpj')
        .eq('id', user.id)
        .single()

    if (!agency?.name || !agency?.cnpj) {
        redirect('/onboarding/adicionar-informacoes')
    }

    return <DoneContent />
}

