import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HugeiconsIcon } from '@hugeicons/react'
import {
    Airplane01Icon,
    CheckmarkCircle01Icon,
    Clock01Icon,
    ArrowRight01Icon,
    Legal01Icon,
    Shield01Icon
} from '@hugeicons/core-free-icons'
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { calculateCheckinStatus, Airline } from "@/lib/business-rules"
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
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

    // Legal Intelligence Logic
    const legalOpportunities = tickets?.filter(t => {
        const flightDateStr = t.flights?.departure_date || t.flight_date
        if (!flightDateStr) return false

        const flightDate = new Date(flightDateStr)
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        // Filter last 30 days
        if (flightDate < thirtyDaysAgo || flightDate > now) return false

        const status = t.flights?.status || t.status
        const delay = t.flights?.delay_minutes || 0

        // Cancelled OR Delayed > 4 hours (240 mins)
        return status === 'Cancelado' || (status === 'Atrasado' && delay >= 240)
    }) || []

    const legalCount = legalOpportunities.length
    const potentialValue = legalCount * 5000

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Painel</h2>

            <div className="grid gap-4 md:grid-cols-3">
                {/* CARD 1 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Voos Ativos</CardTitle>
                        <HugeiconsIcon icon={Airplane01Icon} className="size-4 text-blue-600" />
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
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{checkinOpenCount}</div>
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">Ação necessária</p>
                            {checkinOpenCount > 0 && (
                                <Link href="/dashboard/flights" className="text-xs text-blue-600 flex items-center hover:underline">
                                    Ver lista <HugeiconsIcon icon={ArrowRight01Icon} className="size-3 ml-1" />
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* CARD 3 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Próximas 24h</CardTitle>
                        <HugeiconsIcon icon={Clock01Icon} className="size-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{next24hCount}</div>
                        <p className="text-xs text-muted-foreground">Embarques confirmados para breve</p>
                    </CardContent>
                </Card>
            </div>

            {/* Legal Intelligence Widget */}
            <div className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${legalCount > 0 ? 'bg-blue-50' : 'bg-blue-50'}`}>
                            {legalCount > 0 ? (
                                <HugeiconsIcon icon={Legal01Icon} className="size-6 text-blue-600" />
                            ) : (
                                <HugeiconsIcon icon={Shield01Icon} className="size-6 text-blue-600" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                                {legalCount > 0 ? 'Oportunidades Jurídicas Detectadas' : 'Monitoramento Ativo'}
                            </h3>
                            {legalCount > 0 ? (
                                <p className="text-sm text-slate-500">
                                    {legalCount} casos elegíveis nos últimos 30 dias.
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Sua agência conta com assessoria jurídica gratuita da <span className="font-semibold text-blue-700">Aviar Soluções Aéreas</span> para casos elegíveis de atraso ou cancelamento.
                                </p>
                            )}
                        </div>
                    </div>
                    {legalCount > 0 && (
                        <div className="text-right">
                            <p className="text-sm font-medium text-slate-500">Potencial Estimado</p>
                            <p className="text-2xl font-bold text-blue-700">
                                R$ {potentialValue.toLocaleString('pt-BR')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Simplified List of Opportunities */}
                {legalCount > 0 && (
                    <div className="mt-6 space-y-4">
                        {legalOpportunities.sort((a, b) => new Date(b.flight_date).getTime() - new Date(a.flight_date).getTime()).map((ticket) => {
                            const isCancelled = ticket.status === 'Cancelado' || ticket.flights?.status === 'Cancelado'
                            const delay = ticket.flights?.delay_minutes || 0
                            const flightDate = ticket.flights?.departure_date || ticket.flight_date
                            // Data formatada simples: "24 nov"
                            const dateStr = new Date(flightDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

                            return (
                                <div key={ticket.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    {/* Lado Esquerdo: PNR e Data */}
                                    <div className="flex flex-col">
                                        <span className="font-mono text-sm font-bold text-slate-900 tracking-wide">
                                            {ticket.pnr}
                                        </span>
                                        <span className="text-[10px] text-slate-500 uppercase font-medium">
                                            {dateStr} • {ticket.origin}
                                        </span>
                                    </div>
                                    {/* Lado Direito: Badge de Problema */}
                                    <Badge variant={isCancelled ? "destructive" : "default"} className={`h-6 px-2 text-[10px] ${!isCancelled ? 'bg-orange-500 hover:bg-orange-600' : ''}`}>
                                        {isCancelled ? 'Cancelado' : `Atraso ${(delay / 60).toFixed(0)}h`}
                                    </Badge>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
