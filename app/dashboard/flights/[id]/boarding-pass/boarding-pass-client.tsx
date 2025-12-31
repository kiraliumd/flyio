"use client"

import { useRef, useState } from "react"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { HugeiconsIcon } from '@hugeicons/react'
import { PrinterIcon } from "@hugeicons/core-free-icons"
import { TicketLayout } from "@/components/boarding-pass/ticket-layout"

interface BoardingPassClientProps {
    ticket: any
    flight: any
    agency: any
}

export function BoardingPassClient({
    ticket,
    flight,
    agency,
}: BoardingPassClientProps) {
    console.log('[BoardingPassClient] Rendering client component', { ticketId: ticket?.id })
    const [hasHandBag, setHasHandBag] = useState(true)
    const [hasCheckedBag, setHasCheckedBag] = useState(false)
    const [showAgencyLogo, setShowAgencyLogo] = useState(true)

    const componentRef = useRef<HTMLDivElement>(null)
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `BoardingPass-${ticket.pnr}`,
    })

    // Parse Itinerary Details
    const details = ticket.itinerary_details as any || {}

    // Fallback if no rich data
    const passengers = details.passengers || [{
        name: `${ticket.passenger_name} ${ticket.passenger_lastname}`,
        seat: ticket.seat || "---",
        group: ticket.group || "C"
    }]

    const segments = details.segments || [{
        flightNumber: flight.flight_number,
        origin: flight.origin,
        destination: flight.destination,
        date: flight.departure_date,
        arrivalDate: null // Will calculate fallback in layout
    }]

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
            {/* Controls Section */}
            <div className="lg:col-span-1 h-fit border border-[#e6e9f2] rounded-2xl p-4 flex flex-col gap-4">
                {/* Header */}
                <div className="flex flex-col gap-[3px] shrink-0">
                    <h3 className="text-lg font-medium leading-normal text-[#191e3b]">
                        Configurar Emissão
                    </h3>
                </div>

                {/* Separador */}
                <div className="h-px w-full bg-[#e6e9f2] shrink-0" />

                {/* Content */}
                <div className="flex flex-col gap-6 flex-1">
                    {/* Bagagens Section */}
                    <div className="flex flex-col gap-4">
                        <h4 className="text-sm font-medium leading-5 text-[#191e3b]">
                            Bagagens
                        </h4>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="handbag"
                                checked={hasHandBag}
                                onCheckedChange={(c) => setHasHandBag(!!c)}
                            />
                            <Label htmlFor="handbag" className="text-sm font-normal leading-5 text-[#4b5173] cursor-pointer">
                                Incluir Mala de Mão (10kg)
                            </Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="checkedbag"
                                checked={hasCheckedBag}
                                onCheckedChange={(c) => setHasCheckedBag(!!c)}
                            />
                            <Label htmlFor="checkedbag" className="text-sm font-normal leading-5 text-[#4b5173] cursor-pointer">
                                Incluir Bagagem Despachada (23kg)
                            </Label>
                        </div>
                    </div>

                    {/* Branding Section */}
                    <div className="flex flex-col gap-4">
                        <h4 className="text-sm font-medium leading-5 text-[#191e3b]">
                            Branding
                        </h4>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="logo-mode" className="text-sm font-normal leading-5 text-[#4b5173] cursor-pointer">
                                Exibir Logo da Agência
                            </Label>
                            <Switch
                                id="logo-mode"
                                checked={showAgencyLogo}
                                onCheckedChange={setShowAgencyLogo}
                            />
                        </div>
                    </div>

                    {/* Button */}
                    <div className="pt-2">
                        <Button 
                            className="w-full bg-[#fddb32] hover:bg-[#fddb32]/90 text-[#191e3b] h-8 px-3 py-0 rounded-lg gap-1.5" 
                            onClick={() => handlePrint()}
                        >
                            <HugeiconsIcon icon={PrinterIcon} className="size-4" />
                            <span className="text-sm font-medium leading-5">
                                Gerar PDF / Imprimir
                            </span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="lg:col-span-2 bg-gray-100 rounded-xl border border-gray-200 p-8 flex items-start justify-center overflow-auto">
                <div className="scale-75 lg:scale-90 xl:scale-100 transition-transform origin-top">
                    <div ref={componentRef} className="space-y-8 p-4 bg-gray-100 print:bg-white print:p-0">
                        <div className="print:break-after-page">
                            <TicketLayout
                                passengers={passengers}
                                trips={ticket.itinerary_details?.trips || [{ type: 'IDA', segments: segments }]}
                                agency={showAgencyLogo ? agency : undefined}
                                options={{ hasHandBag, hasCheckedBag }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
