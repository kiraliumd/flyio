'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import {
    DashboardSquare01Icon,
    Airplane01Icon,
    Settings01Icon,
    Logout01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'

const sidebarItems = [
    {
        title: 'Painel',
        href: '/dashboard',
        icon: DashboardSquare01Icon,
    },
    {
        title: 'Voos',
        href: '/dashboard/flights',
        icon: Airplane01Icon,
    },
    {
        title: 'Configurações',
        href: '/dashboard/settings',
        icon: Settings01Icon,
    },
]

export function DashboardSidebar() {
    const pathname = usePathname()
    const { signOut } = useAuth()

    return (
        <div className="flex h-full w-full flex-col">
            <div className="flex h-14 items-center border-b border-sidebar-border px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
                    <HugeiconsIcon icon={Airplane01Icon} className="size-6" />
                    <span>Flyio</span>
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-4">
                <nav className="grid items-start px-4 text-sm font-medium">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                pathname === item.href
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                    : "text-sidebar-foreground/70"
                            )}
                        >
                            <HugeiconsIcon icon={item.icon} className="size-4" />
                            {item.title}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="border-t border-sidebar-border p-4">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    onClick={() => signOut()}
                >
                    <HugeiconsIcon icon={Logout01Icon} className="size-4" />
                    Sair
                </Button>
            </div>
        </div>
    )
}
