import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'perfectwalk_preferences'

export const VIBE_OPTIONS = [
    { id: 'scenic-nature', label: 'Scenic nature', icon: '🌿' },
    { id: 'parks-green', label: 'Parks & green loops', icon: '🌳' },
    { id: 'coffee-stop', label: 'Coffee stop', icon: '☕️' },
    { id: 'food-break', label: 'Food break', icon: '🥐' },
    { id: 'waterfront-views', label: 'Waterfront / views', icon: '🌊' },
    { id: 'landmarks', label: 'Landmarks & sightseeing', icon: '🏛️' },
    { id: 'quiet-streets', label: 'Quiet streets', icon: '🤫' },
    { id: 'safety-well-lit', label: 'Safety / well‑lit', icon: '💡' },
    { id: 'flat-easy', label: 'Flat & easy', icon: '🟦' },
    { id: 'hills-workout', label: 'Hills workout', icon: '⛰️' },
    { id: 'dog-friendly', label: 'Dog‑friendly', icon: '🐶' },
    { id: 'accessible', label: 'Wheelchair/stroller friendly', icon: '♿️' },
]

export const DISTANCE_OPTIONS = [
    { label: '2K', value: 2000 },
    { label: '5K', value: 5000 },
    { label: '10K', value: 10000 },
]

export const TIME_OPTIONS = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '60+ min', value: 60 },
]

function safeParse(json) {
    try {
        return JSON.parse(json)
    } catch {
        return null
    }
}

function normalizePreferences(prefs) {
    return {
        hasCompletedOnboarding: false,
        area: null,
        vibes: [],
        activity: 'walk',
        distance: 5000,
        routeShape: 'loop',
        timeAvailable: 30,
        ...prefs,
    }
}

export function usePreferences() {
    const [isLoading, setIsLoading] = useState(true)
    const [preferences, setPreferences] = useState(() => normalizePreferences(null))

    useEffect(() => {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        const parsed = raw ? safeParse(raw) : null
        setPreferences(normalizePreferences(parsed))
        setIsLoading(false)
    }, [])

    useEffect(() => {
        if (isLoading) return
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    }, [isLoading, preferences])

    const updatePreferences = useCallback((updates) => {
        setPreferences((prev) => normalizePreferences({ ...prev, ...updates }))
    }, [])

    const clearPreferences = useCallback(() => {
        window.localStorage.removeItem(STORAGE_KEY)
        setPreferences(normalizePreferences(null))
    }, [])

    const getPreferencesSummary = useCallback(() => {
        if (!preferences?.area?.name) return null
        const selectedLabels = (preferences.vibes || [])
            .map((id) => VIBE_OPTIONS.find((v) => v.id === id)?.label)
            .filter(Boolean)
        return {
            area: preferences.area.name,
            vibes: selectedLabels.slice(0, 2).join(' • ') + (selectedLabels.length > 2 ? '…' : ''),
        }
    }, [preferences])

    const defaultDiscoverCategory = useMemo(() => {
        const vibes = new Set(preferences.vibes || [])
        if (vibes.has('coffee-stop')) return 'coffee'
        if (vibes.has('parks-green') || vibes.has('scenic-nature')) return 'parks'
        if (vibes.has('food-break')) return 'food'
        return 'coffee'
    }, [preferences.vibes])

    return {
        isLoading,
        preferences,
        updatePreferences,
        clearPreferences,
        getPreferencesSummary,
        defaultDiscoverCategory,
    }
}

