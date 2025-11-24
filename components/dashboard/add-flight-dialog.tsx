'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { fetchBookingDetails } from '@/app/actions/fetch-booking'
import { Plus } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogOverlay
} from '@/components/ui/dialog'

export function AddFlightDialog() {
    const [open, setOpen] = useState(false)
    const [pnr, setPnr] = useState('')
    const [lastName, setLastName] = useState('')
    const [airline, setAirline] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!airline) {
            toast.error('Por favor selecione uma companhia aérea')
            return
        }

        setLoading(true)

        try {
            await fetchBookingDetails(pnr, lastName, airline as any)

            toast.success('Voo adicionado com sucesso!')
            setOpen(false)
            router.refresh()

            // Reset form
            setPnr('')
            setLastName('')
            setAirline('')

        } catch (error: any) {
            console.error(error)
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Voo
                </Button>
            </DialogTrigger>
            <DialogOverlay className="bg-black/25 backdrop-blur-sm" />
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Voo</DialogTitle>
                    <DialogDescription>
                        Insira o PNR e os detalhes do passageiro para iniciar o monitoramento.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="airline">Companhia Aérea</Label>
                        <Select onValueChange={setAirline} value={airline} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a companhia" />
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
                            <Label htmlFor="pnr">Código PNR</Label>
                            <Input
                                id="pnr"
                                placeholder="PNR (6 dígitos)"
                                value={pnr}
                                onChange={(e) => setPnr(e.target.value)}
                                required
                                maxLength={20}
                                className="uppercase"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastname">Sobrenome</Label>
                            <Input
                                id="lastname"
                                placeholder="ex: SILVA"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                className="uppercase"
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Validando...' : 'Adicionar Voo'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
