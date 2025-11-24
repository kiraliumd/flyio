import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingForm } from './onboarding-form'

export default async function OnboardingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if already registered? 
    // Maybe not strictly required by prompt, but good UX. 
    // If agency exists and has name/cnpj, maybe redirect to dashboard?
    // User said "logo após o primeiro login", implying it's for new users.
    // I'll check if data exists to avoid stuck loop if they go back.

    const { data: agency } = await supabase
        .from('agencies')
        .select('name, cnpj')
        .eq('id', user.id)
        .single()

    if (agency?.name && agency?.cnpj) {
        redirect('/dashboard')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <OnboardingForm userEmail={user.email || ''} />
        </div>
    )
}
