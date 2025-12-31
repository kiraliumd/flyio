'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete04Icon } from '@hugeicons/core-free-icons'
import { deleteFlight } from '@/app/actions/delete-flight'
import { toast } from 'sonner'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DeleteFlightButtonProps {
    ticketId: string
}

export function DeleteFlightButton({ ticketId }: DeleteFlightButtonProps) {
    const [mounted, setMounted] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleDelete = async () => {
        setLoading(true)
        try {
            const result = await deleteFlight(ticketId)
            if (result.success) {
                toast.success('Voo excluído com sucesso')
            } else {
                toast.error(result.error || 'Falha ao excluir voo')
            }
        } catch (error) {
            toast.error('Ocorreu um erro inesperado')
        } finally {
            setLoading(false)
        }
    }

    if (!mounted) {
        return (
            <Button size="icon" variant="ghost" className="h-4 w-4 p-0 hover:bg-transparent" disabled>
                <HugeiconsIcon icon={Delete04Icon} className="size-4 text-[#ef4444]" />
            </Button>
        )
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-4 w-4 p-0 hover:bg-transparent" disabled={loading}>
                    <HugeiconsIcon icon={Delete04Icon} className="size-4 text-[#ef4444]" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o voo dos seus registros.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                        {loading ? 'Excluindo...' : 'Excluir'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
