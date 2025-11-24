'use server'

import { createClient } from '@/lib/supabase/server'
import { put } from '@vercel/blob'
import { revalidatePath } from 'next/cache'

export async function updateAgencyProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const name = formData.get('name') as string
    const cnpj = formData.get('cnpj') as string
    const email = formData.get('email') as string
    const notifyEmail = formData.get('notify_email') === 'on'

    // 1. Atualizar dados na tabela 'agencies' (Dados de Negócio)
    const { error } = await supabase
        .from('agencies')
        .upsert({
            id: user.id,
            name,
            cnpj,
            email, // Salva o email na tabela apenas para referência visual rápida
            notify_email: notifyEmail,
            updated_at: new Date().toISOString()
        })

    if (error) throw new Error('Falha ao atualizar perfil da agência')

    // 2. Atualizar E-mail de Autenticação (Se mudou)
    if (email && email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({ email: email })

        if (authError) {
            // Log error but don't fail the whole request if profile update worked? 
            // Or throw? User said "throw new Error".
            throw new Error('Erro ao atualizar e-mail de login: ' + authError.message)
        }

        revalidatePath('/dashboard/settings')
        return { success: true, message: 'Perfil atualizado! Verifique seu novo e-mail para confirmar a alteração.' }
    }

    revalidatePath('/dashboard/settings')
    return { success: true, message: 'Perfil atualizado com sucesso.' }
}

export async function uploadAgencyLogo(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const file = formData.get('logo') as File
    if (!file) throw new Error('No file provided')

    // Upload to Vercel Blob
    const blob = await put(`logos/${user.id}-${file.name}`, file, {
        access: 'public',
    })

    // Save URL to DB
    const { error } = await supabase
        .from('agencies')
        .upsert({
            id: user.id,
            logo_url: blob.url,
            updated_at: new Date().toISOString(),
        })

    revalidatePath('/dashboard/settings')
    return { success: true, url: blob.url }
}
