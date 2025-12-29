'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { completeRegistration } from '@/app/actions/onboarding'
import { HugeiconsIcon } from '@hugeicons/react'
import { Loading03Icon } from '@hugeicons/core-free-icons'

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

    const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            full_name: '', // We can try to guess or just leave it
            name: '',
            cnpj: '',
            whatsapp: '(00) 00000-0000' // Placeholder for now or required?
        }
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
            const result = await completeRegistration(null, formData)
            if (result?.errors) {
                console.error(result.errors)
                setServerError('Por favor, revise os campos destacados.')
            } else if (result?.message) {
                setServerError(result.message)
            }
        } catch (error) {
            // Success usually redirects
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight">Bem-vindo ao Trigovo</h2>
                <p className="text-muted-foreground">
                    Vamos preparar tudo para você começar em menos de um minuto.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" value={userEmail} disabled className="bg-muted/50 cursor-not-allowed" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="full_name">Seu nome completo</Label>
                    <Input
                        id="full_name"
                        placeholder="Ex: João da Silva"
                        {...register('full_name')}
                        className={errors.full_name ? 'border-destructive' : ''}
                    />
                    {errors.full_name && <p className="text-xs font-medium text-destructive">{errors.full_name.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="name">Nome da agência</Label>
                    <Input
                        id="name"
                        placeholder="Ex: Agência de Viagens Trigovo"
                        {...register('name')}
                        className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && <p className="text-xs font-medium text-destructive">{errors.name.message}</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
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
                            className={errors.cnpj ? 'border-destructive' : ''}
                        />
                        {errors.cnpj && <p className="text-xs font-medium text-destructive">{errors.cnpj.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp / Telefone</Label>
                        <Input
                            id="whatsapp"
                            placeholder="(11) 99999-9999"
                            {...register('whatsapp', {
                                onChange: (e) => {
                                    setValue('whatsapp', formatPhone(e.target.value))
                                }
                            })}
                            className={errors.whatsapp ? 'border-destructive' : ''}
                        />
                        {errors.whatsapp && <p className="text-xs font-medium text-destructive">{errors.whatsapp.message}</p>}
                    </div>
                </div>

                {serverError && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium text-center">
                        {serverError}
                    </div>
                )}

                <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
                            Salvando informações…
                        </>
                    ) : (
                        'Concluir cadastro'
                    )}
                </Button>
            </form>
        </div>
    )
}

