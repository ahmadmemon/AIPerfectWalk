import { useState, useCallback } from 'react'

const INITIAL_STATE = {
    startPoint: null,
    endPoint: null,
    stops: [],
    routePath: null,
    distance: null,
    duration: null,
}

/**
 * Custom hook for managing route state
 */
export function useRoute() {
    const [route, setRoute] = useState(INITIAL_STATE)
    const [editMode, setEditMode] = useState(null) // 'start' | 'end' | 'stop' | null

    const setStartPoint = useCallback((point) => {
        setRoute(prev => ({ ...prev, startPoint: point }))
        setEditMode(null)
    }, [])

    const setEndPoint = useCallback((point) => {
        setRoute(prev => ({ ...prev, endPoint: point }))
        setEditMode(null)
    }, [])

    const addStop = useCallback((point) => {
        setRoute(prev => ({
            ...prev,
            stops: [...prev.stops, { ...point, id: Date.now().toString() }]
        }))
        setEditMode(null)
    }, [])

    const removeStop = useCallback((stopId) => {
        setRoute(prev => ({
            ...prev,
            stops: prev.stops.filter(stop => stop.id !== stopId)
        }))
    }, [])

    const reorderStops = useCallback((fromIndex, toIndex) => {
        setRoute(prev => {
            const newStops = [...prev.stops]
            const [removed] = newStops.splice(fromIndex, 1)
            newStops.splice(toIndex, 0, removed)
            return { ...prev, stops: newStops }
        })
    }, [])

    const updateRouteInfo = useCallback((routePath, distance, duration) => {
        setRoute(prev => ({ ...prev, routePath, distance, duration }))
    }, [])

    const clearRoute = useCallback(() => {
        setRoute(INITIAL_STATE)
        setEditMode(null)
    }, [])

    const loadRoute = useCallback((savedRoute) => {
        setRoute({
            startPoint: savedRoute.startPoint,
            endPoint: savedRoute.endPoint,
            stops: savedRoute.stops || [],
            routePath: null,
            distance: savedRoute.distance || null,
            duration: savedRoute.duration || null,
        })
        setEditMode(null)
    }, [])

    const getRouteForSaving = useCallback(() => {
        return {
            startPoint: route.startPoint,
            endPoint: route.endPoint,
            stops: route.stops,
            distance: route.distance,
            duration: route.duration,
        }
    }, [route])

    const hasValidRoute = route.startPoint && route.endPoint

    return {
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
    }
}
