'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { completeRegistration } from '@/app/actions/onboarding'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const schema = z.object({
    full_name: z.string().min(3, 'Nome completo é obrigatório'),
    name: z.string().min(2, 'Nome da agência é obrigatório'),
    cnpj: z.string().min(18, 'CNPJ inválido'), // 18 chars with mask
    whatsapp: z.string().min(15, 'WhatsApp inválido'), // 15 chars with mask
})

type FormData = z.infer<typeof schema>

export function OnboardingForm({ userEmail }: { userEmail: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const [serverError, setServerError] = useState('')
    const router = useRouter()

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
        resolver: zodResolver(schema),
    })

    const formatCNPJ = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .substring(0, 18)
    }

    const formatPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .substring(0, 15)
    }

    const onSubmit = async (data: FormData) => {
        setIsLoading(true)
        setServerError('')

        const formData = new FormData()
        formData.append('full_name', data.full_name)
        formData.append('name', data.name)
        formData.append('cnpj', data.cnpj)
        formData.append('whatsapp', data.whatsapp)

        try {
            // We can't use useFormState easily with react-hook-form's handleSubmit without some glue
            // So we call the action directly. 
            // Note: completeRegistration does a redirect on success, which throws an error in client components if not caught properly or handled.
            // Actually, redirect in Server Actions works fine.

            const result = await completeRegistration(null, formData)

            if (result?.errors) {
                // Handle field errors if any returned from server (though client validation should catch most)
                console.error(result.errors)
            } else if (result?.message) {
                setServerError(result.message)
            }
        } catch (error) {
            // Redirect throws an error "NEXT_REDIRECT" which is expected
            // But usually Next.js handles it. If we catch it, we might prevent redirect.
            // However, calling server action from client code:
            // If it redirects, it should just work.
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Complete seu Cadastro</CardTitle>
                <CardDescription>
                    Precisamos de alguns dados para configurar sua agência.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input id="email" value={userEmail} disabled className="bg-muted" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="full_name">Nome do Responsável</Label>
                        <Input
                            id="full_name"
                            placeholder="Ex: João Silva"
                            {...register('full_name')}
                        />
                        {errors.full_name && <p className="text-sm text-red-500">{errors.full_name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Nome da Agência</Label>
                        <Input
                            id="name"
                            placeholder="Ex: Viaje Mais"
                            {...register('name')}
                        />
                        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <Input
                            id="cnpj"
                            placeholder="00.000.000/0000-00"
                            {...register('cnpj', {
                                onChange: (e) => {
                                    setValue('cnpj', formatCNPJ(e.target.value))
                                }
                            })}
                        />
                        {errors.cnpj && <p className="text-sm text-red-500">{errors.cnpj.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp</Label>
                        <Input
                            id="whatsapp"
                            placeholder="(11) 99999-9999"
                            {...register('whatsapp', {
                                onChange: (e) => {
                                    setValue('whatsapp', formatPhone(e.target.value))
                                }
                            })}
                        />
                        {errors.whatsapp && <p className="text-sm text-red-500">{errors.whatsapp.message}</p>}
                    </div>

                    {serverError && <p className="text-sm text-red-500 text-center">{serverError}</p>}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            'Finalizar Cadastro'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
