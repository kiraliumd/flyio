import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ExternalLink, Plus, Download, Trash2 } from 'lucide-react'
import { calculateCheckinStatus } from '@/lib/business-rules'
import { DeleteFlightButton } from './delete-flight-button'
import { AddFlightDialog } from '@/components/dashboard/add-flight-dialog'
import { EditPassengerNameDialog } from '@/components/dashboard/edit-passenger-name-dialog'
import Link from 'next/link'

export const revalidate = 0

function getCheckinUrl(airline: string, pnr: string, lastName: string) {
    switch (airline) {
        case 'LATAM':
            return `https://www.latamairlines.com/br/pt/checkin?orderId=${pnr}&lastName=${lastName}`
        case 'GOL':
            return 'https://b2c.voegol.com.br/check-in/'
        case 'AZUL':
            return 'https://www.voeazul.com.br/check-in'
        default:
            return '#'
    }
}

export default async function FlightsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: tickets } = await supabase
        .from('tickets')
        .select('*, flights(flight_number, origin, destination, status, departure_date)')
        .eq('agency_id', user?.id)
        .order('flight_date', { ascending: true })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Voos</h2>
                <AddFlightDialog />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Todos os Voos</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Localizador</TableHead>
                                <TableHead>Sobrenome</TableHead>
                                <TableHead>Check-in</TableHead>
                                <TableHead>Rota</TableHead>
                                <TableHead>Embarque</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tickets?.map((ticket: any) => {
                                // Use normalized data from flights table if available, fallback to ticket (legacy)
                                const flight = ticket.flights || ticket
                                const flightDate = flight.departure_date || ticket.flight_date
                                const origin = flight.origin || ticket.origin
                                const destination = flight.destination || ticket.destination
                                const status = flight.status || ticket.status

                                const checkinStatus = calculateCheckinStatus(ticket.airline as any, new Date(flightDate))
                                const checkinUrl = getCheckinUrl(ticket.airline, ticket.pnr, ticket.passenger_lastname)

                                function getStatusVariant(status: string) {
                                    switch (status) {
                                        case 'Cancelado': return 'destructive'
                                        case 'Atrasado': return 'warning'
                                        case 'Confirmado': return 'success'
                                        case 'Completo': return 'neutral'
                                        default: return 'secondary'
                                    }
                                }

                                return (
                                    <TableRow key={ticket.id}>
                                        <TableCell>{ticket.airline}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(status)}>
                                                {status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="truncate max-w-[150px]" title={ticket.passenger_name}>
                                                    {ticket.passenger_name}
                                                </span>
                                                <EditPassengerNameDialog
                                                    ticketId={ticket.id}
                                                    currentName={ticket.passenger_name}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell>{ticket.pnr}</TableCell>
                                        <TableCell>{ticket.passenger_lastname}</TableCell>
                                        <TableCell>
                                            <Badge variant={checkinStatus.isCheckinOpen ? 'success' : 'secondary'}>
                                                {checkinStatus.isCheckinOpen ? 'Aberto' : 'Fechado'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {origin} ✈️ {destination}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(flightDate), 'dd/MM/yyyy')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="icon" variant="ghost">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" asChild>
                                                    <a href={checkinUrl} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                                <DeleteFlightButton ticketId={ticket.id} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
