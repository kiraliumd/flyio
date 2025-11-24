import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Plane, Calendar, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { AddFlightDialog } from '@/components/dashboard/add-flight-dialog'
import { createClient } from '@supabase/supabase-js'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

// Server-side Supabase client for data fetching
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const revalidate = 0 // Disable caching for real-time updates

export default async function DashboardPage() {
    // Fetch flights
    const { data: flights, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching flights:', error)
    }

    const totalFlights = flights?.length || 0
    const activeCheckins = flights?.filter(f => f.checkin_status === 'Aberto').length || 0

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Painel</h2>
                <AddFlightDialog />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total de Voos
                        </CardTitle>
                        <Plane className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalFlights}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Check-ins Ativos
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeCheckins}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Voos Recentes</CardTitle>
                        <CardDescription>
                            Seus voos monitorados e seus status.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!flights || flights.length === 0 ? (
                            <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">Nenhum voo encontrado</p>
                                    <div className="mt-2">
                                        <AddFlightDialog />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {flights.map((flight) => (
                                    <div
                                        key={flight.id}
                                        className="flex items-center justify-between rounded-lg border p-4"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                <Plane className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{flight.airline} - {flight.flight_number}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    PNR: {flight.pnr} • {flight.passenger_lastname}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(flight.flight_date), 'dd/MM/yyyy')}
                                                </div>
                                                <p className="text-sm font-medium">{flight.origin} → {flight.destination}</p>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <Badge variant={flight.status === 'Confirmado' ? 'default' : 'destructive'}>
                                                    {flight.status}
                                                </Badge>
                                                <Badge variant={flight.checkin_status === 'Aberto' ? 'success' : 'secondary'}>
                                                    Check-in: {flight.checkin_status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
