import { useState, useEffect } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { useRoute } from './hooks/useRoute'
import { useSavedRoutes } from './hooks/useLocalStorage'
import Header from './components/Header'
import RouteBuilder from './components/RouteBuilder'
import SavedRoutes from './components/SavedRoutes'
import Map from './components/Map'

function AppContent() {
    const {
        route,
        editMode,
        setEditMode,
        setStartPoint,
        setEndPoint,
        addStop,
        removeStop,
        reorderStops,
        updateRouteInfo,
        clearRoute,
        loadRoute,
        getRouteForSaving,
        hasValidRoute,
    } = useRoute()

    const { routes, saveRoute, deleteRoute } = useSavedRoutes()
    const [activeTab, setActiveTab] = useState('builder') // 'builder' | 'saved'
    const [userLocation, setUserLocation] = useState(null)

    // Get user's location on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    })
                },
                (error) => {
                    console.log('Geolocation error:', error.message)
                }
            )
        }
    }, [])

    const handleSaveRoute = (name) => {
        const routeData = getRouteForSaving()
        saveRoute({ ...routeData, name })
        // Show saved tab after saving
        setActiveTab('saved')
    }

    const handleLoadRoute = (savedRoute) => {
        loadRoute(savedRoute)
        setActiveTab('builder')
    }

    return (
        <div className="h-screen flex flex-col">
            <Header />

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-[340px] flex-shrink-0 sidebar-premium flex flex-col">
                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-200/50 dark:border-slate-700/50">
                        <button
                            onClick={() => setActiveTab('builder')}
                            className={`
                flex-1 py-4 text-sm font-semibold transition-all relative
                ${activeTab === 'builder'
                                    ? 'text-blue-600 dark:text-blue-400 tab-active'
                                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                                }
              `}
                        >
                            Route Builder
                        </button>
                        <button
                            onClick={() => setActiveTab('saved')}
                            className={`
                flex-1 py-4 text-sm font-semibold transition-all relative
                ${activeTab === 'saved'
                                    ? 'text-blue-600 dark:text-blue-400 tab-active'
                                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                                }
              `}
                        >
                            Saved
                            {routes.length > 0 && (
                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                                    {routes.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-auto">
                        {activeTab === 'builder' ? (
                            <RouteBuilder
                                route={route}
                                editMode={editMode}
                                onSetEditMode={setEditMode}
                                onSetStart={setStartPoint}
                                onSetEnd={setEndPoint}
                                onAddStop={addStop}
                                onRemoveStop={removeStop}
                                onReorderStops={reorderStops}
                                onClearRoute={clearRoute}
                                onSaveRoute={handleSaveRoute}
                                hasValidRoute={hasValidRoute}
                                userLocation={userLocation}
                            />
                        ) : (
                            <SavedRoutes
                                routes={routes}
                                onLoadRoute={handleLoadRoute}
                                onDeleteRoute={deleteRoute}
                            />
                        )}
                    </div>
                </aside>

                {/* Map */}
                <main className="flex-1 relative">
                    <Map
                        route={route}
                        editMode={editMode}
                        onSetStart={setStartPoint}
                        onSetEnd={setEndPoint}
                        onAddStop={addStop}
                        onUpdateRouteInfo={updateRouteInfo}
                    />
                </main>
            </div>
        </div>
    )
}

export default function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    )
}
