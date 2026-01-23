import { MapPin } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

export default function Header() {
    return (
        <header className="header-premium px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="logo-glow p-2.5 rounded-2xl text-white">
                    <MapPin className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-500 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
                        PerfectWalk
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                        Plan your perfect route
                    </p>
                </div>
            </div>
            <ThemeToggle />
        </header>
    )
}
