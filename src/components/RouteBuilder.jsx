import { useState } from 'react'
import { MapPin, Flag, Plus, Trash2, Save, Route, Navigation } from 'lucide-react'
import StopsList from './StopsList'
import SearchBox from './SearchBox'
import AreaSelector from './AreaSelector'
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
    onAreaSelect,
}) {
    const [routeName, setRouteName] = useState('')
    const [showSaveForm, setShowSaveForm] = useState(false)

    const handleSave = () => {
        if (routeName.trim() && hasValidRoute) {
            onSaveRoute(routeName.trim())
            setRouteName('')
            setShowSaveForm(false)
        }
    }

    const handleSearchSelect = (point) => {
        switch (editMode) {
            case 'start':
                onSetStart(point)
                break
            case 'end':
                onSetEnd(point)
                break
            case 'stop':
                onAddStop({ ...point, id: Date.now().toString() })
                break
        }
    }

    const modeButtons = [
        {
            mode: 'start',
            icon: MapPin,
            label: 'Set Start',
            gradient: 'btn-gradient-green',
            description: route.startPoint?.address || 'Choose starting point'
        },
        {
            mode: 'end',
            icon: Flag,
            label: 'Set End',
            gradient: 'btn-gradient-red',
            description: route.endPoint?.address || 'Choose destination'
        },
        {
            mode: 'stop',
            icon: Plus,
            label: 'Add Stop',
            gradient: 'btn-gradient-amber',
            description: 'Add waypoints along route'
        },
    ]

    return (
        <div className="flex flex-col h-full">
            {/* Area Selector Section */}
            <div className="p-4 border-b border-gray-200/50 dark:border-slate-700/50">
                <AreaSelector
                    onAreaSelect={onAreaSelect}
                    currentArea={selectedArea}
                />
            </div>

            {/* Search Section */}
            <div className="p-4 border-b border-gray-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                    <Navigation className="w-4 h-4 text-blue-500" />
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                        Search Location
                    </h2>
                </div>
                <SearchBox
                    onPlaceSelect={handleSearchSelect}
                    userLocation={selectedArea || userLocation}
                    placeholder={
                        editMode === 'start' ? "Search start location..." :
                            editMode === 'end' ? "Search destination..." :
                                editMode === 'stop' ? "Search for a stop..." :
                                    "Select a mode below, then search..."
                    }
                />
                {!editMode && (
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 text-center">
                        Select a button below to start adding points
                    </p>
                )}
            </div>

            {/* Route Building Section */}
            <div className="p-4 border-b border-gray-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-4">
                    <Route className="w-4 h-4 text-blue-500" />
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                        Build Your Route
                    </h2>
                </div>

                <div className="space-y-3">
                    {modeButtons.map(({ mode, icon: Icon, label, gradient, description }) => (
                        <button
                            key={mode}
                            onClick={() => onSetEditMode(editMode === mode ? null : mode)}
                            className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white font-semibold
                transition-all duration-300 hover:-translate-y-0.5
                ${gradient}
                ${editMode === mode ? 'active-ring scale-[1.02]' : ''}
              `}
                        >
                            <div className="p-1.5 bg-white/20 rounded-lg">
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 text-left">
                                <span className="block text-sm">{label}</span>
                                <span className="block text-xs opacity-80 font-normal truncate">
                                    {description}
                                </span>
                            </div>
                            {editMode === mode && (
                                <span className="text-xs bg-white/25 px-2.5 py-1 rounded-full animate-pulse-soft">
                                    Active
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Route Info */}
                {hasValidRoute && (
                    <div className="mt-4 p-4 route-info-card rounded-xl animate-slide-up">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                📍 Distance
                            </span>
                            <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                {formatDistance(route.distance) || '...'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                ⏱️ Est. Time
                            </span>
                            <span className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                                {formatDuration(route.duration) || '...'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Stops Section */}
            <div className="flex-1 overflow-auto p-4 border-b border-gray-200/50 dark:border-slate-700/50">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold">
                        {route.stops.length}
                    </span>
                    Stops
                </h3>
                <StopsList
                    stops={route.stops}
                    onRemoveStop={onRemoveStop}
                    onReorderStops={onReorderStops}
                />
            </div>

            {/* Actions Section */}
            <div className="p-4 space-y-3">
                {showSaveForm ? (
                    <div className="space-y-3 animate-slide-up">
                        <input
                            type="text"
                            value={routeName}
                            onChange={(e) => setRouteName(e.target.value)}
                            placeholder="Enter route name..."
                            className="
                w-full px-4 py-3 rounded-xl
                bg-white/80 dark:bg-slate-700/80
                border-2 border-gray-200 dark:border-slate-600
                focus:border-blue-500 dark:focus:border-blue-400
                text-gray-800 dark:text-slate-200 
                text-sm font-medium
                transition-all duration-200
              "
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                disabled={!routeName.trim()}
                                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                <Save className="w-4 h-4" />
                                Save Route
                            </button>
                            <button
                                onClick={() => setShowSaveForm(false)}
                                className="
                  px-4 py-2.5 rounded-xl font-semibold
                  bg-gray-100 dark:bg-slate-700
                  hover:bg-gray-200 dark:hover:bg-slate-600
                  text-gray-700 dark:text-slate-200
                  transition-all duration-200
                "
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={() => setShowSaveForm(true)}
                            disabled={!hasValidRoute}
                            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            <Save className="w-5 h-5" />
                            Save Route
                        </button>
                        <button
                            onClick={onClearRoute}
                            disabled={!route.startPoint && !route.endPoint && route.stops.length === 0}
                            className="
                w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                bg-gray-100/80 dark:bg-slate-700/80
                hover:bg-red-50 dark:hover:bg-red-900/20
                hover:text-red-600 dark:hover:text-red-400
                border border-gray-200/50 dark:border-slate-600/50
                hover:border-red-200 dark:hover:border-red-800
                disabled:opacity-50 disabled:cursor-not-allowed
                text-gray-600 dark:text-slate-400 font-medium
                transition-all duration-200
              "
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear Route
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
