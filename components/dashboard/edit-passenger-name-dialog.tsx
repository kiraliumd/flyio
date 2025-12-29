'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { updatePassengerName } from '@/app/actions/update-passenger-name'
import { HugeiconsIcon } from '@hugeicons/react'
import { PencilIcon } from '@hugeicons/core-free-icons'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'

interface EditPassengerNameDialogProps {
    ticketId: string
    currentName: string
}

export function EditPassengerNameDialog({ ticketId, currentName }: EditPassengerNameDialogProps) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState(currentName)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Regex validation: Letters, numbers, and spaces only
        const isValid = /^[a-zA-Z0-9\s]+$/.test(name)
        if (!isValid) {
            toast.error('O nome deve conter apenas letras, números e espaços.')
            return
        }

        setLoading(true)

        try {
            const result = await updatePassengerName(ticketId, name)

            if (result.success) {
                toast.success('Nome do passageiro atualizado')
                setOpen(false)
                router.refresh()
            } else {
                toast.error(result.error || 'Falha ao atualizar nome')
            }
        } catch (error) {
            toast.error('Ocorreu um erro inesperado')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary">
                    <HugeiconsIcon icon={PencilIcon} className="size-4" />
                    <span className="sr-only">Editar nome</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Alterar nome de cliente</DialogTitle>
                    <DialogDescription>
                        Máximo de 100 caracteres. Apenas letras e números são permitidos.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="sr-only">
                                Nome do cliente
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Digite nome do cliente"
                                maxLength={100}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
