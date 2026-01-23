import { Bookmark, Trash2, Clock, MapPin, ArrowRight, Route } from 'lucide-react'
import { formatDistance } from '../utils/routeHelpers'

export default function SavedRoutes({ routes, onLoadRoute, onDeleteRoute }) {
    if (routes.length === 0) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-primary" />
                    <h2 className="text-base font-semibold tracking-tight">Saved Routes</h2>
                </div>
                <div className="text-center py-10 text-muted-foreground">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-3xl bg-secondary/60 border border-border/50 flex items-center justify-center">
                        <Route className="w-7 h-7 opacity-50" />
                    </div>
                    <p className="text-sm font-medium">No saved routes yet</p>
                    <p className="text-xs mt-1">Save a route to access it later.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-primary" />
                <h2 className="text-base font-semibold tracking-tight">Saved Routes</h2>
                <span className="ml-auto text-xs font-semibold text-muted-foreground">
                    {routes.length}
                </span>
            </div>

            <div className="space-y-3">
                {routes.map((route, index) => (
                    <div
                        key={route.id}
                        onClick={() => onLoadRoute(route)}
                        className="group p-4 rounded-3xl bg-secondary/40 hover:bg-secondary/60 border border-border/50 cursor-pointer transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                                    {route.name}
                                </h3>
                                <div className="flex items-center gap-4 mt-2">
                                    {route.distance && (
                                        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                            <MapPin className="w-3.5 h-3.5 text-primary" />
                                            {formatDistance(route.distance)}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                        <ArrowRight className="w-3.5 h-3.5 text-warning" />
                                        {route.stops?.length || 0} stops
                                    </span>
                                </div>
                                {route.createdAt && (
                                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
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
                                className="p-2 rounded-2xl bg-background/0 hover:bg-background/50 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all duration-200 focus-ring"
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
