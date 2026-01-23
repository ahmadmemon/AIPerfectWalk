import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '')

// Cache for suggestions to avoid repeated API calls
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

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
