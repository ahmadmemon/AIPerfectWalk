import { useMemo, useState } from 'react'
import { Coffee, Trees, Utensils, MapPin, Plus, Star, Footprints, LocateFixed } from 'lucide-react'

const iconMap = {
    coffee: Coffee,
    trail: Footprints,
    park: Trees,
    food: Utensils,
    viewpoint: MapPin,
    landmark: MapPin,
}

const colorMap = {
    coffee: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
    trail: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
    park: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
    food: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
    viewpoint: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
    landmark: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
}

export default function SuggestionCard({ suggestion, onAddToRoute, onPreview }) {
    const type = suggestion.type || 'coffee'
    const Icon = iconMap[type] || MapPin
    const colors = colorMap[type] || colorMap.coffee
    const [showPhoto, setShowPhoto] = useState(Boolean(suggestion.photoUrl))

    const popularityBadge = {
        'High': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
        'Medium': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
        'Local Favorite': { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400' },
    }

    const badge = popularityBadge[suggestion.popularity] || popularityBadge['Medium']

    const previewPayload = useMemo(() => {
        if (typeof suggestion.lat !== 'number' || typeof suggestion.lng !== 'number') return null
        return {
            id: suggestion.placeId || suggestion.id,
            placeId: suggestion.placeId || suggestion.id,
            name: suggestion.name,
            address: suggestion.address || suggestion.description || '',
            lat: suggestion.lat,
            lng: suggestion.lng,
            photoUrl: suggestion.photoUrl || null,
            rating: typeof suggestion.rating === 'number' ? suggestion.rating : null,
            userRatingsTotal: suggestion.userRatingsTotal ?? null,
            isOpenNow: suggestion.isOpenNow ?? null,
            type: suggestion.type || null,
        }
    }, [suggestion])

    return (
        <div className="rounded-3xl border border-border/50 bg-secondary/40 hover:bg-secondary/60 transition-colors animate-fade-in overflow-hidden">
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-2xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-sm leading-tight truncate">{suggestion.name}</h3>
                            {suggestion.popularity && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${badge.bg} ${badge.text}`}>
                                    {suggestion.popularity === 'Local Favorite' ? '♥ Favorite' : suggestion.popularity}
                                </span>
                            )}
                        </div>

                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {suggestion.description || suggestion.address}
                        </p>

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {typeof suggestion.rating === 'number' && (
                                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-background/40 border border-border/50 text-foreground">
                                    <Star className="w-3 h-3 text-warning" />
                                    {suggestion.rating.toFixed(1)}
                                    {suggestion.userRatingsTotal ? (
                                        <span className="text-muted-foreground">
                                            ({suggestion.userRatingsTotal})
                                        </span>
                                    ) : null}
                                </span>
                            )}
                            {typeof suggestion.distanceMeters === 'number' && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-background/40 border border-border/50 text-muted-foreground">
                                    {suggestion.distanceLabel}
                                </span>
                            )}
                            {suggestion.isOpenNow === true && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-success/15 border border-success/25 text-success">
                                    Open now
                                </span>
                            )}
                            {suggestion.difficulty && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-background/40 border border-border/50 text-muted-foreground">
                                    {suggestion.difficulty}
                                </span>
                            )}
                            {suggestion.cuisine && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-background/40 border border-border/50 text-muted-foreground">
                                    {suggestion.cuisine}
                                </span>
                            )}
                        </div>
                    </div>

                    {suggestion.photoUrl && showPhoto && (
                        <div className="w-[96px] h-[72px] rounded-2xl overflow-hidden border border-border/50 bg-background/30 flex-shrink-0">
                            <img
                                src={suggestion.photoUrl}
                                alt={suggestion.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                                onError={() => setShowPhoto(false)}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="px-4 pb-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => onAddToRoute(suggestion)}
                        className={`flex-1 h-10 rounded-2xl border ${colors.border} ${colors.bg} ${colors.text} font-semibold text-sm transition-opacity hover:opacity-85 focus-ring inline-flex items-center justify-center gap-2`}
                    >
                        <Plus className="w-4 h-4" />
                        Add stop
                    </button>
                    <button
                        onClick={() => previewPayload && onPreview?.(previewPayload)}
                        disabled={!previewPayload}
                        className="h-10 w-10 rounded-2xl bg-secondary/60 hover:bg-secondary border border-border/50 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring inline-flex items-center justify-center"
                        aria-label="View on map"
                    >
                        <LocateFixed className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
