import { useCallback, useEffect, useRef, useState } from 'react'
import { GoogleMap, Marker, DirectionsRenderer, OverlayView } from '@react-google-maps/api'
import { useTheme } from '../context/ThemeContext'
import { getStopColor, createPoint, getWaypoints } from '../utils/routeHelpers'
import { ExternalLink, Flag, MapPin, Navigation, Plus, Trash2, Star } from 'lucide-react'
import { getPlaceDetails } from '../services/placesService'

const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 } // San Francisco

// Premium dark mode map styles
const darkModeStyles = [
    { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d3a4f' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1f2937' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3b4d66' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
    { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#132a13' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
]

const mapContainerStyle = {
    width: '100%',
    height: '100%',
}

export default function Map({
    route,
    editMode,
    onSetStart,
    onSetEnd,
    onAddStop,
    onRemoveStop,
    onUpdateRouteInfo,
    selectedArea,
    onUserLocationChange,
    discoverPlaces = [],
    focusPoint,
    onFocusPointConsumed,
}) {
    const { isDark } = useTheme()
    const mapRef = useRef(null)
    const geocoderRef = useRef(null)
    const directionsServiceRef = useRef(null)
    const [directions, setDirections] = useState(null)
    const [userLocation, setUserLocation] = useState(null)
    const [activeInfo, setActiveInfo] = useState(null)
    const prevStopsCountRef = useRef(0)
    const placeDetailsCacheRef = useRef(new Map())
    const [mapCenter, setMapCenter] = useState(() => {
        if (selectedArea) {
            return { lat: selectedArea.lat, lng: selectedArea.lng }
        }
        return DEFAULT_CENTER
    })
    const [mapZoom, setMapZoom] = useState(() => (selectedArea ? 12 : 14))

    // Get user's location on mount
    useEffect(() => {
        if (!navigator.geolocation?.getCurrentPosition) return

        let canceled = false
        try {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    if (canceled) return
                    const lat = position?.coords?.latitude
                    const lng = position?.coords?.longitude
                    if (typeof lat !== 'number' || typeof lng !== 'number') return
                    const loc = { lat, lng }
                    setUserLocation(loc)
                    if (!selectedArea) {
                        setMapCenter(loc)
                    }
                    onUserLocationChange?.(loc)
                },
                (err) => {
                    console.log('Geolocation unavailable:', err?.message || err)
                },
                { maximumAge: 5 * 60 * 1000, timeout: 8000 }
            )
        } catch (err) {
            console.log('Geolocation call failed:', err)
        }

        return () => {
            canceled = true
        }
    }, [onUserLocationChange, selectedArea])

    // Pan to selected area
    useEffect(() => {
        if (selectedArea && mapRef.current) {
            if (selectedArea.bounds) {
                // Fit to viewport bounds if available
                mapRef.current.fitBounds(selectedArea.bounds)
            } else {
                // Otherwise pan to center
                mapRef.current.panTo({ lat: selectedArea.lat, lng: selectedArea.lng })
                mapRef.current.setZoom(12)
            }
        }
    }, [selectedArea])

    // Pan to start point when set
    useEffect(() => {
        if (route.startPoint && mapRef.current) {
            mapRef.current.panTo({ lat: route.startPoint.lat, lng: route.startPoint.lng })
            mapRef.current.setZoom(16) // Zoom in closer when start point is selected
            setActiveInfo({
                kind: 'start',
                id: 'start',
                data: route.startPoint,
                position: { lat: route.startPoint.lat, lng: route.startPoint.lng },
            })
        }
    }, [route.startPoint])

    // Pan to end point when set (less aggressive zoom)
    useEffect(() => {
        if (!route.endPoint) return
        if (mapRef.current && !route.startPoint) {
            mapRef.current.panTo({ lat: route.endPoint.lat, lng: route.endPoint.lng })
            mapRef.current.setZoom(15)
        }
        setActiveInfo({
            kind: 'end',
            id: 'end',
            data: route.endPoint,
            position: { lat: route.endPoint.lat, lng: route.endPoint.lng },
        })
    }, [route.endPoint, route.startPoint])

    useEffect(() => {
        const prevCount = prevStopsCountRef.current
        const nextCount = route.stops.length
        if (nextCount > prevCount) {
            const index = nextCount - 1
            const stop = route.stops[index]
            if (stop) {
                setActiveInfo({
                    kind: 'stop',
                    id: stop.id,
                    data: { ...stop, index },
                    position: { lat: stop.lat, lng: stop.lng },
                })
            }
        }
        prevStopsCountRef.current = nextCount
    }, [route.stops])

    // Calculate and display route when points change
    useEffect(() => {
        if (!route.startPoint || !route.endPoint) {
            setDirections(null)
            return
        }

        if (!directionsServiceRef.current) {
            directionsServiceRef.current = new google.maps.DirectionsService()
        }

        const request = {
            origin: { lat: route.startPoint.lat, lng: route.startPoint.lng },
            destination: { lat: route.endPoint.lat, lng: route.endPoint.lng },
            waypoints: getWaypoints(route.stops),
            optimizeWaypoints: false,
            travelMode: google.maps.TravelMode.WALKING,
        }

        directionsServiceRef.current.route(request, (result, status) => {
            if (status === 'OK') {
                setDirections(result)

                // Calculate total distance and duration
                const legs = result.routes[0].legs
                const totalDistance = legs.reduce((sum, leg) => sum + leg.distance.value, 0)
                const totalDuration = legs.reduce((sum, leg) => sum + leg.duration.value, 0)

                onUpdateRouteInfo(result.routes[0].overview_path, totalDistance, totalDuration)

                // Fit map to show entire route
                if (mapRef.current) {
                    const bounds = new google.maps.LatLngBounds()
                    result.routes[0].legs.forEach(leg => {
                        bounds.extend(leg.start_location)
                        bounds.extend(leg.end_location)
                    })
                    mapRef.current.fitBounds(bounds, { padding: 50 })
                }
            } else {
                console.error('Directions request failed:', status)
            }
        })
    }, [route.startPoint, route.endPoint, route.stops, onUpdateRouteInfo])

    // Initialize geocoder
    useEffect(() => {
        if (!geocoderRef.current) {
            geocoderRef.current = new google.maps.Geocoder()
        }
    }, [])

    const reverseGeocode = useCallback((latLng, callback) => {
        if (!geocoderRef.current) return callback('')

        geocoderRef.current.geocode({ location: latLng }, (results, status) => {
            if (status === 'OK' && results[0]) {
                callback({
                    address: results[0].formatted_address,
                    placeId: results[0].place_id,
                    name: results[0].address_components?.[0]?.long_name || results[0].formatted_address,
                })
            } else {
                callback({ address: '', placeId: null, name: '' })
            }
        })
    }, [])

    const handleMapClick = useCallback((event) => {
        if (!editMode) return

        const latLng = event.latLng
        const point = createPoint(latLng)

        // Reverse geocode to get address
        reverseGeocode(latLng, (info) => {
            const pointWithAddress = { ...point, address: info.address, placeId: info.placeId, name: info.name }

            switch (editMode) {
                case 'start':
                    onSetStart(pointWithAddress)
                    break
                case 'end':
                    onSetEnd(pointWithAddress)
                    break
                case 'stop':
                    onAddStop(pointWithAddress)
                    break
            }
        })
    }, [editMode, reverseGeocode, onSetStart, onSetEnd, onAddStop])

    const onMapLoad = useCallback((map) => {
        mapRef.current = map
    }, [])

    useEffect(() => {
        if (!focusPoint || !mapRef.current) return
        if (typeof focusPoint.lat !== 'number' || typeof focusPoint.lng !== 'number') return
        mapRef.current.panTo({ lat: focusPoint.lat, lng: focusPoint.lng })
        mapRef.current.setZoom(16)
        setActiveInfo({
            kind: focusPoint.kind || 'focus',
            id: focusPoint.placeId || focusPoint.id || null,
            data: focusPoint,
            position: { lat: focusPoint.lat, lng: focusPoint.lng },
        })
        onFocusPointConsumed?.()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusPoint])

    useEffect(() => {
        let canceled = false
        const placeId = activeInfo?.data?.placeId
        if (!placeId) return

        const cached = placeDetailsCacheRef.current.get(placeId)
        if (cached) {
            setActiveInfo((prev) => {
                if (!prev) return prev
                if (prev?.data?.placeId !== placeId) return prev
                return { ...prev, data: { ...prev.data, ...cached } }
            })
            return
        }

        getPlaceDetails(placeId)
            .then((details) => {
                if (canceled || !details) return
                placeDetailsCacheRef.current.set(placeId, details)
                setActiveInfo((prev) => {
                    if (!prev) return prev
                    if (prev?.data?.placeId !== placeId) return prev
                    return { ...prev, data: { ...prev.data, ...details } }
                })
            })
            .catch(() => {
                // ignore
            })

        return () => {
            canceled = true
        }
    }, [activeInfo?.data?.placeId])

    const mapOptions = {
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: isDark ? darkModeStyles : [],
        clickableIcons: false,
    }

    const openGoogleMapsLink = (placeId, name, lat, lng) => {
        if (placeId) return `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(placeId)}&query=${encodeURIComponent(name || '')}`
        if (typeof lat === 'number' && typeof lng === 'number') return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        return `https://www.google.com/maps`
    }

    const getOffset = (width, height) => ({
        x: -Math.round(width / 2),
        y: -Math.round(height + 18),
    })

    return (
        <div className="relative w-full h-full">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={mapZoom}
                onClick={(e) => {
                    if (!editMode) setActiveInfo(null)
                    handleMapClick(e)
                }}
                onLoad={onMapLoad}
                options={mapOptions}
            >
                {/* Start Marker */}
                {route.startPoint && (
                    <Marker
                        position={{ lat: route.startPoint.lat, lng: route.startPoint.lng }}
                        onClick={() => {
                            setActiveInfo({
                                kind: 'start',
                                id: 'start',
                                data: route.startPoint,
                                position: { lat: route.startPoint.lat, lng: route.startPoint.lng },
                            })
                        }}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: activeInfo?.kind === 'start' ? 16 : 14,
                            fillColor: '#10B981',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 3,
                        }}
                        title="Start"
                    />
                )}

                {/* End Marker */}
                {route.endPoint && (
                    <Marker
                        position={{ lat: route.endPoint.lat, lng: route.endPoint.lng }}
                        onClick={() => {
                            setActiveInfo({
                                kind: 'end',
                                id: 'end',
                                data: route.endPoint,
                                position: { lat: route.endPoint.lat, lng: route.endPoint.lng },
                            })
                        }}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: activeInfo?.kind === 'end' ? 16 : 14,
                            fillColor: '#EF4444',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 3,
                        }}
                        title="End"
                    />
                )}

                {/* Stop Markers */}
                {route.stops.map((stop, index) => (
                    <Marker
                        key={stop.id}
                        position={{ lat: stop.lat, lng: stop.lng }}
                        onClick={() => {
                            setActiveInfo({
                                kind: 'stop',
                                id: stop.id,
                                data: { ...stop, index },
                                position: { lat: stop.lat, lng: stop.lng },
                            })
                        }}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: activeInfo?.kind === 'stop' && activeInfo?.id === stop.id ? 13 : 11,
                            fillColor: getStopColor(index),
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                        }}
                        label={{
                            text: String(index + 1),
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 'bold',
                        }}
                        title={stop.address || `Stop ${index + 1}`}
                    />
                ))}

                {/* Discover Markers */}
                {!editMode && discoverPlaces.map((p, index) => (
                    <Marker
                        key={p.placeId || p.id || `${p.lat}-${p.lng}-${index}`}
                        position={{ lat: p.lat, lng: p.lng }}
                        onClick={() => {
                            setActiveInfo({
                                kind: 'discover',
                                id: p.placeId || p.id,
                                data: p,
                                position: { lat: p.lat, lng: p.lng },
                            })
                        }}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: activeInfo?.kind === 'discover' && activeInfo?.id === (p.placeId || p.id) ? 11 : 9,
                            fillColor: isDark ? '#2DD4BF' : '#0F766E',
                            fillOpacity: 0.95,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                        }}
                        title={p.name}
                    />
                ))}

                {/* Route Directions */}
                {directions && (
                    <DirectionsRenderer
                        directions={directions}
                        options={{
                            suppressMarkers: true,
                            polylineOptions: {
                                strokeColor: isDark ? '#60A5FA' : '#3B82F6',
                                strokeWeight: 5,
                                strokeOpacity: 0.9,
                            },
                        }}
                    />
                )}

                {/* Custom Popover */}
                {activeInfo?.position && (
                    <OverlayView
                        position={activeInfo.position}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        getPixelPositionOffset={(w, h) => getOffset(w, h)}
                    >
                        <div className="pointer-events-auto w-[280px] rounded-3xl border border-border/50 bg-background/90 backdrop-blur-xl shadow-xl overflow-hidden">
                            <div className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${activeInfo.kind === 'start' ? 'bg-success/15 text-success' :
                                        activeInfo.kind === 'end' ? 'bg-destructive/15 text-destructive' :
                                            activeInfo.kind === 'stop' ? 'bg-warning/15 text-warning' :
                                                'bg-primary/12 text-primary'
                                        }`}>
                                        {activeInfo.kind === 'start' ? <Navigation className="w-5 h-5" /> :
                                            activeInfo.kind === 'end' ? <Flag className="w-5 h-5" /> :
                                                <MapPin className="w-5 h-5" />}
                                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <div className="text-sm font-semibold truncate">
                                                    {activeInfo.kind === 'start'
                                                        ? (activeInfo.data?.name || 'Start')
                                                        : activeInfo.kind === 'end'
                                                            ? (activeInfo.data?.name || 'End')
                                                            : activeInfo.kind === 'stop'
                                                                ? (activeInfo.data?.name || `Stop ${typeof activeInfo.data?.index === 'number' ? activeInfo.data.index + 1 : ''}`)
                                                                : (activeInfo.data?.name || 'Place')}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                    {activeInfo.data?.address || `${activeInfo.position.lat.toFixed(5)}, ${activeInfo.position.lng.toFixed(5)}`}
                                </div>
                            </div>
                                            <button
                                                onClick={() => setActiveInfo(null)}
                                                className="h-8 w-8 rounded-full hover:bg-secondary/60 text-muted-foreground transition-colors focus-ring flex items-center justify-center"
                                                aria-label="Close"
                                            >
                                                <span className="text-lg leading-none">×</span>
                                            </button>
                                        </div>

                                        {typeof activeInfo.data?.rating === 'number' && (
                                            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="inline-flex items-center gap-1 text-foreground">
                                                    <Star className="w-3.5 h-3.5 text-warning" />
                                                    {activeInfo.data.rating.toFixed(1)}
                                                </span>
                                                {activeInfo.data.userRatingsTotal ? (
                                                    <span>({activeInfo.data.userRatingsTotal})</span>
                                                ) : null}
                                                {activeInfo.data.isOpenNow === true ? (
                                                    <span className="ml-auto text-success font-semibold">Open now</span>
                                                ) : null}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {activeInfo.data?.photoUrl && (
                                    <div className="mt-3 h-[112px] rounded-2xl overflow-hidden border border-border/50 bg-secondary/40">
                                        <img
                                            src={activeInfo.data.photoUrl}
                                            alt={activeInfo.data?.name || 'Place photo'}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    </div>
                                )}

                                <div className="mt-3 flex flex-wrap gap-2">
                                    {activeInfo.kind === 'discover' && (
                                        <>
                                            <button
                                                className="h-9 px-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity focus-ring inline-flex items-center gap-2"
                                                onClick={() => {
                                                    onAddStop({
                                                        lat: activeInfo.position.lat,
                                                        lng: activeInfo.position.lng,
                                                        address: activeInfo.data?.address || activeInfo.data?.name,
                                                        name: activeInfo.data?.name,
                                                        type: activeInfo.data?.type,
                                                        placeId: activeInfo.data?.placeId,
                                                    })
                                                    setActiveInfo(null)
                                                }}
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Add stop
                                            </button>
                                            <button
                                                className="h-9 px-3 rounded-full bg-secondary/60 hover:bg-secondary border border-border/50 text-xs font-semibold focus-ring inline-flex items-center gap-2"
                                                onClick={() => {
                                                    onSetStart({
                                                        lat: activeInfo.position.lat,
                                                        lng: activeInfo.position.lng,
                                                        address: activeInfo.data?.address || activeInfo.data?.name,
                                                        name: activeInfo.data?.name,
                                                        placeId: activeInfo.data?.placeId,
                                                    })
                                                    setActiveInfo(null)
                                                }}
                                            >
                                                <Navigation className="w-3.5 h-3.5" />
                                                Start
                                            </button>
                                            <button
                                                className="h-9 px-3 rounded-full bg-secondary/60 hover:bg-secondary border border-border/50 text-xs font-semibold focus-ring inline-flex items-center gap-2"
                                                onClick={() => {
                                                    onSetEnd({
                                                        lat: activeInfo.position.lat,
                                                        lng: activeInfo.position.lng,
                                                        address: activeInfo.data?.address || activeInfo.data?.name,
                                                        name: activeInfo.data?.name,
                                                        placeId: activeInfo.data?.placeId,
                                                    })
                                                    setActiveInfo(null)
                                                }}
                                            >
                                                <Flag className="w-3.5 h-3.5" />
                                                End
                                            </button>
                                        </>
                                    )}

                                    {activeInfo.kind === 'stop' && onRemoveStop && activeInfo.id && (
                                        <button
                                            className="h-9 px-3 rounded-full bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/15 transition-colors focus-ring inline-flex items-center gap-2"
                                            onClick={() => {
                                                onRemoveStop(activeInfo.id)
                                                setActiveInfo(null)
                                            }}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Remove
                                        </button>
                                    )}

                                    <a
                                        className="h-9 px-3 rounded-full bg-secondary/60 hover:bg-secondary border border-border/50 text-xs font-semibold focus-ring inline-flex items-center gap-2"
                                        href={openGoogleMapsLink(activeInfo.data?.placeId, activeInfo.data?.name, activeInfo.position.lat, activeInfo.position.lng)}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        Open
                                    </a>
                                </div>
                            </div>
                        </div>
                    </OverlayView>
                )}
            </GoogleMap>

            {/* Edit Mode Indicator */}
            {editMode && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="glass-card px-5 py-3 rounded-2xl animate-slide-down">
                        <div className="flex items-center gap-3 text-sm font-semibold">
                            {editMode === 'start' && (
                                <>
                                    <div className="w-4 h-4 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
                                    <span className="text-gray-700 dark:text-slate-300">Click map to set start point</span>
                                </>
                            )}
                            {editMode === 'end' && (
                                <>
                                    <div className="w-4 h-4 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
                                    <span className="text-gray-700 dark:text-slate-300">Click map to set end point</span>
                                </>
                            )}
                            {editMode === 'stop' && (
                                <>
                                    <div className="w-4 h-4 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50" />
                                    <span className="text-gray-700 dark:text-slate-300">Click map to add a stop</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-6 left-4 z-10">
                <div className="glass-card p-4 rounded-xl">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Legend</h4>
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-green-500 shadow-md shadow-green-500/40" />
                            <span className="text-sm font-medium text-gray-600 dark:text-slate-300">Start</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-red-500 shadow-md shadow-red-500/40" />
                            <span className="text-sm font-medium text-gray-600 dark:text-slate-300">End</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-amber-500 shadow-md shadow-amber-500/40" />
                            <span className="text-sm font-medium text-gray-600 dark:text-slate-300">Stop</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
