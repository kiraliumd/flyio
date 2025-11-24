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
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Configurações</h3>
                <p className="text-sm text-muted-foreground">
                    Gerencie as preferências da sua agência e marca.
                </p>
            </div>

            <SettingsForm
                initialData={agency || {}}
                userEmail={user.email || ''}
            />
        </div>
    )
}
