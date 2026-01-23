import { useMemo, useState } from 'react'
import { Flag, Navigation, Plus, RotateCcw, Save } from 'lucide-react'
import SearchBox from './SearchBox'
import StopsList from './StopsList'
import { formatDistance, formatDuration } from '../utils/routeHelpers'

export default function RouteBuilder({
    route,
    editMode,
    onSetEditMode,
    onSetStart,
    onSetEnd,
    onAddStop,
    onRemoveStop,
    onReorderStops,
    onClearRoute,
    onSaveRoute,
    hasValidRoute,
    userLocation,
    selectedArea,
}) {
    const [routeName, setRouteName] = useState('')
    const [showSaveForm, setShowSaveForm] = useState(false)

    const canClear = !!route.startPoint || !!route.endPoint || route.stops.length > 0

    const searchPlaceholder = useMemo(() => {
        if (!editMode) return 'Select Start, Stop, or End…'
        if (editMode === 'start') return 'Search for starting point…'
        if (editMode === 'end') return 'Search for destination…'
        return 'Search for a stop…'
    }, [editMode])

    const handleSearchSelect = (point) => {
        if (!editMode) return
        if (editMode === 'start') onSetStart(point)
        if (editMode === 'end') onSetEnd(point)
        if (editMode === 'stop') onAddStop(point)
    }

    const handleSave = () => {
        if (!routeName.trim() || !hasValidRoute) return
        onSaveRoute(routeName.trim())
        setRouteName('')
        setShowSaveForm(false)
    }

    const handleClear = () => {
        if (!canClear) return
        if (window.confirm('Clear the current route?')) {
            onClearRoute()
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold tracking-tight">Route Builder</h2>
                <button
                    onClick={handleClear}
                    disabled={!canClear}
                    className="h-9 px-3 rounded-full bg-secondary/60 hover:bg-secondary border border-border/50 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring inline-flex items-center gap-2"
                >
                    <RotateCcw className="w-4 h-4" />
                    Clear
                </button>
            </div>

            {editMode && (
                <div className="animate-fade-in">
                    <SearchBox
                        onPlaceSelect={handleSearchSelect}
                        userLocation={selectedArea || userLocation}
                        placeholder={searchPlaceholder}
                    />
                </div>
            )}

            <div className="flex gap-2">
                <button
                    onClick={() => onSetEditMode(editMode === 'start' ? null : 'start')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 focus-ring ${editMode === 'start'
                            ? 'bg-success text-success-foreground shadow-lg'
                            : route.startPoint
                                ? 'bg-success/15 text-success border border-success/25'
                                : 'bg-secondary/60 hover:bg-secondary border border-border/50'
                        }`}
                >
                    <Navigation className="w-4 h-4" />
                    Start
                </button>

                <button
                    onClick={() => onSetEditMode(editMode === 'stop' ? null : 'stop')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 focus-ring ${editMode === 'stop'
                            ? 'bg-warning text-warning-foreground shadow-lg'
                            : 'bg-secondary/60 hover:bg-secondary border border-border/50'
                        }`}
                >
                    <Plus className="w-4 h-4" />
                    Stop
                    {route.stops.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-background/20 text-xs">
                            {route.stops.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => onSetEditMode(editMode === 'end' ? null : 'end')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 focus-ring ${editMode === 'end'
                            ? 'bg-destructive text-destructive-foreground shadow-lg'
                            : route.endPoint
                                ? 'bg-destructive/15 text-destructive border border-destructive/25'
                                : 'bg-secondary/60 hover:bg-secondary border border-border/50'
                        }`}
                >
                    <Flag className="w-4 h-4" />
                    End
                </button>
            </div>

            {hasValidRoute && (
                <div className="grid grid-cols-2 gap-3 animate-fade-in">
                    <div className="p-4 rounded-2xl bg-secondary/60 border border-border/50">
                        <div className="text-xs text-muted-foreground">Distance</div>
                        <div className="mt-1 text-xl font-semibold text-primary">
                            {formatDistance(route.distance) || '—'}
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-secondary/60 border border-border/50">
                        <div className="text-xs text-muted-foreground">Time</div>
                        <div className="mt-1 text-xl font-semibold">
                            {formatDuration(route.duration) || '—'}
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Stops
                    </div>
                    {!editMode && (
                        <div className="text-[11px] text-muted-foreground">
                            Select a mode, then search or click the map
                        </div>
                    )}
                </div>
                <StopsList stops={route.stops} onRemoveStop={onRemoveStop} onReorderStops={onReorderStops} />
            </div>

            <div className="space-y-3">
                {showSaveForm ? (
                    <div className="space-y-2 animate-fade-in">
                        <input
                            type="text"
                            value={routeName}
                            onChange={(e) => setRouteName(e.target.value)}
                            placeholder="Route name…"
                            className="w-full h-11 px-4 rounded-2xl bg-secondary/60 border border-border/50 focus-ring text-sm font-medium"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                disabled={!routeName.trim()}
                                className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring inline-flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save
                            </button>
                            <button
                                onClick={() => setShowSaveForm(false)}
                                className="h-11 px-4 rounded-2xl bg-secondary/60 hover:bg-secondary border border-border/50 text-sm font-semibold transition-colors focus-ring"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowSaveForm(true)}
                        disabled={!hasValidRoute}
                        className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring inline-flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save route
                    </button>
                )}
            </div>
        </div>
    )
}
