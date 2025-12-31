import { AppSidebar } from "@/components/app-sidebar"
import { DashboardBreadcrumbs } from "@/components/dashboard-breadcrumbs"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if agency has completed onboarding
    const { data: agency } = await supabase
        .from('agencies')
        .select('cnpj, name')
        .eq('id', user.id)
        .single()

    if (!agency?.cnpj) {
        redirect('/onboarding')
    }

    const userData = {
        name: agency?.name || user.email || 'Usuário',
        email: user.email || '',
    }

    return (
        <SidebarProvider
            defaultOpen={true}
            style={{
                "--sidebar-width": "255px",
                "--sidebar-width-mobile": "20rem",
            } as React.CSSProperties}
        >
            <AppSidebar user={userData} />

            <SidebarInset className="overflow-hidden bg-white">
                <header className="flex h-16 shrink-0 items-center gap-2 px-4 sticky top-0 z-10 bg-white backdrop-blur-sm border-b border-[#e6e9f2]">
                    <div className="w-full max-w-[1600px] mx-auto flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <DashboardBreadcrumbs />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4">
                    <div className="mx-auto w-full max-w-[1600px]">
                        {children}
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
