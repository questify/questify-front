import { ReactNode } from "react"
import { cn } from "../../utils/cn"

type NavKey = "dashboard" | "objectives" | "board" | "competition" | "rewards" | "stats" | "settings"

type NavItem = {
    key: NavKey
    label: string
    icon: ReactNode
}

type Props = {
    items: NavItem[]
    active: NavKey
    onChange: (key: NavKey) => void
}

export function TopNav({ items, active, onChange }: Props) {
    return (
        <header className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-purple-600 via-pink-500 to-blue-500 text-white shadow-lg flex flex-col items-center py-16 px-16">
            <h1 className="text-3xl font-extrabold mb-8">🏆 Questify</h1>
            <nav className="flex max-w-full flex-wrap gap-3">
                {items.map(it => (
                    <button
                        key={it.key}
                        onClick={() => onChange(it.key)}
                        className={cn("inline-flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-sm sm:text-base font-semibold transition-all border shadow-sm", active === it.key ?
                            "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-lg shadow-purple-500/20 ring-1 ring-purple-400/30" :
                            "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow")}
                    >
                        {it.icon}
                        <span>{it.label}</span>
                    </button>
                ))}
            </nav>
        </header>
    )
}