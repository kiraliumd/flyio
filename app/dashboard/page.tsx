import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plane, CheckCircle, Clock, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { calculateCheckinStatus, Airline } from "@/lib/business-rules"

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Buscar dados
    const { data: tickets } = await supabase
        .from('tickets')
        .select('*, flights(*)')
        .eq('agency_id', user?.id)
        .neq('status', 'Cancelado')
        .neq('status', 'Completo')

    // Calcular Métricas
    const activeFlights = tickets?.length || 0

    const checkinOpenCount = tickets?.filter(t => {
        // Fallback para flight_date se não tiver relação com flights (embora deva ter)
        const flightDate = t.flights?.departure_date || t.flight_date
        if (!flightDate) return false

        const { isCheckinOpen } = calculateCheckinStatus(t.airline as Airline, new Date(flightDate))
        return isCheckinOpen
    }).length || 0

    const next24hCount = tickets?.filter(t => {
        const flightDateStr = t.flights?.departure_date || t.flight_date
        if (!flightDateStr) return false

        const flightDate = new Date(flightDateStr)
        const now = new Date()
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

        return flightDate >= now && flightDate <= tomorrow
    }).length || 0

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Painel</h2>

            <div className="grid gap-4 md:grid-cols-3">
                {/* CARD 1 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Voos Ativos</CardTitle>
                        <Plane className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeFlights}</div>
                        <p className="text-xs text-muted-foreground">Passageiros aguardando embarque</p>
                    </CardContent>
                </Card>

                {/* CARD 2 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Check-in Aberto</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{checkinOpenCount}</div>
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">Ação necessária</p>
                            {checkinOpenCount > 0 && (
                                <Link href="/dashboard/flights" className="text-xs text-blue-600 flex items-center hover:underline">
                                    Ver lista <ArrowRight className="h-3 w-3 ml-1" />
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* CARD 3 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Próximas 24h</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{next24hCount}</div>
                        <p className="text-xs text-muted-foreground">Embarques confirmados para breve</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
