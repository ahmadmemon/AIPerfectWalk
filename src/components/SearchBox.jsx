import { useState, useRef, useEffect } from 'react'
import { Search, X, MapPin, Loader2 } from 'lucide-react'

export default function SearchBox({ onPlaceSelect, placeholder = "Search location...", userLocation }) {
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const autocompleteService = useRef(null)
    const placesService = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
            autocompleteService.current = new window.google.maps.places.AutocompleteService()
            // Create a dummy div for PlacesService (required but not displayed)
            const dummyDiv = document.createElement('div')
            placesService.current = new window.google.maps.places.PlacesService(dummyDiv)
        }
    }, [])

    const handleSearch = (value) => {
        setQuery(value)

        if (!value.trim() || !autocompleteService.current) {
            setSuggestions([])
            return
        }

        setIsLoading(true)

        // Build request with location bias for nearby results
        const request = {
            input: value,
            types: ['geocode', 'establishment'],
        }

        // Add location bias if user location is available
        if (userLocation) {
            request.locationBias = {
                center: userLocation,
                radius: 50000, // 50km radius bias
            }
        }

        autocompleteService.current.getPlacePredictions(
            request,
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
                    const point = {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                        address: place.formatted_address || place.name,
                    }
                    onPlaceSelect(point)
                    setQuery(place.name || place.formatted_address || '')
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
            <div className={`
        relative flex items-center
        bg-white/80 dark:bg-slate-700/80
        backdrop-blur-sm
        border-2 transition-all duration-200
        ${isFocused
                    ? 'border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/20'
                    : 'border-gray-200 dark:border-slate-600'
                }
        rounded-xl overflow-hidden
      `}>
                <div className="pl-3 text-gray-400 dark:text-slate-500">
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Search className="w-5 h-5" />
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    placeholder={placeholder}
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
                hover:bg-gray-50 dark:hover:bg-slate-700
                transition-colors text-left
              "
                        >
                            <MapPin className="w-4 h-4 mt-0.5 text-gray-400 dark:text-slate-500 flex-shrink-0" />
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
