'use client'

import { usePathname } from 'next/navigation'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import React from 'react'

const ROUTE_MAPPING: Record<string, string> = {
    'dashboard': 'Visão Geral',
    'flights': 'Reservas',
    'settings': 'Configurações',
    'boarding-pass': 'Cartão de Embarque',
    'onboarding': 'Boas-vindas'
}

export function DashboardBreadcrumbs() {
    const pathname = usePathname()
    const segments = pathname.split('/').filter(Boolean)

    // Remove "dashboard" from the segments to avoid redundancy if we hardcode the root
    // But let's keep it flexible. 
    // Actually, usually "Plataforma" or "Home" is the root.
    // Let's assume /dashboard is the root for the breadcrumb logic here.

    const breadcrumbItems = segments.map((segment, index) => {
        const isLast = index === segments.length - 1
        const href = `/${segments.slice(0, index + 1).join('/')}`

        // Handle dynamic segments (UUIDs)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)

        let label = ROUTE_MAPPING[segment] || segment

        if (isUUID) {
            label = 'Detalhes'
        }

        // Special case: if previous segment was 'flights' and this is a UUID, maybe "Detalhes da Reserva"?
        if (isUUID && segments[index - 1] === 'flights') {
            label = 'Detalhes da Reserva'
        }

        return {
            href,
            label,
            isLast
        }
    })

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">Plataforma</BreadcrumbLink>
                </BreadcrumbItem>

                {breadcrumbItems.length > 0 && <BreadcrumbSeparator />}

                {breadcrumbItems.map((item, index) => {
                    // Skip the "dashboard" segment itself if we already have "Plataforma" as root
                    if (item.href === '/dashboard') return null

                    return (
                        <React.Fragment key={item.href}>
                            <BreadcrumbItem>
                                {item.isLast ? (
                                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!item.isLast && <BreadcrumbSeparator />}
                        </React.Fragment>
                    )
                })}
            </BreadcrumbList>
        </Breadcrumb>
    )
}
