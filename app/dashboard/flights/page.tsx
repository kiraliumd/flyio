import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ExternalLink, Plus, Download, Trash2 } from 'lucide-react'
import { calculateCheckinStatus } from '@/lib/business-rules'
import { PassengerNameInput } from './passenger-name-input'
import { DeleteFlightButton } from './delete-flight-button'
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
        .select('*')
        .eq('agency_id', user?.id) // Garante o filtro explícito (embora o RLS já faça isso)
        .order('flight_date', { ascending: true })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Flights</h2>
                <Button asChild>
                    <Link href="/dashboard/flights/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Flight
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Flights</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Nome (Editável)</TableHead>
                                <TableHead>Localizador</TableHead>
                                <TableHead>Sobrenome</TableHead>
                                <TableHead>Check-in</TableHead>
                                <TableHead>Rota</TableHead>
                                <TableHead>Embarque</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tickets?.map((ticket) => {
                                const checkinStatus = calculateCheckinStatus(ticket.airline as any, new Date(ticket.flight_date))
                                const checkinUrl = getCheckinUrl(ticket.airline, ticket.pnr, ticket.passenger_lastname)

                                return (
                                    <TableRow key={ticket.id}>
                                        <TableCell>{ticket.airline}</TableCell>
                                        <TableCell>
                                            <Badge variant={ticket.status === 'Confirmado' ? 'success' : 'secondary'}>
                                                {ticket.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <PassengerNameInput
                                                ticketId={ticket.id}
                                                initialName={ticket.passenger_name}
                                            />
                                        </TableCell>
                                        <TableCell>{ticket.pnr}</TableCell>
                                        <TableCell>{ticket.passenger_lastname}</TableCell>
                                        <TableCell>
                                            <Badge variant={checkinStatus.isCheckinOpen ? 'success' : 'secondary'}>
                                                {checkinStatus.isCheckinOpen ? 'Aberto' : 'Fechado'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {ticket.origin} ✈️ {ticket.destination}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(ticket.flight_date), 'dd/MM/yyyy')}
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
