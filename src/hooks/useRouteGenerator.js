import { useCallback, useState } from 'react'
import { generateRoute } from '../services/geminiService'

const INITIAL = {
    status: 'idle', // idle | loading | success | error
    result: null,
    error: null,
}

function isValidLatLng(point) {
    return point && typeof point.lat === 'number' && typeof point.lng === 'number'
}

function normalizeName(name, fallback) {
    if (typeof name === 'string' && name.trim()) return name.trim()
    return fallback
}

function normalizeRoute(raw) {
    const start = raw?.start
    const end = raw?.end
    const stops = Array.isArray(raw?.stops) ? raw.stops : []

    if (!isValidLatLng(start) || !isValidLatLng(end)) {
        return null
    }

    const normalizedStops = stops
        .filter(isValidLatLng)
        .map((s, i) => ({
            lat: s.lat,
            lng: s.lng,
            name: normalizeName(s.name, `Stop ${i + 1}`),
        }))

    return {
        start: { lat: start.lat, lng: start.lng, name: normalizeName(start.name, 'Start') },
        stops: normalizedStops,
        end: { lat: end.lat, lng: end.lng, name: normalizeName(end.name, 'End') },
        totalDistance: typeof raw?.totalDistance === 'string' ? raw.totalDistance : '',
        description: typeof raw?.description === 'string' ? raw.description : '',
    }
}

function toLoadRoute(route) {
    return {
        startPoint: {
            lat: route.start.lat,
            lng: route.start.lng,
            name: route.start.name,
            address: route.start.name,
        },
        endPoint: {
            lat: route.end.lat,
            lng: route.end.lng,
            name: route.end.name,
            address: route.end.name,
        },
        stops: route.stops.map((s) => ({
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            lat: s.lat,
            lng: s.lng,
            name: s.name,
            address: s.name,
        })),
        distance: null,
        duration: null,
    }
}

export function useRouteGenerator() {
    const [state, setState] = useState(INITIAL)

    const reset = useCallback(() => setState(INITIAL), [])

    const generate = useCallback(async (prompt, { area, userLocation } = {}) => {
        const cleanedPrompt = typeof prompt === 'string' ? prompt.trim() : ''
        if (!cleanedPrompt) {
            setState({ status: 'error', result: null, error: 'Enter a prompt to generate a route.' })
            return null
        }

        setState({ status: 'loading', result: null, error: null })

        try {
            const raw = await generateRoute(cleanedPrompt, area, userLocation)
            const normalized = normalizeRoute(raw)
            if (!normalized) {
                setState({ status: 'error', result: null, error: 'The AI response was incomplete. Try a different prompt.' })
                return null
            }

            const result = {
                route: normalized,
                loadRouteData: toLoadRoute(normalized),
            }

            setState({ status: 'success', result, error: null })
            return result
        } catch (err) {
            console.error(err)
            setState({ status: 'error', result: null, error: 'Failed to generate route. Please try again.' })
            return null
        }
    }, [])

    return {
        generate,
        result: state.result,
        isLoading: state.status === 'loading',
        error: state.error,
        reset,
    }
}
