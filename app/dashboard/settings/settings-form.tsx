'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateAgencyProfile, uploadAgencyLogo } from '@/app/actions/settings'
import { HugeiconsIcon } from '@hugeicons/react'
import {
    CloudUploadIcon,
    Tick02Icon,
    FloppyDiskIcon,
} from '@hugeicons/core-free-icons'
import Image from 'next/image'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const schema = z.object({
    name: z.string().min(2, 'Nome da agência é obrigatório'),
    cnpj: z.string().min(18, 'CNPJ inválido'),
    email: z.string().email('E-mail inválido'),
})

type FormData = z.infer<typeof schema>

interface SettingsFormProps {
    initialData: {
        name?: string
        cnpj?: string
        email?: string
        logo_url?: string | null
    }
    userEmail: string
}

export function SettingsForm({ initialData, userEmail }: SettingsFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [logoUrl, setLogoUrl] = useState<string | null>(initialData.logo_url || null)
    const [logoFileName, setLogoFileName] = useState<string | null>(null)
    const [hasChanges, setHasChanges] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: initialData.name || '',
            cnpj: initialData.cnpj || '',
            email: initialData.email || userEmail || '',
        }
    })

    const watchedName = watch('name')
    const watchedCnpj = watch('cnpj')
    const watchedEmail = watch('email')

    // Atualiza logoUrl quando initialData mudar
    useEffect(() => {
        setLogoUrl(initialData.logo_url || null)

        // Se não houver logo, limpa o nome do arquivo
        if (!initialData.logo_url) {
            setLogoFileName(null)
            localStorage.removeItem('agency_logo_filename')
            return
        }

        // Primeiro tenta pegar do localStorage (nome salvo após upload)
        const savedFileName = localStorage.getItem('agency_logo_filename')
        if (savedFileName) {
            setLogoFileName(savedFileName)
            return
        }

        // Se não tiver no localStorage, tenta extrair da URL
        const urlParts = initialData.logo_url.split('/')
        const fileNameWithParams = urlParts[urlParts.length - 1]
        // Remove query parameters
        const fileName = fileNameWithParams.split('?')[0]

        // Formato do Vercel Blob: {uuid}-{nome-original}-{sufixo-aleatorio}.{ext}
        // Exemplo: 6fccde5e-66f9-4fed-adbd-ced228a35865-aviar-logo-WlZ0ODyeLIrvIca1LCzgWDSLPNbKqm.jpg
        // Queremos extrair: aviar-logo.jpg

        // Regex para capturar o nome original entre o UUID e o sufixo aleatório
        // UUID tem formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 caracteres com hífens)
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i

        if (uuidPattern.test(fileName)) {
            // Remove o UUID do início (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-)
            const withoutUuid = fileName.replace(uuidPattern, '')
            // Agora temos: aviar-logo-WlZ0ODyeLIrvIca1LCzgWDSLPNbKqm.jpg

            // Extrai a extensão
            const extensionMatch = withoutUuid.match(/\.([^.]+)$/)
            const extension = extensionMatch ? extensionMatch[0] : '.jpg'

            // Remove a extensão temporariamente
            const withoutExt = withoutUuid.replace(/\.[^.]+$/, '')

            // Divide por hífen e identifica o sufixo aleatório (geralmente a última parte longa)
            const parts = withoutExt.split('-')

            // O sufixo aleatório do Vercel geralmente é a última parte e tem mais de 20 caracteres
            // Vamos pegar todas as partes exceto a última se ela for muito longa
            let originalNameParts: string[] = []
            for (let i = 0; i < parts.length; i++) {
                // Se a parte atual é muito longa (provavelmente o sufixo) e não é a primeira, para
                if (parts[i].length > 20 && i > 0) {
                    break
                }
                originalNameParts.push(parts[i])
            }

            // Se não encontrou padrão, tenta remover apenas a última parte se for muito longa
            if (originalNameParts.length === parts.length && parts.length > 1) {
                const lastPart = parts[parts.length - 1]
                if (lastPart.length > 20) {
                    originalNameParts = parts.slice(0, -1)
                }
            }

            const extractedName = originalNameParts.length > 0
                ? `${originalNameParts.join('-')}${extension}`
                : `${withoutExt}${extension}`

            setLogoFileName(extractedName)
            // Salva no localStorage para próxima vez
            localStorage.setItem('agency_logo_filename', extractedName)
        } else {
            // Não encontrou padrão UUID, tenta outro padrão ou usa o nome como está
            setLogoFileName(fileName || 'logo.png')
        }
    }, [initialData.logo_url])

    // Monitora mudanças nos campos
    useEffect(() => {
        const nameChanged = watchedName !== (initialData.name || '')
        const cnpjChanged = watchedCnpj !== (initialData.cnpj || '')
        const emailChanged = watchedEmail !== (initialData.email || userEmail || '')
        const logoChanged = logoUrl !== (initialData.logo_url || null)

        setHasChanges(nameChanged || cnpjChanged || emailChanged || logoChanged)
    }, [watchedName, watchedCnpj, watchedEmail, logoUrl, initialData, userEmail])

    const formatCNPJ = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .substring(0, 18)
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return

        const file = e.target.files[0]

        // Validações
        if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
            toast.error('Formato inválido. Use PNG ou JPG.')
            e.target.value = ''
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Arquivo muito grande. Máximo 2MB.')
            e.target.value = ''
            return
        }

        // Valida dimensões (200x200)
        const img = new window.Image()
        img.onload = async () => {
            if (img.width !== 200 || img.height !== 200) {
                toast.error('Dimensões inválidas. A imagem deve ser 200x200 pixels.')
                e.target.value = ''
                return
            }

            setIsUploading(true)
            const originalFileName = file.name // Salva o nome original antes do upload

            try {
                const formData = new FormData()
                formData.append('logo', file)

                const result = await uploadAgencyLogo(formData)
                if (result.success && result.url) {
                    setLogoUrl(result.url)
                    setLogoFileName(originalFileName) // Mantém o nome original do arquivo
                    // Salva no localStorage para persistir após refresh
                    localStorage.setItem('agency_logo_filename', originalFileName)
                    toast.success('Logo atualizada com sucesso!')
                    router.refresh()
                }
            } catch (error) {
                toast.error('Erro ao fazer upload da logo')
            } finally {
                setIsUploading(false)
            }
        }

        img.onerror = () => {
            toast.error('Erro ao carregar a imagem')
            e.target.value = ''
        }

        img.src = URL.createObjectURL(file)
    }

    const onSubmit = async (data: FormData) => {
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append('name', data.name)
            formData.append('cnpj', data.cnpj)
            formData.append('email', data.email)

            const result = await updateAgencyProfile(formData)

            if (result.success) {
                toast.success(result.message)
                setHasChanges(false)
                router.refresh()
            }
        } catch (error) {
            toast.error('Erro ao atualizar perfil')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-4 items-end">
            {/* Container com dois cards lado a lado */}
            <div className="flex gap-4 items-stretch w-full">
                {/* Card 1: Logo da Agência */}
                <div className="border border-[#e6e9f2] rounded-2xl p-4 w-[396px] shrink-0 flex flex-col gap-4 self-stretch">
                    <div className="flex flex-col gap-[3px] h-[65px] shrink-0">
                        <h3 className="text-lg font-medium leading-normal text-[#191e3b]">
                            Logo da agência
                        </h3>
                        <p className="text-sm font-normal leading-5 text-[#4b5173]">
                            Esta logo será usada apenas nos cartões de embarque gerados para seus clientes.
                        </p>
                    </div>

                    {/* Separador vertical */}
                    <div className="h-px w-full bg-[#e6e9f2] shrink-0" />

                    <div className="flex flex-col gap-6 items-start w-full flex-1">
                        {/* Estado: Com logo ou sem logo */}
                        {logoUrl ? (
                            <div className="flex gap-2.5 items-center w-full">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="bg-[#f8f9fc] border border-[#e6e9f2] h-8 px-4 py-2 rounded-lg gap-2.5 hover:bg-[#f8f9fc]"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    <HugeiconsIcon icon={CloudUploadIcon} className="size-4 text-[#191e3b]" />
                                    <span className="text-sm font-medium leading-5 text-[#191e3b]">
                                        Mudar imagem
                                    </span>
                                </Button>
                                {logoFileName && (
                                    <p className="text-sm font-normal leading-5 text-[#4b5173] truncate">
                                        {logoFileName}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="flex gap-2.5 items-center w-full">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="bg-[#f8f9fc] border border-[#e6e9f2] h-8 px-4 py-2 rounded-lg gap-2.5 hover:bg-[#f8f9fc]"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    <HugeiconsIcon icon={CloudUploadIcon} className="size-4 text-[#191e3b]" />
                                    <span className="text-sm font-medium leading-5 text-[#191e3b]">
                                        Escolha o arquivo
                                    </span>
                                </Button>
                            </div>
                        )}

                        {/* Input de arquivo oculto */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            className="hidden"
                            onChange={handleLogoUpload}
                            disabled={isUploading}
                        />

                        {/* Preview da logo (se houver) */}
                        {logoUrl && (
                            <div className="relative w-full h-[115px] border border-[#e6e9f2] rounded-lg overflow-hidden bg-white flex items-center justify-center">
                                <Image
                                    src={logoUrl}
                                    alt="Logo da Agência"
                                    fill
                                    className="object-contain p-4"
                                />
                            </div>
                        )}

                        {/* Requisitos */}
                        <div className="bg-[#fdf9f1] border border-[#fddb32] rounded-xl p-3 w-full flex flex-col gap-[3px]">
                            <div className="flex gap-[3px] items-center justify-start">
                                <HugeiconsIcon icon={Tick02Icon} className="size-4 text-[#fddb32] shrink-0" />
                                <p className="text-sm font-normal leading-5 text-[#4b5173]">
                                    JPG ou PNG
                                </p>
                            </div>
                            <div className="flex gap-[3px] items-center justify-start">
                                <HugeiconsIcon icon={Tick02Icon} className="size-4 text-[#fddb32] shrink-0" />
                                <p className="text-sm font-normal leading-5 text-[#4b5173]">
                                    Dimensões: 200 x 200 pixels
                                </p>
                            </div>
                            <div className="flex gap-[3px] items-center justify-start">
                                <HugeiconsIcon icon={Tick02Icon} className="size-4 text-[#fddb32] shrink-0" />
                                <p className="text-sm font-normal leading-5 text-[#4b5173]">
                                    Limite 2MB
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Perfil da Agência */}
                <div className="flex-1 border border-[#e6e9f2] rounded-2xl p-4 flex flex-col gap-4 self-stretch">
                    <div className="flex flex-col gap-[3px] h-[65px] shrink-0">
                        <h3 className="text-lg font-medium leading-normal text-[#191e3b]">
                            Perfil da agência
                        </h3>
                        <p className="text-sm font-normal leading-5 text-[#4b5173]">
                            Gerencia as informações da sua agência e preferências de conta.
                        </p>
                    </div>

                    {/* Separador vertical */}
                    <div className="h-px w-full bg-[#e6e9f2] shrink-0" />

                    <div className="flex flex-col gap-4 flex-1">
                        <div className="flex flex-col gap-3">
                            <Label htmlFor="name" className="text-sm font-medium leading-5 text-[#191e3b]">
                                Nome da agência
                            </Label>
                            <Input
                                id="name"
                                {...register('name')}
                                className="h-9 px-3 py-1 rounded-md border-[#e6e9f2] bg-white text-sm leading-6 text-[#191e3b]"
                            />
                            {errors.name && (
                                <p className="text-xs font-medium text-red-500">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-3">
                            <Label htmlFor="email" className="text-sm font-medium leading-5 text-[#191e3b]">
                                E-mail de login
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                {...register('email')}
                                className="h-9 px-3 py-1 rounded-md border-[#e6e9f2] bg-white text-sm leading-6 text-[#191e3b]"
                            />
                            {errors.email && (
                                <p className="text-xs font-medium text-red-500">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-3">
                            <Label htmlFor="cnpj" className="text-sm font-medium leading-5 text-[#191e3b]">
                                CNPJ
                            </Label>
                            <Input
                                id="cnpj"
                                {...register('cnpj', {
                                    onChange: (e) => {
                                        setValue('cnpj', formatCNPJ(e.target.value))
                                    }
                                })}
                                className="h-9 px-3 py-1 rounded-md border-[#e6e9f2] bg-white text-sm leading-6 text-[#191e3b]"
                            />
                            {errors.cnpj && (
                                <p className="text-xs font-medium text-red-500">{errors.cnpj.message}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Botão Salvar Alterações */}
            <Button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={!hasChanges || isLoading}
                className="bg-[#fddb32] hover:bg-[#fddb32]/90 text-[#191e3b] h-8 px-3 py-0 rounded-lg gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <HugeiconsIcon icon={FloppyDiskIcon} className="size-4" />
                <span className="text-sm font-medium leading-5">
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </span>
            </Button>
        </div>
    )
}
