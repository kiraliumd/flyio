import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    // A mágica acontece aqui: atualiza a sessão antes de passar para o Server Action
    return await updateSession(request)
}

export const config = {
    matcher: [
        // Aplica em todas as rotas, exceto arquivos estáticos e imagens
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
