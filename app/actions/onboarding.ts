'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const registrationSchema = z.object({
    full_name: z.string().min(3, 'Nome completo é obrigatório'),
    name: z.string().min(2, 'Nome da agência é obrigatório'),
    cnpj: z.string().min(14, 'CNPJ inválido').regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'Formato inválido (00.000.000/0000-00)'),
    whatsapp: z.string().min(14, 'WhatsApp inválido').regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'Formato inválido (00) 00000-0000'),
})

export async function completeRegistration(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const data = {
        full_name: formData.get('full_name'),
        name: formData.get('name'),
        cnpj: formData.get('cnpj'),
        whatsapp: formData.get('whatsapp'),
    }

    const validatedFields = registrationSchema.safeParse(data)

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Verifique os campos e tente novamente.'
        }
    }

    const { error } = await supabase
        .from('agencies')
        .upsert({
            id: user.id,
            ...validatedFields.data,
            updated_at: new Date().toISOString(),
        })

    if (error) {
        console.error('Registration error:', error)
        return { message: 'Erro ao salvar dados. Tente novamente.' }
    }

    redirect('/dashboard')
}
