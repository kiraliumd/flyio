'use client'

import * as React from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Tick01Icon, Activity01Icon } from '@hugeicons/core-free-icons'
import Link from 'next/link'

interface AuthLayoutProps {
    children: React.ReactNode
    title: string
    subtitle: string
    bullets: string[]
    footerText?: string
}

export function AuthLayout({
    children,
    title,
    subtitle,
    bullets,
    footerText
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen w-full flex-col-reverse lg:flex-row bg-background">
            {/* Left side: Institutional/Context */}
            <div className="flex flex-col justify-between bg-neutral-50/50 p-8 lg:w-1/2 lg:p-12 xl:p-16 border-t lg:border-t-0 lg:border-r">
                <div className="flex flex-col gap-12">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <HugeiconsIcon icon={Activity01Icon} className="size-6" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Trigovo</span>
                    </Link>

                    {/* Content */}
                    <div className="flex flex-col gap-6 max-w-lg">
                        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
                            {title}
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            {subtitle}
                        </p>

                        <ul className="flex flex-col gap-4 mt-2">
                            {bullets.map((bullet, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <HugeiconsIcon icon={Tick01Icon} className="size-5 mt-0.5 text-primary" />
                                    <span className="text-base font-medium">{bullet}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                {footerText && (
                    <p className="mt-12 text-sm text-muted-foreground/80">
                        {footerText}
                    </p>
                )}
            </div>

            {/* Right side: Form/Action */}
            <div className="flex items-center justify-center bg-background p-8 lg:w-1/2 lg:p-12 xl:p-16">
                <div className="w-full max-w-sm">
                    {children}
                </div>
            </div>
        </div>
    )
}
