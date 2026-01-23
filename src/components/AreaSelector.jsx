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
                    <Globe className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium text-gray-700 dark:text-slate-300">
                        {currentArea.name}
                    </span>
                    <button
                        onClick={() => onAreaSelect(null)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}

            <div className={`
        relative flex items-center
        bg-gradient-to-r from-emerald-500/10 to-blue-500/10
        dark:from-emerald-500/20 dark:to-blue-500/20
        backdrop-blur-sm
        border-2 transition-all duration-200
        ${isFocused
                    ? 'border-emerald-500 dark:border-emerald-400 shadow-lg shadow-emerald-500/20'
                    : 'border-emerald-200 dark:border-emerald-700'
                }
        rounded-xl overflow-hidden
      `}>
                <div className="pl-3 text-emerald-500 dark:text-emerald-400">
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
                    className="
            flex-1 px-3 py-3
            bg-transparent
            text-gray-800 dark:text-slate-200
            placeholder-gray-400 dark:placeholder-slate-500
            text-sm font-medium
            focus:outline-none
          "
                />

                {query && (
                    <button
                        onClick={handleClear}
                        className="pr-3 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {isFocused && suggestions.length > 0 && (
                <div className="
          absolute top-full left-0 right-0 mt-2 z-50
          bg-white dark:bg-slate-800
          border border-gray-200 dark:border-slate-700
          rounded-xl shadow-xl
          overflow-hidden
          animate-fade-in
        ">
                    {suggestions.map((suggestion) => (
                        <button
                            key={suggestion.place_id}
                            onClick={() => handleSelect(suggestion)}
                            className="
                w-full flex items-start gap-3 px-4 py-3
                hover:bg-emerald-50 dark:hover:bg-emerald-900/20
                transition-colors text-left
              "
                        >
                            <Globe className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">
                                    {suggestion.structured_formatting?.main_text || suggestion.description}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                    {suggestion.structured_formatting?.secondary_text || ''}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
