import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Não autorizado</div>

    const { data: agency } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <div className="space-y-4">
            <h1 className="text-[30px] font-semibold leading-[40px] tracking-normal text-[#191e3b]">
                Configurações
            </h1>

            <SettingsForm
                initialData={agency || {}}
                userEmail={user.email || ''}
            />
        </div>
    )
}
