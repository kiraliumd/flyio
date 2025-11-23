'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { updatePassengerName } from '@/app/actions/update-passenger-name'
import { toast } from 'sonner'

interface PassengerNameInputProps {
    ticketId: string
    initialName: string
}

export function PassengerNameInput({ ticketId, initialName }: PassengerNameInputProps) {
    const [name, setName] = useState(initialName)
    const [loading, setLoading] = useState(false)

    const handleBlur = async () => {
        if (name === initialName) return

        setLoading(true)
        try {
            const result = await updatePassengerName(ticketId, name)
            if (result.success) {
                toast.success('Passenger name updated')
            } else {
                toast.error('Failed to update name')
                setName(initialName) // Revert on error
            }
        } catch (error) {
            toast.error('Failed to update name')
            setName(initialName)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleBlur}
            disabled={loading}
            className="h-8 w-[180px]"
        />
    )
}
