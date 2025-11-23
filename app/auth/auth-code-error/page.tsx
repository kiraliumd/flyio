import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthErrorPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center text-destructive">Authentication Error</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <p className="text-center text-muted-foreground">
                        There was an error logging you in. The link may have expired or is invalid.
                    </p>
                    <Button asChild>
                        <Link href="/login">Try Again</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
