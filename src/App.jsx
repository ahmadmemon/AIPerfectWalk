import { useState, useCallback } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'
import { ThemeProvider } from './context/ThemeContext'
import { useRoute } from './hooks/useRoute'
import { useSavedRoutes } from './hooks/useLocalStorage'
import { usePreferences } from './hooks/usePreferences'
import { useIsMobile } from './hooks/useIsMobile'
import Header from './components/Header'
import RouteGenerator from './components/RouteGenerator'
import RouteBuilder from './components/RouteBuilder'
import SavedRoutes from './components/SavedRoutes'
import AIRecommendations from './components/AIRecommendations'
import Map from './components/Map'
import OnboardingFlow from './components/onboarding/OnboardingFlow'
import TabNav from './components/layout/TabNav'
import BottomSheet from './components/layout/BottomSheet'
import { Map as MapIcon, Bookmark, Sparkles } from 'lucide-react'

const LIBRARIES = ['places']

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
    const { isLoading: prefsLoading, preferences, updatePreferences, getPreferencesSummary, defaultDiscoverCategory } = usePreferences()
    const isMobile = useIsMobile()

    const [activeTab, setActiveTab] = useState('builder') // 'builder' | 'saved' | 'discover'
    const [userLocation, setUserLocation] = useState(null)
    const [showOnboarding, setShowOnboarding] = useState(false)
    const [discoverPlaces, setDiscoverPlaces] = useState([])
    const [mapFocusPoint, setMapFocusPoint] = useState(null)
    const [previewRoute, setPreviewRoute] = useState(null)

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries: LIBRARIES,
    })

    const handleUserLocationChange = useCallback((loc) => {
        setUserLocation(loc)
    }, [])

    const handleSaveRoute = (name) => {
        const routeData = getRouteForSaving()
        saveRoute({ ...routeData, name })
        // Show saved tab after saving
        setActiveTab('saved')
    }

    const handleLoadRoute = (savedRoute) => {
        setPreviewRoute(null)
        loadRoute(savedRoute)
        setActiveTab('builder')
    }

    const handleAIAddStop = (point) => {
        setPreviewRoute(null)
        addStop(point)
        // Switch to builder to show the added stop
        setActiveTab('builder')
        setMapFocusPoint({ ...point, kind: 'stop' })
    }

    const handleUseGeneratedRoute = useCallback((routeData) => {
        if (!routeData?.startPoint || !routeData?.endPoint) return
        setPreviewRoute(null)
        loadRoute(routeData)
        setActiveTab('builder')
        setMapFocusPoint({ ...routeData.startPoint, kind: 'start' })
    }, [loadRoute])

    const summary = getPreferencesSummary()
    const selectedArea = preferences?.area || null
    const shouldShowOnboarding = !prefsLoading && (!preferences?.hasCompletedOnboarding || !selectedArea)

    const tabs = [
        { id: 'builder', label: 'Build', icon: <MapIcon className="w-4 h-4" /> },
        { id: 'discover', label: 'Discover', icon: <Sparkles className="w-4 h-4" /> },
        { id: 'saved', label: 'Saved', icon: <Bookmark className="w-4 h-4" /> },
    ]

    if (loadError) {
        return (
            <div className="h-screen flex flex-col">
                <Header area={null} preferencesSummary={null} onEditPreferences={() => setShowOnboarding(true)} />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="glass-card rounded-2xl p-6 max-w-md w-full text-center">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200">
                            Failed to load Google Maps
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                            Check `VITE_GOOGLE_MAPS_API_KEY` in `.env` and ensure the Maps JavaScript API is enabled.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    if (!isLoaded) {
        return (
            <div className="h-screen flex flex-col">
                <Header area={null} preferencesSummary={null} onEditPreferences={() => setShowOnboarding(true)} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="glass-card rounded-2xl px-6 py-5 text-sm font-medium text-gray-600 dark:text-slate-300">
                        Loading map services…
                    </div>
                </div>
            </div>
        )
    }

    if (prefsLoading) {
        return (
            <div className="h-screen flex flex-col">
                <Header area={null} preferencesSummary={null} onEditPreferences={() => setShowOnboarding(true)} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="glass-card rounded-2xl px-6 py-5 text-sm font-medium text-muted-foreground">
                        Loading…
                    </div>
                </div>
            </div>
        )
    }

    const sidebarContent = (
        <div className="space-y-6">
            <TabNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === 'builder' && (
                <div className="space-y-6">
                    <RouteGenerator
                        selectedArea={selectedArea}
                        userLocation={userLocation}
                        onPreviewRoute={setPreviewRoute}
                        onUseRoute={handleUseGeneratedRoute}
                    />
                    <RouteBuilder
                        route={route}
                        editMode={editMode}
                        onSetEditMode={setEditMode}
                        onSetStart={setStartPoint}
                        onSetEnd={setEndPoint}
                        onAddStop={addStop}
                        onRemoveStop={removeStop}
                        onReorderStops={reorderStops}
                        onClearRoute={() => {
                            setPreviewRoute(null)
                            clearRoute()
                        }}
                        onSaveRoute={handleSaveRoute}
                        hasValidRoute={hasValidRoute}
                        userLocation={userLocation}
                        selectedArea={selectedArea}
                    />
                </div>
            )}

            {activeTab === 'discover' && (
                <AIRecommendations
                    selectedArea={selectedArea}
                    userLocation={userLocation}
                    route={route}
                    onAddStop={handleAIAddStop}
                    initialCategory={defaultDiscoverCategory}
                    onVisiblePlacesChange={setDiscoverPlaces}
                    onPreviewPlace={(place) => setMapFocusPoint({ ...place, kind: 'discover' })}
                />
            )}

            {activeTab === 'saved' && (
                <SavedRoutes
                    routes={routes}
                    onLoadRoute={handleLoadRoute}
                    onDeleteRoute={deleteRoute}
                />
            )}
        </div>
    )

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {(shouldShowOnboarding || showOnboarding) && (
                <OnboardingFlow
                    initialPreferences={preferences}
                    onSkip={() => {
                        updatePreferences({ hasCompletedOnboarding: true })
                        setShowOnboarding(false)
                    }}
                    onComplete={(prefs) => {
                        updatePreferences(prefs)
                        setShowOnboarding(false)
                    }}
                />
            )}

            <Header
                area={summary?.area || (selectedArea?.name || null)}
                preferencesSummary={summary?.vibes || null}
                onEditPreferences={() => setShowOnboarding(true)}
            />

            <main className="flex-1 flex">
                <div className={`flex-1 ${isMobile ? 'h-[calc(100vh-56px)]' : ''}`}>
                    <Map
                        route={route}
                        previewRoute={previewRoute}
                        editMode={editMode}
                        onSetStart={setStartPoint}
                        onSetEnd={setEndPoint}
                        onAddStop={addStop}
                        onRemoveStop={removeStop}
                        onUpdateRouteInfo={updateRouteInfo}
                        selectedArea={selectedArea}
                        onUserLocationChange={handleUserLocationChange}
                        discoverPlaces={activeTab === 'discover' ? discoverPlaces : []}
                        focusPoint={mapFocusPoint}
                        onFocusPointConsumed={() => setMapFocusPoint(null)}
                        onPreviewRouteConfirm={() => handleUseGeneratedRoute(previewRoute)}
                        onPreviewRouteDismiss={() => setPreviewRoute(null)}
                    />
                </div>

                {!isMobile && (
                    <aside className="w-[380px] border-l border-border/50 bg-card/50 backdrop-blur-xl overflow-y-auto p-4">
                        {sidebarContent}
                    </aside>
                )}
            </main>

            {isMobile && (
                <BottomSheet defaultSnap="half">
                    {sidebarContent}
                </BottomSheet>
            )}
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
