'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { updateAgencyProfile, uploadAgencyLogo } from '@/app/actions/settings'
import { Loader2, UploadCloud, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'

const schema = z.object({
    name: z.string().min(2, 'Nome da agência é obrigatório'),
    cnpj: z.string().min(18, 'CNPJ inválido'),
    email: z.string().email('E-mail inválido'),
    notify_email: z.boolean(),
})

type FormData = z.infer<typeof schema>

interface SettingsFormProps {
    initialData: {
        name: string
        cnpj: string
        email: string
        notify_email: boolean
        logo_url: string | null
    }
    userEmail: string
}

export function SettingsForm({ initialData, userEmail }: SettingsFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: initialData.name || '',
            cnpj: initialData.cnpj || '',
            email: initialData.email || userEmail || '',
            notify_email: initialData.notify_email || true,
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

    const onSubmit = async (data: FormData) => {
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append('name', data.name)
            formData.append('cnpj', data.cnpj)
            formData.append('email', data.email)
            if (data.notify_email) formData.append('notify_email', 'on')

            const result = await updateAgencyProfile(formData)

            if (result.success) {
                toast.success(result.message)
            }
        } catch (error) {
            toast.error('Erro ao atualizar perfil')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('logo', e.target.files[0])

            const result = await uploadAgencyLogo(formData)
            if (result.success) {
                toast.success('Logo atualizada com sucesso!')
            }
        } catch (error) {
            toast.error('Erro ao fazer upload da logo')
        } finally {
            setIsUploading(false)
        }
    }

    const currentEmail = watch('email')
    const emailChanged = currentEmail !== userEmail

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Perfil da Agência</CardTitle>
                    <CardDescription>
                        Gerencie as informações da sua agência e preferências de conta.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Logo Upload Section */}
                    <div className="border-b pb-6">
                        <Label className="mb-4 block">Logo da Agência</Label>
                        <div className="flex items-start gap-6">
                            <div className="flex-1">
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="logo" className="sr-only">Upload Logo</Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            id="logo"
                                            type="file"
                                            accept="image/*"
                                            className="cursor-pointer"
                                            onChange={handleLogoUpload}
                                            disabled={isUploading}
                                        />
                                        {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Esta logo será usada apenas nos cartões de embarque gerados para seus clientes.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">Preview Atual</span>
                                <div className="relative h-24 w-24 overflow-hidden rounded-lg border bg-slate-50 flex items-center justify-center">
                                    {initialData.logo_url ? (
                                        <Image
                                            src={initialData.logo_url}
                                            alt="Logo da Agência"
                                            fill
                                            className="object-contain p-2"
                                        />
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Sem Logo</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
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
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail de Login</Label>
                            <Input
                                id="email"
                                type="email"
                                {...register('email')}
                            />
                            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}

                            {emailChanged && (
                                <Alert variant="warning" className="mt-2 bg-yellow-50 border-yellow-200 text-yellow-800">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Atenção</AlertTitle>
                                    <AlertDescription>
                                        Ao alterar o e-mail, você precisará confirmar o novo endereço na sua caixa de entrada para fazer login novamente.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>

                        <div className="flex items-center justify-between space-x-2 border rounded-lg p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="notify_email">Alertas de Check-in por E-mail</Label>
                                <p className="text-sm text-muted-foreground">
                                    Receba um aviso no dia que o check-in do seu cliente abrir.
                                </p>
                            </div>
                            <Switch
                                id="notify_email"
                                checked={watch('notify_email')}
                                onCheckedChange={(checked) => setValue('notify_email', checked)}
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    'Salvar Alterações'
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
