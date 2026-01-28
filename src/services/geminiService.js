import { GoogleGenerativeAI } from '@google/generative-ai'
import { isPlacesConfigured, resolvePlaceQuery } from './placesService'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '')

// Cache for suggestions to avoid repeated API calls
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 } // San Francisco

function getCacheKey(type, location) {
    return `${type}-${location.lat.toFixed(3)}-${location.lng.toFixed(3)}`
}

function getFromCache(key) {
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data
    }
    cache.delete(key)
    return null
}

function setCache(key, data) {
    cache.set(key, { data, timestamp: Date.now() })
}

/**
 * Generate AI recommendations for a category
 */
export async function getRecommendations(category, location, areaName = '') {
    const cacheKey = getCacheKey(category, location)
    const cached = getFromCache(cacheKey)
    if (cached) return cached

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompts = {
        coffee: `You are a local guide. Suggest 5 popular coffee shops and cafes near ${areaName || `coordinates ${location.lat}, ${location.lng}`}. 
For each place, provide:
- name: The business name
- description: A brief 10-15 word description of why it's great
- type: "coffee"
- popularity: "High", "Medium", or "Local Favorite"

Return ONLY a valid JSON array with these exact fields. Example:
[{"name": "Blue Bottle Coffee", "description": "Famous pour-over coffee with minimalist vibes", "type": "coffee", "popularity": "High"}]`,

        trails: `You are a local fitness guide. Suggest 5 popular running trails, walking paths, or jogging tracks near ${areaName || `coordinates ${location.lat}, ${location.lng}`}.
For each trail, provide:
- name: The trail or path name
- description: A brief 10-15 word description of the trail
- type: "trail"
- popularity: "High", "Medium", or "Local Favorite"
- difficulty: "Easy", "Moderate", or "Challenging"

Return ONLY a valid JSON array. Example:
[{"name": "Golden Gate Park Trail", "description": "Scenic 3-mile loop through lush gardens and lakes", "type": "trail", "popularity": "High", "difficulty": "Easy"}]`,

        parks: `You are a local guide. Suggest 5 beautiful parks, gardens, or scenic viewpoints near ${areaName || `coordinates ${location.lat}, ${location.lng}`}.
For each place, provide:
- name: The park or viewpoint name
- description: A brief 10-15 word description
- type: "park"
- popularity: "High", "Medium", or "Local Favorite"

Return ONLY a valid JSON array. Example:
[{"name": "Dolores Park", "description": "Sunny hilltop park with stunning city skyline views", "type": "park", "popularity": "High"}]`,

        food: `You are a local food guide. Suggest 5 recommended restaurants, bakeries, or food spots near ${areaName || `coordinates ${location.lat}, ${location.lng}`} that would be great for a break during a walk.
For each place, provide:
- name: The business name
- description: A brief 10-15 word description
- type: "food"
- cuisine: Type of food (e.g., "Italian", "Bakery", "Brunch")
- popularity: "High", "Medium", or "Local Favorite"

Return ONLY a valid JSON array. Example:
[{"name": "Tartine Bakery", "description": "Legendary bakery with amazing croissants and morning buns", "type": "food", "cuisine": "Bakery", "popularity": "High"}]`
    }

    try {
        const result = await model.generateContent(prompts[category])
        const response = await result.response
        const text = response.text()

        // Extract JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
            const suggestions = JSON.parse(jsonMatch[0])
            // Add unique IDs
            const formattedSuggestions = suggestions.map((s, i) => ({
                ...s,
                id: `${category}-${Date.now()}-${i}`,
            }))
            setCache(cacheKey, formattedSuggestions)
            return formattedSuggestions
        }

        throw new Error('Invalid response format')
    } catch (error) {
        console.error('Gemini API error:', error)
        // Return fallback suggestions if API fails
        return getFallbackSuggestions(category)
    }
}

/**
 * Get AI suggestions for route enhancement
 */
export async function getRouteSuggestions(startPoint, endPoint, areaName = '') {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `You are a walking route expert. Given a route from "${startPoint?.address || 'start'}" to "${endPoint?.address || 'end'}" in ${areaName || 'the area'}, suggest 3 interesting stops to add along the way.

For each suggestion, provide:
- name: Place name
- description: Why to stop here (10-15 words)
- type: "coffee", "park", "viewpoint", or "landmark"

Return ONLY a valid JSON array.`

    try {
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
            const suggestions = JSON.parse(jsonMatch[0])
            return suggestions.map((s, i) => ({
                ...s,
                id: `route-${Date.now()}-${i}`,
            }))
        }

        return []
    } catch (error) {
        console.error('Route suggestions error:', error)
        return []
    }
}

/**
 * Fallback suggestions when API fails
 */
