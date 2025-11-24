import { cn } from "@/lib/utils"

interface UserAvatarProps {
    name?: string | null
    email?: string | null
    className?: string
}

function getGradient(identifier: string) {
    const gradients = [
        "from-pink-500 to-rose-500",
        "from-orange-400 to-pink-600",
        "from-blue-400 to-indigo-600",
        "from-purple-500 to-indigo-500",
        "from-emerald-400 to-cyan-500",
        "from-teal-400 to-emerald-500",
        "from-fuchsia-500 to-pink-500",
        "from-rose-400 to-orange-300",
    ]

    let hash = 0
    for (let i = 0; i < identifier.length; i++) {
        hash = identifier.charCodeAt(i) + ((hash << 5) - hash)
    }

    const index = Math.abs(hash) % gradients.length
    return gradients[index]
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map(part => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

export function UserAvatar({ name, email, className }: UserAvatarProps) {
    const identifier = name || email || "User"
    const gradient = getGradient(identifier)
    const initials = getInitials(identifier)

    return (
        <div
            className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white font-medium shadow-sm",
                gradient,
                className
            )}
        >
            {initials}
        </div>
    )
}
