import { MapPin, Settings2 } from 'lucide-react'

export default function PreferencesPill({ area, summary, onEdit }) {
    if (!area) return null

    return (
        <button
            onClick={onEdit}
            className="h-9 px-3 flex items-center gap-2 rounded-full bg-secondary/60 hover:bg-secondary border border-border/50 text-sm font-medium transition-colors focus-ring"
            aria-label="Edit area and preferences"
        >
            <MapPin className="w-4 h-4 text-primary" />
            <span className="max-w-[140px] truncate">{area}</span>
            {summary ? (
                <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground max-w-[160px] truncate">{summary}</span>
                </>
            ) : null}
            <Settings2 className="w-4 h-4 text-muted-foreground" />
        </button>
    )
}

