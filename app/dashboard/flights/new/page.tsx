'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { fetchBookingDetails } from '@/app/actions/fetch-booking'

export default function AddFlightPage() {
    const [pnr, setPnr] = useState('')
    const [lastName, setLastName] = useState('')
    const [airline, setAirline] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { user } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!airline) {
            toast.error('Please select an airline')
            return
        }

        setLoading(true)

        try {
            // 1. Call Server Action (Scrape + Save)
            const result = await fetchBookingDetails(pnr, lastName, airline as any)

            // The action now handles DB insertion and throws error if it fails

            toast.success('Flight added successfully!')
            router.push('/dashboard/flights')
            router.refresh()

        } catch (error: any) {
            console.error(error)
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Add New Flight</h1>
                <p className="text-muted-foreground">
                    Enter the PNR and passenger details to start monitoring.
                </p>
            </div>

            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle>Flight Details</CardTitle>
                    <CardDescription>
                        We'll validate the PNR and fetch the flight status automatically.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="airline">Airline</Label>
                            <Select onValueChange={setAirline} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select airline" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LATAM">LATAM</SelectItem>
                                    <SelectItem value="GOL">GOL</SelectItem>
                                    <SelectItem value="AZUL">AZUL</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pnr">PNR Code</Label>
                                <Input
                                    id="pnr"
                                    placeholder="PNR (6 digits) or Order ID (13+ digits)"
                                    value={pnr}
                                    onChange={(e) => setPnr(e.target.value)}
                                    required
                                    maxLength={20}
                                    className="uppercase"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastname">Passenger Last Name</Label>
                                <Input
                                    id="lastname"
                                    placeholder="e.g. SILVA"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    className="uppercase"
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Validating & Adding...' : 'Add Flight'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
