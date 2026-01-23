import { Coffee, Trees, Utensils, MapPin, Plus, Star, Footprints } from 'lucide-react'

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

export default function SuggestionCard({ suggestion, onAddToRoute }) {
    const type = suggestion.type || 'coffee'
    const Icon = iconMap[type] || MapPin
    const colors = colorMap[type] || colorMap.coffee

    const popularityBadge = {
        'High': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
        'Medium': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
        'Local Favorite': { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400' },
    }

    const badge = popularityBadge[suggestion.popularity] || popularityBadge['Medium']

    return (
        <div className={`
      p-4 rounded-xl
      bg-white/60 dark:bg-slate-700/40
      backdrop-blur-sm
      border ${colors.border}
      hover:shadow-lg hover:-translate-y-0.5
      transition-all duration-300
      animate-slide-up
    `}>
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`
          p-2.5 rounded-xl ${colors.bg}
          flex items-center justify-center
        `}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-800 dark:text-slate-200 text-sm leading-tight">
                            {suggestion.name}
                        </h3>
                        {suggestion.popularity && (
                            <span className={`
                text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap
                ${badge.bg} ${badge.text}
              `}>
                                {suggestion.popularity === 'Local Favorite' ? '♥ Favorite' : suggestion.popularity}
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {suggestion.description}
                    </p>

                    {/* Extra info */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {suggestion.difficulty && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300">
                                {suggestion.difficulty}
                            </span>
                        )}
                        {suggestion.cuisine && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300">
                                {suggestion.cuisine}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Add to Route Button */}
            <button
                onClick={() => onAddToRoute(suggestion)}
                className={`
          w-full mt-3 flex items-center justify-center gap-2
          px-3 py-2 rounded-lg
          ${colors.bg} ${colors.text}
          hover:opacity-80
          font-medium text-sm
          transition-all duration-200
        `}
            >
                <Plus className="w-4 h-4" />
                Add to Route
            </button>
        </div>
    )
}
