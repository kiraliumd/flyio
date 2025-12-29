"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
    DashboardSquare01Icon,
    Airplane01Icon,
    Settings01Icon,
    Activity01Icon,
} from "@hugeicons/core-free-icons"

import { NavUser } from "@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navMain = [
    {
        title: "Painel",
        url: "/dashboard",
        icon: DashboardSquare01Icon,
    },
    {
        title: "Voos",
        url: "/dashboard/flights",
        icon: Airplane01Icon,
    },
    {
        title: "Configurações",
        url: "/dashboard/settings",
        icon: Settings01Icon,
    },
]

export function AppSidebar({ user }: { user: { name: string; email: string } }) {
    const pathname = usePathname()

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <HugeiconsIcon icon={Activity01Icon} className="size-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold">Flyio</span>
                                    <span className="">Enterprise</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
                    <SidebarMenu>
                        {navMain.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                                    <Link href={item.url}>
                                        <HugeiconsIcon icon={item.icon} />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
