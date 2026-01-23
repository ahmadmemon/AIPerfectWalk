import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for localStorage with React state sync
 * @param {string} key - localStorage key
 * @param {any} initialValue - default value if key doesn't exist
 */
export function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error)
            return initialValue
        }
    })

    // Sync to localStorage whenever storedValue changes
    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue))
        } catch (error) {
            console.error(`Error saving localStorage key "${key}":`, error)
        }
    }, [key, storedValue])

    return [storedValue, setStoredValue]
}

/**
 * Save routes to localStorage
 */
export function useSavedRoutes() {
    const [routes, setRoutes] = useLocalStorage('perfectwalk_routes', [])

    const saveRoute = useCallback((route) => {
        const newRoute = {
            ...route,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
        }
        setRoutes(prevRoutes => {
            const updated = [...prevRoutes, newRoute]
            console.log('Saving route:', newRoute, 'Total routes:', updated.length)
            return updated
        })
        return newRoute
    }, [setRoutes])

    const deleteRoute = useCallback((id) => {
        setRoutes(prevRoutes => prevRoutes.filter(route => route.id !== id))
    }, [setRoutes])

    const updateRoute = useCallback((id, updates) => {
        setRoutes(prevRoutes => prevRoutes.map(route =>
            route.id === id ? { ...route, ...updates } : route
        ))
    }, [setRoutes])

    return { routes, saveRoute, deleteRoute, updateRoute }
}
