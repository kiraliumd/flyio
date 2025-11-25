'use server'

import { createClient } from '@/lib/supabase/server'
import { put } from '@vercel/blob'
import { revalidatePath } from 'next/cache'

export async function updateAgencyProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Usuário não autenticado')

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

    if (error) throw new Error('Falha ao atualizar perfil da agência: ' + error.message)

    // 2. Atualizar E-mail de Autenticação (Se mudou)
    if (email && email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({ email: email })

        if (authError) {
            throw new Error('Erro ao atualizar e-mail de login: ' + authError.message)
        }

        revalidatePath('/dashboard/settings')
        return { success: true, message: 'Perfil atualizado! Verifique seu novo e-mail para confirmar a alteração.' }
    }

    revalidatePath('/dashboard/settings')
    return { success: true, message: 'Perfil atualizado com sucesso.' }
}

export async function uploadAgencyLogo(formData: FormData) {
    console.log('[Settings] Iniciando upload de logo...')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Usuário não autenticado')

    const file = formData.get('logo') as File
    if (!file) throw new Error('Nenhum arquivo enviado')

    console.log('[Settings] Arquivo recebido:', { name: file.name, size: file.size, type: file.type })

    let logoUrl = undefined

    try {
        // Upload to Vercel Blob
        const blob = await put(`logos/${user.id}-${file.name}`, file, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN, // CRÍTICO: Token explícito
            addRandomSuffix: true, // Evita erro se o arquivo já existir
        })
        logoUrl = blob.url
        console.log('[Settings] Upload concluído:', logoUrl)
    } catch (error) {
        console.error('[Settings] Erro Vercel Blob:', error)
        throw new Error('Falha no upload da imagem. Verifique o token do Blob.')
    }

    // Save URL to DB
    const { error } = await supabase
        .from('agencies')
        .upsert({
            id: user.id,
            logo_url: logoUrl,
            updated_at: new Date().toISOString(),
        })

    if (error) {
        console.error('[Settings] Erro ao salvar no banco:', error)
        throw new Error('Erro ao salvar URL da logo no banco.')
    }

    revalidatePath('/dashboard/settings')
    return { success: true, url: logoUrl }
}
