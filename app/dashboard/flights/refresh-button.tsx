'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { refreshFlight } from '@/app/actions/refresh-flight'
import { toast } from 'sonner'

interface RefreshButtonProps {
    ticketId: string
    pnr: string
    lastName: string
    airline: string
}

export function RefreshButton({ ticketId, pnr, lastName, airline }: RefreshButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleRefresh = async () => {
        setLoading(true)
        try {
            const result = await refreshFlight(ticketId, pnr, lastName, airline)
            if (result.success) {
                toast.success('Flight updated successfully')
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('Failed to refresh')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button size="sm" variant="ghost" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
        </Button>
    )
}
