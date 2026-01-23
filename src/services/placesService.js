function ensurePlaces() {
    if (!window.google?.maps?.places) {
        throw new Error('Google Places API is not available')
    }
}

function getService() {
    ensurePlaces()
    const dummyDiv = document.createElement('div')
    return new window.google.maps.places.PlacesService(dummyDiv)
}

function normalizeLocation(location) {
    if (!location) return null
    if (typeof location.lat === 'function' && typeof location.lng === 'function') {
        return { lat: location.lat(), lng: location.lng() }
    }
    return { lat: location.lat, lng: location.lng }
}

function placePhotoUrl(place, { maxWidth = 640, maxHeight = 640 } = {}) {
    try {
        const photo = place?.photos?.[0]
        return photo ? photo.getUrl({ maxWidth, maxHeight }) : null
    } catch {
        return null
    }
}

function mapPlaceToSuggestion(place, fallbackType) {
    const loc = place?.geometry?.location
    const location = loc ? normalizeLocation(loc) : null
    return {
        id: place.place_id,
        placeId: place.place_id,
        name: place.name,
        address: place.vicinity || place.formatted_address || '',
        lat: location?.lat,
        lng: location?.lng,
        rating: place.rating ?? null,
        userRatingsTotal: place.user_ratings_total ?? null,
        isOpenNow: place.opening_hours?.isOpen?.() ?? place.opening_hours?.open_now ?? null,
        photoUrl: placePhotoUrl(place),
        type: fallbackType || 'place',
    }
}

function dedupeByPlaceId(items) {
    const seen = new Set()
    return items.filter((item) => {
        const key = item.placeId || item.id
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
    })
}

export function nearbySearch({ location, radius = 3000, type, keyword } = {}) {
    ensurePlaces()
    const service = getService()
    const loc = normalizeLocation(location)
    if (!loc) return Promise.resolve([])

    const request = {
        location: loc,
        radius,
    }
    if (type) request.type = type
    if (keyword) request.keyword = keyword

    return new Promise((resolve, reject) => {
        service.nearbySearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                resolve(results)
            } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                resolve([])
            } else {
                reject(new Error(`Places nearbySearch failed: ${status}`))
            }
        })
    })
}

export function textSearch({ location, radius = 8000, query } = {}) {
    ensurePlaces()
    const service = getService()
    const loc = normalizeLocation(location)
    if (!loc || !query) return Promise.resolve([])

    const request = {
        query,
        location: loc,
        radius,
    }

    return new Promise((resolve, reject) => {
        service.textSearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                resolve(results)
            } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                resolve([])
            } else {
                reject(new Error(`Places textSearch failed: ${status}`))
            }
        })
    })
}

export async function getNearbySuggestions(category, location) {
    const loc = normalizeLocation(location)
    if (!loc) return []

    const radius = 3500
    let results = []

    if (category === 'coffee') {
        results = await nearbySearch({ location: loc, radius, type: 'cafe', keyword: 'coffee' })
        return results.map((p) => mapPlaceToSuggestion(p, 'coffee'))
    }

    if (category === 'parks') {
        results = await nearbySearch({ location: loc, radius, type: 'park' })
        return results.map((p) => mapPlaceToSuggestion(p, 'park'))
    }

    if (category === 'food') {
        const restaurants = await nearbySearch({ location: loc, radius, type: 'restaurant' })
        const bakeries = await nearbySearch({ location: loc, radius, type: 'bakery' })
        results = dedupeByPlaceId([
            ...restaurants.map((p) => mapPlaceToSuggestion(p, 'food')),
            ...bakeries.map((p) => mapPlaceToSuggestion(p, 'food')),
        ])
        return results
    }

    return []
}

export async function resolvePlaceQuery(query, location, { radius = 10000 } = {}) {
    const results = await textSearch({ query, location, radius })
    if (!results.length) return null
    return mapPlaceToSuggestion(results[0], 'place')
}

export function isPlacesConfigured() {
    try {
        ensurePlaces()
        return true
    } catch {
        return false
    }
}
