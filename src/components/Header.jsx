import { MapPin } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import PreferencesPill from './PreferencesPill'

export default function Header({ area, preferencesSummary, onEditPreferences }) {
    return (
        <header className="h-14 px-4 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
                    <MapPin className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="hidden sm:block leading-tight">
                    <h1 className="text-base font-semibold tracking-tight">
                        Perfect<span className="text-primary">Walk</span>
                    </h1>
                    <p className="text-[11px] text-muted-foreground">Plan your perfect route</p>
                </div>
            </div>

            <div className="flex-1 flex justify-center px-4">
                <PreferencesPill area={area} summary={preferencesSummary} onEdit={onEditPreferences} />
            </div>

            <div className="flex items-center gap-1">
                <ThemeToggle />
            </div>
        </header>
    )
}
