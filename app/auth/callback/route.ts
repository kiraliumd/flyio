import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)

    // Verifica se recebeu o código de autorização (PKCE)
    const code = searchParams.get('code')
    // Verifica o parâmetro 'next' para redirecionar o usuário depois (padrão: /dashboard)
    const next = searchParams.get('next') ?? '/dashboard'

    console.log('🔹 Auth Callback Initiated')
    console.log('🔹 Code:', code ? 'Present' : 'Missing')
    console.log('🔹 Next:', next)

    if (code) {
        // Next.js 16: Aguardar cookies de forma assíncrona
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // Ignorar erros se for chamado de um Server Component
                        }
                    },
                },
            }
        )

        // Troca o código pela sessão do usuário
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            console.log('✅ Auth Session Exchanged Successfully')
            // SUCESSO: Redireciona para o dashboard limpo (sem o código na URL)
            const forwardedHost = request.headers.get('x-forwarded-host') // Importante para produção (Vercel)
            const isLocalEnv = process.env.NODE_ENV === 'development'

            if (isLocalEnv) {
                // Desenvolvimento: localhost:3000
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                // Produção: usa o domínio real
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                // Fallback genérico
                return NextResponse.redirect(`${origin}${next}`)
            }
        } else {
            console.error('❌ Erro na troca de token Supabase:', error)
        }
    } else {
        console.error('❌ Auth Callback Error: No code provided')
    }

    // ERRO: Se não tiver código ou der erro, manda para uma página de erro
    console.log('⚠️ Redirecting to Auth Error Page')
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}