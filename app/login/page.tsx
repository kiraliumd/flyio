'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { AuthLayout } from '@/components/auth/auth-layout'
import Link from 'next/link'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginContent() {
    const searchParams = useSearchParams()
    const mode = searchParams.get('mode')
    const isSignup = mode === 'signup'

    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) throw error

            toast.success('Verifique seu e-mail para o link de acesso!')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout
            title={isSignup ? "A sua jornada de automação começa aqui." : "Automatize consultas de reservas aéreas."}
            subtitle={isSignup ? "Junte-se a times de travel tech que já automatizam seus fluxos com o Trigovo." : "O Trigovo replica, de forma controlada, o fluxo que usuários realizam manualmente para consultar reservas."}
            bullets={isSignup ? [
                "Configuração em menos de 1 minuto",
                "Acesso completo à infraestrutura de execução",
                "Suporte especializado para companhias aéreas"
            ] : [
                "Execução determinística e controlada",
                "Projetado para SPAs instáveis de companhias aéreas",
                "Automação segura baseada em filas e workers"
            ]}
            footerText="Utilizado por times de travel tech e operações internas."
        >
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold tracking-tight">
                        {isSignup ? "Crie sua conta" : "Acesse sua conta"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {isSignup
                            ? "Informe seu e-mail para começar seu cadastro."
                            : "Informe seu e-mail para acessar sua conta."}
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="voce@empresa.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Enviando link…' : (isSignup ? 'Começar agora' : 'Fazer login')}
                    </Button>
                </form>

                <div className="flex flex-col gap-4 text-center">
                    <div className="flex flex-col gap-1 text-sm">
                        <p className="text-muted-foreground">
                            {isSignup ? "Já tem uma conta?" : "Ainda não tem conta?"}
                        </p>
                        <Link
                            href={isSignup ? "/login" : "/login?mode=signup"}
                            className="font-bold text-primary hover:underline"
                        >
                            {isSignup ? "Fazer login" : "Fazer cadastro"}
                        </Link>
                    </div>
                    <Link
                        href="https://trigovo.com"
                        className="text-sm font-medium text-muted-foreground hover:text-primary hover:underline transition-colors"
                    >
                        Voltar para o site
                    </Link>
                </div>
            </div>
        </AuthLayout>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginContent />
        </Suspense>
    )
}
