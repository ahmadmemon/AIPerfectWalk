import { useMemo, useState, useEffect } from 'react'
import { Coffee, Trees, Utensils, Footprints, Sparkles, Loader2, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react'
import SuggestionCard from './SuggestionCard'
import { getRecommendations, isGeminiConfigured } from '../services/geminiService'
import { getNearbySuggestions, resolvePlaceQuery } from '../services/placesService'
import GeminiChat from './GeminiChat'
import { formatMetersShort, haversineDistanceMeters } from '../utils/geo'

const categories = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, color: 'text-purple-500' },
    { id: 'coffee', label: 'Coffee', icon: Coffee, color: 'text-amber-500' },
    { id: 'trails', label: 'Trails', icon: Footprints, color: 'text-green-500' },
    { id: 'parks', label: 'Parks', icon: Trees, color: 'text-emerald-500' },
    { id: 'food', label: 'Food', icon: Utensils, color: 'text-orange-500' },
]

export default function AIRecommendations({ selectedArea, userLocation, route, onAddStop, initialCategory, onVisiblePlacesChange, onPreviewPlace }) {
    const [activeCategory, setActiveCategory] = useState(initialCategory || 'coffee')
    const [didUserPickCategory, setDidUserPickCategory] = useState(false)
    const [sortMode, setSortMode] = useState('recommended') // recommended | closest | top
    const [suggestions, setSuggestions] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)

    const location = selectedArea || userLocation

    useEffect(() => {
        // Reset sort when switching categories
        if (activeCategory === 'coffee' || activeCategory === 'food' || activeCategory === 'parks') {
            setSortMode(activeCategory === 'parks' ? 'closest' : 'top')
        } else {
            setSortMode('recommended')
        }
    }, [activeCategory])

    useEffect(() => {
        if (!didUserPickCategory && initialCategory) {
            setActiveCategory(initialCategory)
        }
    }, [didUserPickCategory, initialCategory])

    useEffect(() => {
        if (activeCategory !== 'chat' && location) {
            fetchSuggestions()
        }
    }, [activeCategory, location?.lat, location?.lng])

    const fetchSuggestions = async () => {
        if (!location) return

        setIsLoading(true)
        setError(null)

        try {
            if (activeCategory === 'coffee' || activeCategory === 'parks' || activeCategory === 'food') {
                const results = await getNearbySuggestions(activeCategory, location)
                setSuggestions(results)
                return
            }

            if (activeCategory === 'trails') {
                if (!isGeminiConfigured()) {
                    setSuggestions([])
                    setError('Gemini API is not configured')
                    return
                }

                const results = await getRecommendations(
                    activeCategory,
                    location,
                    selectedArea?.name || ''
                )

                const resolved = await Promise.all(
                    results.map(async (s) => {
                        try {
                            const match = await resolvePlaceQuery(
                                `${s.name} ${selectedArea?.name || ''}`.trim(),
                                location
                            )
                            if (match?.lat && match?.lng) {
                                return {
                                    ...s,
                                    address: match.address || s.description,
                                    lat: match.lat,
                                    lng: match.lng,
                                    rating: match.rating ?? null,
                                    userRatingsTotal: match.userRatingsTotal ?? null,
                                    photoUrl: match.photoUrl ?? null,
                                }
                            }
                        } catch {
                            // Ignore resolution errors and keep the original suggestion.
                        }
                        return s
                    })
                )

                setSuggestions(resolved)
                return
            }

            setSuggestions([])
        } catch (err) {
            setError('Failed to load suggestions')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddToRoute = (suggestion) => {
        const point = {
            lat: suggestion.lat,
            lng: suggestion.lng,
            address: suggestion.address || suggestion.name,
            name: suggestion.name,
            type: suggestion.type,
            placeId: suggestion.placeId || suggestion.id,
        }

        if (typeof point.lat === 'number' && typeof point.lng === 'number') {
            onAddStop(point)
            return
        }

        // If we don't have coordinates (e.g. Gemini trails), try resolving via Places.
        resolvePlaceQuery(`${suggestion.name} ${selectedArea?.name || ''}`.trim(), location)
            .then((match) => {
                if (match?.lat && match?.lng) {
                    onAddStop({
                        lat: match.lat,
                        lng: match.lng,
                        address: match.address || suggestion.name,
                        name: suggestion.name,
                        type: suggestion.type,
                    })
                } else {
                    // Last resort: approximate near selected area.
                    onAddStop({
                        lat: location.lat + (Math.random() - 0.5) * 0.01,
                        lng: location.lng + (Math.random() - 0.5) * 0.01,
                        address: suggestion.name,
                        name: suggestion.name,
                        type: suggestion.type,
                    })
                }
            })
            .catch(() => {
                onAddStop({
                    lat: location.lat + (Math.random() - 0.5) * 0.01,
                    lng: location.lng + (Math.random() - 0.5) * 0.01,
                    address: suggestion.name,
                    name: suggestion.name,
                    type: suggestion.type,
                })
            })
    }

    if (!location) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-secondary/60 border border-border/50 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Select an area first</h3>
                <p className="text-sm">Use the onboarding “Where” step to choose a region.</p>
            </div>
        )
    }

    const enrichedSuggestions = useMemo(() => {
        if (!location) return []
        return suggestions.map((s) => {
            if (typeof s.lat !== 'number' || typeof s.lng !== 'number') return s
            const meters = haversineDistanceMeters(location, { lat: s.lat, lng: s.lng })
            return {
                ...s,
                distanceMeters: meters,
                distanceLabel: meters != null ? formatMetersShort(meters) : undefined,
            }
        })
    }, [location, suggestions])

    const displayedSuggestions = useMemo(() => {
        const list = [...enrichedSuggestions]
        if (sortMode === 'closest') {
            list.sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity))
        } else if (sortMode === 'top') {
            list.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1))
        }
        return list
    }, [enrichedSuggestions, sortMode])

    useEffect(() => {
        if (!onVisiblePlacesChange) return
        if (activeCategory === 'chat') {
            onVisiblePlacesChange([])
            return
        }
        const pins = displayedSuggestions
            .filter((s) => typeof s.lat === 'number' && typeof s.lng === 'number')
            .map((s) => ({
                id: s.placeId || s.id,
                placeId: s.placeId || s.id,
                name: s.name,
                address: s.address || '',
                lat: s.lat,
                lng: s.lng,
                photoUrl: s.photoUrl || null,
                rating: typeof s.rating === 'number' ? s.rating : null,
                userRatingsTotal: s.userRatingsTotal ?? null,
                isOpenNow: s.isOpenNow ?? null,
                type: s.type || null,
            }))
        onVisiblePlacesChange(pins)
    }, [activeCategory, displayedSuggestions, onVisiblePlacesChange])

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="pb-4 border-b border-border/50">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h2 className="text-base font-semibold tracking-tight">Discover</h2>
                    {selectedArea?.name && (
                        <span className="text-xs text-muted-foreground truncate">
                            • {selectedArea.name}
                        </span>
                    )}
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2">
                    {categories.map((cat) => {
                        const Icon = cat.icon
                        return (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setDidUserPickCategory(true)
                                    setActiveCategory(cat.id)
                                }}
                                className={`
                  flex items-center gap-2 px-3 py-2 rounded-2xl
                  text-sm font-semibold transition-all duration-200 border focus-ring
                  ${activeCategory === cat.id
                                        ? 'bg-background text-foreground border-border/50 shadow-sm'
                                        : 'bg-secondary/60 text-muted-foreground hover:text-foreground border-border/50 hover:bg-secondary'
                                    }
                `}
                            >
                                <Icon className={`w-4 h-4 ${activeCategory === cat.id ? cat.color : ''}`} />
                                <span className="hidden sm:inline">{cat.label}</span>
                            </button>
                        )
                    })}
                </div>

                {(activeCategory === 'coffee' || activeCategory === 'food' || activeCategory === 'parks') && (
                    <div className="mt-3 flex items-center gap-2">
                        <div className="text-xs text-muted-foreground mr-1">Sort</div>
                        {[
                            { id: 'closest', label: 'Closest' },
                            { id: 'top', label: 'Top rated' },
                        ].map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setSortMode(opt.id)}
                                className={`h-9 px-3 rounded-full border text-sm font-semibold transition-colors focus-ring ${sortMode === opt.id
                                        ? 'bg-primary text-primary-foreground border-primary/30'
                                        : 'bg-secondary/60 text-muted-foreground hover:text-foreground border-border/50 hover:bg-secondary'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto pt-4">
                {activeCategory === 'chat' && !isGeminiConfigured() ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-secondary/60 border border-border/50 flex items-center justify-center">
                            <AlertCircle className="w-7 h-7 text-warning" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-2">
                            Gemini API Not Configured
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Add your Gemini API key to `.env`:
                        </p>
                        <code className="block mt-2 text-xs bg-secondary/60 border border-border/50 p-2 rounded-2xl text-foreground">
                            VITE_GEMINI_API_KEY=your_key
                        </code>
                    </div>
                ) : activeCategory === 'chat' ? (
                    <GeminiChat
                        selectedArea={selectedArea}
                        userLocation={userLocation}
                        route={route}
                        onAddStop={onAddStop}
                    />
                ) : isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-7 h-7 text-primary animate-spin mb-3" />
                        <p className="text-sm text-muted-foreground">
                            Finding the best spots...
                        </p>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <AlertCircle className="w-7 h-7 text-destructive mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground mb-3">{error}</p>
                        {error === 'Gemini API is not configured' && (
                            <code className="block mt-2 text-xs bg-secondary/60 border border-border/50 p-2 rounded-2xl text-foreground">
                                VITE_GEMINI_API_KEY=your_key
                            </code>
                        )}
                        <button
                            onClick={fetchSuggestions}
                            className="inline-flex items-center gap-2 px-4 py-2 mx-auto rounded-2xl bg-secondary/60 hover:bg-secondary border border-border/50 text-foreground text-sm font-semibold transition-colors focus-ring"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </button>
                    </div>
                ) : suggestions.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-sm text-muted-foreground">
                            No suggestions found for this area
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {displayedSuggestions.map((suggestion, index) => (
                            <div key={suggestion.id} style={{ animationDelay: `${index * 50}ms` }}>
                                <SuggestionCard
                                    suggestion={suggestion}
                                    onAddToRoute={handleAddToRoute}
                                    onPreview={onPreviewPlace}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Refresh Button */}
            {activeCategory !== 'chat' && !isLoading && suggestions.length > 0 && (
                <div className="pt-4 border-t border-border/50">
                    <button
                        onClick={fetchSuggestions}
                        className="w-full h-11 flex items-center justify-center gap-2 rounded-2xl bg-secondary/60 hover:bg-secondary border border-border/50 text-foreground font-semibold text-sm transition-colors focus-ring"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Get New Suggestions
                    </button>
                </div>
            )}
        </div>
    )
}
