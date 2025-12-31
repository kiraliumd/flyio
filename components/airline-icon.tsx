"use client"

import Image from "next/image"
import { HugeiconsIcon } from '@hugeicons/react'
import { PlaneIcon } from '@hugeicons/core-free-icons'

interface AirlineIconProps {
    airline: string
    className?: string
}

export function AirlineIcon({ airline, className = "" }: AirlineIconProps) {
    const airlineUpper = airline?.toUpperCase() || ""
    
    // Retorna o caminho do SVG e cor de fundo conforme Figma
    const getAirlineStyle = () => {
        switch (airlineUpper) {
            case "LATAM":
                return {
                    bg: "#2a0088",
                    svg: "/Property 1=Latam.svg"
                }
            case "GOL":
                return {
                    bg: "#ff7020",
                    svg: "/Property 1=Gol.svg"
                }
            case "AZUL":
                return {
                    bg: "#041e42",
                    svg: "/Property 1=Azul.svg"
                }
            default:
                return {
                    bg: "#f1f3f9",
                    svg: null
                }
        }
    }

    const style = getAirlineStyle()

    return (
        <div 
            className={`size-4 rounded-[2px] flex items-center justify-center shrink-0 overflow-hidden ${className}`}
        >
            {style.svg ? (
                <Image
                    src={style.svg}
                    alt={airline}
                    width={16}
                    height={16}
                    className="size-4 object-contain"
                    unoptimized
                />
            ) : (
                <div 
                    className="size-4 rounded-[2px] flex items-center justify-center"
                    style={{ backgroundColor: style.bg }}
                >
                    <HugeiconsIcon icon={PlaneIcon} className="size-3 text-[#191e3b]" />
                </div>
            )}
        </div>
    )
}