function getFallbackSuggestions(category) {
    const fallbacks = {
        coffee: [
            { id: 'fb-1', name: 'Local Coffee Shop', description: 'A cozy neighborhood spot for espresso lovers', type: 'coffee', popularity: 'Local Favorite' },
            { id: 'fb-2', name: 'Artisan Roastery', description: 'Fresh roasted beans and expert baristas', type: 'coffee', popularity: 'High' },
        ],
        trails: [
            { id: 'fb-1', name: 'City Park Loop', description: 'A scenic loop through green spaces', type: 'trail', popularity: 'High', difficulty: 'Easy' },
            { id: 'fb-2', name: 'Riverside Path', description: 'Flat walking path along the waterfront', type: 'trail', popularity: 'Medium', difficulty: 'Easy' },
        ],
        parks: [
            { id: 'fb-1', name: 'Central Park', description: 'Green oasis in the heart of the city', type: 'park', popularity: 'High' },
            { id: 'fb-2', name: 'Botanical Gardens', description: 'Beautiful gardens with diverse plant life', type: 'park', popularity: 'Medium' },
        ],
        food: [
            { id: 'fb-1', name: 'Local Bakery', description: 'Fresh pastries and artisan breads daily', type: 'food', cuisine: 'Bakery', popularity: 'Local Favorite' },
            { id: 'fb-2', name: 'Healthy Bites Cafe', description: 'Fresh salads and smoothies for on-the-go', type: 'food', cuisine: 'Healthy', popularity: 'Medium' },
        ],
    }

    return fallbacks[category] || []
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured() {
    return !!import.meta.env.VITE_GEMINI_API_KEY
}

function extractJsonObject(text) {
    if (!text) return null
    const cleaned = text.replace(/```json\s*/g, '```').replace(/```/g, '')
    const match = cleaned.match(/\{[\s\S]*\}/)
    return match ? match[0] : null
}

function clampStops(stops, max = 6) {
    if (!Array.isArray(stops)) return []
    return stops.filter(Boolean).slice(0, max)
}

function isValidLatLng(point) {
    return point && typeof point.lat === 'number' && typeof point.lng === 'number'
}

function nudgeLatLng(loc, seed = 1) {
    if (!isValidLatLng(loc)) return loc
    const delta = 0.0015 + (seed % 3) * 0.0004
    return { lat: loc.lat + delta, lng: loc.lng + delta * 0.6 }
}

function getFallbackRoute({ prompt, area, userLocation } = {}) {
    const base = (isValidLatLng(userLocation) && userLocation)
        || (isValidLatLng(area) && { lat: area.lat, lng: area.lng })
        || DEFAULT_CENTER

    const start = { ...base, name: 'Start' }
    const end = { ...nudgeLatLng(base, 2), name: 'End' }

    return {
        start,
        stops: [],
        end,
        totalDistance: '',
        description: typeof prompt === 'string' && prompt.trim()
            ? `A simple walk based on: ${prompt.trim()}`
            : 'A simple walk route.',
    }
}

/**
 * Generate a route from a natural language prompt.
 * Returns: { start, stops, end, totalDistance, description }
 */
export async function generateRoute(prompt, area, userLocation) {
    if (!isGeminiConfigured()) {
        return getFallbackRoute({ prompt, area, userLocation })
    }

    const areaName = area?.name || ''
    const contextLocation = (isValidLatLng(userLocation) && userLocation)
        || (isValidLatLng(area) && { lat: area.lat, lng: area.lng })
        || DEFAULT_CENTER

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const aiPrompt = `You are PerfectWalk's AI route generator.

Context:
- Area name: ${areaName || 'unknown'}
- Center coordinates: ${contextLocation.lat}, ${contextLocation.lng}

User request:
${typeof prompt === 'string' ? prompt : ''}

Task:
Create a walking route with a start, 1-5 intermediate stops, and an end. Use real-world places that a user can search for in Google Maps/Google Places in the given area.

Output format:
Return ONLY valid JSON with this exact shape:
{
  "start": { "name": "string", "query": "string (search query)", "lat": number|null, "lng": number|null },
  "stops": [{ "name": "string", "query": "string", "lat": number|null, "lng": number|null }],
  "end": { "name": "string", "query": "string", "lat": number|null, "lng": number|null },
  "totalDistance": "string (e.g., 5 km)",
  "description": "string (1-2 sentences)"
}

Rules:
- Prefer using "query" that will resolve in Google Places (include city/neighborhood if helpful).
- If you include lat/lng, they must be realistic and match the place.
- Keep stops to at most 5.
- The route should be walkable and coherent.`

    try {
        const result = await model.generateContent(aiPrompt)
        const response = await result.response
        const text = response.text()

        const jsonText = extractJsonObject(text)
        if (!jsonText) {
            return getFallbackRoute({ prompt, area, userLocation })
        }

        const parsed = JSON.parse(jsonText)

        const startPlan = parsed?.start || null
        const endPlan = parsed?.end || null
        const stopsPlan = clampStops(parsed?.stops, 5)

        const canResolve = (() => {
            try {
                return isPlacesConfigured()
            } catch {
                return false
            }
        })()

        async function resolvePlannedPoint(planned, fallbackName, fallbackLoc) {
            const base = {
                name: typeof planned?.name === 'string' ? planned.name : fallbackName,
                lat: typeof planned?.lat === 'number' ? planned.lat : null,
                lng: typeof planned?.lng === 'number' ? planned.lng : null,
                query: typeof planned?.query === 'string' ? planned.query : '',
            }

            if (typeof base.lat === 'number' && typeof base.lng === 'number') {
                return { lat: base.lat, lng: base.lng, name: base.name }
            }

            if (!canResolve) {
                return { ...fallbackLoc, name: base.name }
            }

            const query = (base.query || base.name || '').trim()
            if (!query) {
                return { ...fallbackLoc, name: base.name }
            }

            const enrichedQuery = areaName ? `${query} ${areaName}` : query
            try {
                const match = await resolvePlaceQuery(enrichedQuery, contextLocation)
                if (match && typeof match.lat === 'number' && typeof match.lng === 'number') {
                    return { lat: match.lat, lng: match.lng, name: base.name || match.name || 'Place' }
                }
            } catch {
                // ignore and fall back
            }

            return { ...fallbackLoc, name: base.name }
        }

        const startFallback = contextLocation
        const start = await resolvePlannedPoint(startPlan, 'Start', startFallback)

        const resolvedStops = []
        for (let i = 0; i < stopsPlan.length; i++) {
            const stopFallback = nudgeLatLng(contextLocation, i + 10) || contextLocation
            // eslint-disable-next-line no-await-in-loop
            const stop = await resolvePlannedPoint(stopsPlan[i], `Stop ${i + 1}`, stopFallback)
            if (isValidLatLng(stop)) {
                resolvedStops.push(stop)
            }
        }

        let endFallback = nudgeLatLng(contextLocation, 99) || contextLocation
        const end = await resolvePlannedPoint(endPlan, 'End', endFallback)

        const safeTotalDistance = typeof parsed?.totalDistance === 'string' ? parsed.totalDistance : ''
        const safeDescription = typeof parsed?.description === 'string'
            ? parsed.description
            : 'A custom walking route generated from your request.'

        // Avoid start=end with no waypoints (Directions can behave oddly).
        if (!resolvedStops.length && isValidLatLng(start) && isValidLatLng(end) && start.lat === end.lat && start.lng === end.lng) {
            const nudged = nudgeLatLng(end, 5)
            end.lat = nudged.lat
            end.lng = nudged.lng
        }

        return {
            start: { lat: start.lat, lng: start.lng, name: start.name || 'Start' },
            stops: resolvedStops.map((s) => ({ lat: s.lat, lng: s.lng, name: s.name || 'Stop' })),
            end: { lat: end.lat, lng: end.lng, name: end.name || 'End' },
            totalDistance: safeTotalDistance,
            description: safeDescription,
        }
    } catch (error) {
        console.error('Generate route error:', error)
        return getFallbackRoute({ prompt, area, userLocation })
    }
}

/**
 * Chat-style helper for natural language requests.
 * Returns an object: { reply: string, places: Array<{ query: string, type?: string }> }
 */
export async function getChatResponse(message, { location, areaName = '', route } = {}) {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const routeContext = route?.startPoint && route?.endPoint ? {
        start: route.startPoint.address || 'start',
        end: route.endPoint.address || 'end',
        distanceMeters: route.distance || null,
        durationSeconds: route.duration || null,
        stopsCount: route.stops?.length || 0,
    } : null

    const prompt = `You are PerfectWalk's route assistant.

Context:
- Area: ${areaName || 'unknown'}
- Location center: ${location?.lat}, ${location?.lng}
- Current route context (may be null): ${routeContext ? JSON.stringify(routeContext) : 'null'}

User message:
${message}

Task:
1) Reply conversationally and concisely.
2) If helpful, propose up to 5 real-world place suggestions that the app can look up via Google Places.

Output format:
Return ONLY valid JSON with this exact shape:
{
  "reply": "string",
  "places": [
    { "query": "place name or search query", "type": "coffee|food|park|trail|landmark|viewpoint" }
  ]
}

Rules:
- Always include "reply".
- "places" can be an empty array.
- Make each "query" something Google Places can find (include neighborhood/city if needed).`

    try {
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        const jsonText = extractJsonObject(text)
        if (!jsonText) {
            return { reply: text.trim(), places: [] }
        }

        const parsed = JSON.parse(jsonText)
        return {
            reply: typeof parsed.reply === 'string' ? parsed.reply : String(parsed.reply || ''),
            places: Array.isArray(parsed.places) ? parsed.places.filter(p => p && p.query) : [],
        }
    } catch (error) {
        console.error('Gemini chat error:', error)
        return { reply: 'I had trouble generating a response. Please try again.', places: [] }
    }
}
