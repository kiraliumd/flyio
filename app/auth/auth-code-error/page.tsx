'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/components/auth/auth-layout'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon, ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ErrorContent() {
    const searchParams = useSearchParams()
    const errorCode = searchParams.get('code')

    const isExpired = errorCode === 'otp_expired'

    return (
        <AuthLayout
            title="Sua segurança em primeiro lugar."
            subtitle="O Trigovo garante que cada acesso seja validado e seguro, protegendo suas automações."
            bullets={[
                "Links de acesso únicos e temporários",
                "Proteção contra acessos não autorizados",
                "Logs de auditoria em tempo real"
            ]}
        >
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
                        <HugeiconsIcon icon={AlertCircleIcon} className="size-6" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Erro de Autenticação</h2>
                    <p className="text-muted-foreground">
                        {isExpired
                            ? "Este link de acesso expirou por segurança. Por favor, solicite um novo link."
                            : "Houve um problema ao validar seu acesso. O link pode ser inválido ou já foi utilizado."}
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <Button asChild className="w-full">
                        <Link href="/login">Solicitar novo link</Link>
                    </Button>
                    <Link
                        href="/login"
                        className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors hover:underline"
                    >
                        <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
                        Voltar para o login
                    </Link>
                </div>
            </div>
        </AuthLayout>
    )
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={null}>
            <ErrorContent />
        </Suspense>
    )
}

