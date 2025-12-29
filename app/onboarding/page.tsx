import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AuthLayout } from '@/components/auth/auth-layout'
import { OnboardingForm } from './onboarding-form'

export default async function OnboardingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if agency has already completed onboarding
    const { data: agency } = await supabase
        .from('agencies')
        .select('name, cnpj')
        .eq('id', user.id)
        .single()

    if (agency?.name && agency?.cnpj) {
        redirect('/dashboard')
    }

    return (
        <AuthLayout
            title="Projetado para execução controlada."
            subtitle="O Trigovo é infraestrutura, não um script frágil."
            bullets={[
                "Escalabilidade automática via infraestrutura de Cloud",
                "Execução determinística em ambientes heterogêneos",
                "Garantia de entrega com persistência em fila"
            ]}
            footerText="Projetado por engenheiros para engenheiros."
        >
            <OnboardingForm userEmail={user.email || ''} />
        </AuthLayout>
    )
}
