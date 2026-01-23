import { useState, useEffect } from 'react'
import { Coffee, Trees, Utensils, Footprints, Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import SuggestionCard from './SuggestionCard'
import { getRecommendations, isGeminiConfigured } from '../services/geminiService'

const categories = [
    { id: 'coffee', label: 'Coffee', icon: Coffee, color: 'text-amber-500' },
    { id: 'trails', label: 'Trails', icon: Footprints, color: 'text-green-500' },
    { id: 'parks', label: 'Parks', icon: Trees, color: 'text-emerald-500' },
    { id: 'food', label: 'Food', icon: Utensils, color: 'text-orange-500' },
]

export default function AIRecommendations({ selectedArea, userLocation, onAddStop }) {
    const [activeCategory, setActiveCategory] = useState('coffee')
    const [suggestions, setSuggestions] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)

    const location = selectedArea || userLocation

    useEffect(() => {
        if (location) {
            fetchSuggestions()
        }
    }, [activeCategory, location?.lat, location?.lng])

    const fetchSuggestions = async () => {
        if (!location) return

        setIsLoading(true)
        setError(null)

        try {
            const results = await getRecommendations(
                activeCategory,
                location,
                selectedArea?.name || ''
            )
            setSuggestions(results)
        } catch (err) {
            setError('Failed to load suggestions')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddToRoute = (suggestion) => {
        // Create a point from the suggestion
        // Note: In a real app, we'd geocode the name to get coordinates
        // For now, we'll use the current area location as an approximation
        const point = {
            id: suggestion.id,
            lat: location.lat + (Math.random() - 0.5) * 0.01, // Slight offset
            lng: location.lng + (Math.random() - 0.5) * 0.01,
            address: suggestion.name,
            name: suggestion.name,
            type: suggestion.type,
        }
        onAddStop(point)
    }

    if (!isGeminiConfigured()) {
        return (
            <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-slate-200 mb-2">
                    Gemini API Not Configured
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                    Add your Gemini API key to .env file:
                </p>
                <code className="block mt-2 text-xs bg-gray-100 dark:bg-slate-700 p-2 rounded-lg text-gray-700 dark:text-slate-300">
                    VITE_GEMINI_API_KEY=your_key
                </code>
            </div>
        )
    }

    if (!location) {
        return (
            <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-slate-200 mb-2">
                    Select an Area First
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                    Jump to a city or allow location access to see AI recommendations
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                        AI Recommendations
                    </h2>
                    {selectedArea && (
                        <span className="text-xs text-gray-400 dark:text-slate-500">
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
                                onClick={() => setActiveCategory(cat.id)}
                                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-lg
                  text-sm font-medium transition-all duration-200
                  ${activeCategory === cat.id
                                        ? 'bg-white dark:bg-slate-700 shadow-md text-gray-800 dark:text-slate-200'
                                        : 'text-gray-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
                                    }
                `}
                            >
                                <Icon className={`w-4 h-4 ${activeCategory === cat.id ? cat.color : ''}`} />
                                <span className="hidden sm:inline">{cat.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                            Finding the best spots...
                        </p>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">{error}</p>
                        <button
                            onClick={fetchSuggestions}
                            className="flex items-center gap-2 px-4 py-2 mx-auto rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </button>
                    </div>
                ) : suggestions.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                            No suggestions found for this area
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {suggestions.map((suggestion, index) => (
                            <div key={suggestion.id} style={{ animationDelay: `${index * 50}ms` }}>
                                <SuggestionCard
                                    suggestion={suggestion}
                                    onAddToRoute={handleAddToRoute}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Refresh Button */}
            {!isLoading && suggestions.length > 0 && (
                <div className="p-4 border-t border-gray-200/50 dark:border-slate-700/50">
                    <button
                        onClick={fetchSuggestions}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 font-medium text-sm hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Get New Suggestions
                    </button>
                </div>
            )}
        </div>
    )
}
