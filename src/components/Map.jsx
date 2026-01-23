import { useCallback, useEffect, useRef, useState } from 'react'
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api'
import { useTheme } from '../context/ThemeContext'
import { getStopColor, createPoint, getWaypoints } from '../utils/routeHelpers'

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
    onUpdateRouteInfo,
    selectedArea,
    onUserLocationChange,
}) {
    const { isDark } = useTheme()
    const mapRef = useRef(null)
    const geocoderRef = useRef(null)
    const directionsServiceRef = useRef(null)
    const [directions, setDirections] = useState(null)
    const [userLocation, setUserLocation] = useState(null)
    const [mapCenter, setMapCenter] = useState(() => {
        if (selectedArea) {
            return { lat: selectedArea.lat, lng: selectedArea.lng }
        }
        return DEFAULT_CENTER
    })
    const [mapZoom, setMapZoom] = useState(() => (selectedArea ? 12 : 14))

    // Get user's location on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    }
                    setUserLocation(loc)
                    if (!selectedArea) {
                        setMapCenter(loc)
                    }
                    if (onUserLocationChange) {
                        onUserLocationChange(loc)
                    }
                },
                () => {
                    console.log('Geolocation permission denied, using default location')
                }
            )
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
        }
    }, [route.startPoint])

    // Pan to end point when set (less aggressive zoom)
    useEffect(() => {
        if (route.endPoint && mapRef.current && !route.startPoint) {
            mapRef.current.panTo({ lat: route.endPoint.lat, lng: route.endPoint.lng })
            mapRef.current.setZoom(15)
        }
    }, [route.endPoint, route.startPoint])

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
                callback(results[0].formatted_address)
            } else {
                callback('')
            }
        })
    }, [])

    const handleMapClick = useCallback((event) => {
        if (!editMode) return

        const latLng = event.latLng
        const point = createPoint(latLng)

        // Reverse geocode to get address
        reverseGeocode(latLng, (address) => {
            const pointWithAddress = { ...point, address }

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

    const mapOptions = {
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: isDark ? darkModeStyles : [],
        clickableIcons: false,
    }

    return (
        <div className="relative w-full h-full">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={mapZoom}
                onClick={handleMapClick}
                onLoad={onMapLoad}
                options={mapOptions}
            >
                {/* Start Marker */}
                {route.startPoint && (
                    <Marker
                        position={{ lat: route.startPoint.lat, lng: route.startPoint.lng }}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 14,
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
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 14,
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
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 11,
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
