import { useState, useRef, useEffect } from 'react'
import { Search, X, MapPin, Loader2, Globe } from 'lucide-react'

export default function AreaSelector({ onAreaSelect, currentArea }) {
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const autocompleteService = useRef(null)
    const placesService = useRef(null)
    const inputRef = useRef(null)

    // Initialize services when Google Maps is loaded
    useEffect(() => {
        const initServices = () => {
            if (window.google && window.google.maps && window.google.maps.places) {
                if (!autocompleteService.current) {
                    autocompleteService.current = new window.google.maps.places.AutocompleteService()
                }
                if (!placesService.current) {
                    const dummyDiv = document.createElement('div')
                    placesService.current = new window.google.maps.places.PlacesService(dummyDiv)
                }
                return true
            }
            return false
        }

        // Try immediately
        if (initServices()) return

        // If not loaded yet, poll until it is
        const interval = setInterval(() => {
            if (initServices()) {
                clearInterval(interval)
            }
        }, 100)

        return () => clearInterval(interval)
    }, [])

    const handleSearch = (value) => {
        setQuery(value)

        if (!value.trim() || !autocompleteService.current) {
            setSuggestions([])
            return
        }

        setIsLoading(true)

        // Search for cities, regions, countries
        autocompleteService.current.getPlacePredictions(
            {
                input: value,
                types: ['(regions)'], // Cities, states, countries
            },
            (predictions, status) => {
                setIsLoading(false)
                if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                    setSuggestions(predictions)
                } else {
                    setSuggestions([])
                }
            }
        )
    }

    const handleSelect = (suggestion) => {
        if (!placesService.current) return

        placesService.current.getDetails(
            {
                placeId: suggestion.place_id,
                fields: ['geometry', 'formatted_address', 'name'],
            },
            (place, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
                    const area = {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                        name: place.name || place.formatted_address,
                        bounds: place.geometry.viewport,
                    }
                    onAreaSelect(area)
                    setQuery('')
                    setSuggestions([])
                    setIsFocused(false)
                }
            }
        )
    }

    const handleClear = () => {
        setQuery('')
        setSuggestions([])
        inputRef.current?.focus()
    }

    return (
        <div className="relative">
            {/* Current Area Display */}
            {currentArea && !isFocused && (
                <div className="mb-2 flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">
                        {currentArea.name}
                    </span>
                    <button
                        onClick={() => onAreaSelect(null)}
                        className="ml-1 h-7 w-7 rounded-full hover:bg-background/50 text-muted-foreground transition-colors focus-ring flex items-center justify-center"
                        aria-label="Clear selected area"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}

            <div
                className={`relative flex items-center rounded-2xl border bg-secondary/60 backdrop-blur-xl transition-colors ${isFocused ? 'border-primary/40' : 'border-border/50'
                    }`}
            >
                <div className="pl-3 text-muted-foreground">
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Globe className="w-5 h-5" />
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    placeholder="Jump to city, state, or country..."
                    className="flex-1 bg-transparent px-3 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus-ring rounded-2xl"
                />

                {query && (
                    <button
                        onClick={handleClear}
                        className="mr-2 h-8 w-8 rounded-full hover:bg-background/50 text-muted-foreground transition-colors focus-ring flex items-center justify-center"
                        aria-label="Clear search"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {isFocused && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 glass rounded-3xl shadow-lg overflow-hidden animate-fade-in">
                    <div className="max-h-[320px] overflow-auto">
                        {suggestions.map((suggestion) => (
                            <button
                                key={suggestion.place_id}
                                onClick={() => handleSelect(suggestion)}
                                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-secondary/60 transition-colors"
                            >
                                <Globe className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">
                                        {suggestion.structured_formatting?.main_text || suggestion.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {suggestion.structured_formatting?.secondary_text || ''}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
