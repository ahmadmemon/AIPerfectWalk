import { Bookmark, Trash2, Clock, MapPin, ArrowRight, Route } from 'lucide-react'
import { formatDistance } from '../utils/routeHelpers'

export default function SavedRoutes({ routes, onLoadRoute, onDeleteRoute }) {
    if (routes.length === 0) {
        return (
            <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Bookmark className="w-4 h-4 text-blue-500" />
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                        Saved Routes
                    </h2>
                </div>
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-slate-700/50 flex items-center justify-center">
                        <Route className="w-8 h-8 text-gray-300 dark:text-slate-600" />
                    </div>
                    <p className="text-gray-500 dark:text-slate-400 font-medium">No saved routes yet</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                        Create and save your first route!
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
                <Bookmark className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                    Saved Routes
                </h2>
                <span className="ml-auto text-xs font-medium text-gray-400 dark:text-slate-500">
                    {routes.length} route{routes.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="space-y-3">
                {routes.map((route, index) => (
                    <div
                        key={route.id}
                        onClick={() => onLoadRoute(route)}
                        className="
              group p-4
              bg-white/60 dark:bg-slate-700/40
              backdrop-blur-sm
              border border-gray-200/50 dark:border-slate-600/30
              rounded-xl
              hover:bg-white/80 dark:hover:bg-slate-700/60
              hover:shadow-lg hover:-translate-y-0.5
              cursor-pointer
              transition-all duration-300
              animate-slide-up
            "
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {route.name}
                                </h3>
                                <div className="flex items-center gap-4 mt-2">
                                    {route.distance && (
                                        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-slate-400">
                                            <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                            {formatDistance(route.distance)}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-slate-400">
                                        <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                                        {route.stops?.length || 0} stops
                                    </span>
                                </div>
                                {route.createdAt && (
                                    <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400 dark:text-slate-500">
                                        <Clock className="w-3 h-3" />
                                        {new Date(route.createdAt).toLocaleDateString()}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDeleteRoute(route.id)
                                }}
                                className="
                  p-2 rounded-lg
                  hover:bg-red-100 dark:hover:bg-red-900/30
                  text-gray-400 hover:text-red-500
                  dark:text-slate-500 dark:hover:text-red-400
                  opacity-0 group-hover:opacity-100
                  transition-all duration-200
                "
                                aria-label="Delete route"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
