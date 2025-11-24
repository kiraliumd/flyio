import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthErrorPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center text-destructive">Erro de Autenticação</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <p className="text-center text-muted-foreground">
                        Houve um erro ao fazer login. O link pode ter expirado ou é inválido.
                    </p>
                    <Button asChild>
                        <Link href="/login">Tentar Novamente</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
