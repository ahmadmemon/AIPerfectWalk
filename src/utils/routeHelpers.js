/**
 * Format distance in human-readable format
 * @param {number} meters - distance in meters
 */
export function formatDistance(meters) {
    if (!meters) return ''
    if (meters < 1000) {
        return `${Math.round(meters)} m`
    }
    return `${(meters / 1000).toFixed(2)} km`
}

/**
 * Format duration in human-readable format
 * @param {number} seconds - duration in seconds
 */
export function formatDuration(seconds) {
    if (!seconds) return ''
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
        return `${hours}h ${minutes}m`
    }
    return `${minutes} min`
}

/**
 * Generate a unique color for a stop marker based on index
 * @param {number} index - stop index
 */
export function getStopColor(index) {
    const colors = [
        '#F59E0B', // amber
        '#8B5CF6', // violet
        '#EC4899', // pink
        '#06B6D4', // cyan
        '#84CC16', // lime
        '#F97316', // orange
        '#6366F1', // indigo
    ]
    return colors[index % colors.length]
}

/**
 * Create a point object from Google Maps LatLng
 * @param {google.maps.LatLng} latLng 
 * @param {string} address - optional address
 */
export function createPoint(latLng, address = '') {
    return {
        lat: latLng.lat(),
        lng: latLng.lng(),
        address,
    }
}

/**
 * Calculate waypoints for Google Directions API
 * @param {Array} stops - array of stop points
 */
export function getWaypoints(stops) {
    return stops.map(stop => ({
        location: { lat: stop.lat, lng: stop.lng },
        stopover: true,
    }))
}
