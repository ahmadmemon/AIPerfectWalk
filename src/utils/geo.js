export function haversineDistanceMeters(a, b) {
    if (!a || !b) return null
    const toRad = (deg) => (deg * Math.PI) / 180
    const R = 6371000
    const dLat = toRad(b.lat - a.lat)
    const dLng = toRad(b.lng - a.lng)
    const lat1 = toRad(a.lat)
    const lat2 = toRad(b.lat)

    const sinDLat = Math.sin(dLat / 2)
    const sinDLng = Math.sin(dLng / 2)
    const h =
        sinDLat * sinDLat +
        Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng
    return 2 * R * Math.asin(Math.sqrt(h))
}

export function formatMetersShort(meters) {
    if (meters == null || Number.isNaN(meters)) return ''
    if (meters < 1000) return `${Math.round(meters)} m`
    return `${(meters / 1000).toFixed(1)} km`
}

