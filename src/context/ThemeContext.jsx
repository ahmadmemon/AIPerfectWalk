import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(() => {
        // Check localStorage first
        const saved = localStorage.getItem('theme')
        if (saved) {
            return saved === 'dark'
        }
        // Fall back to system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches
    })

    useEffect(() => {
        // Apply theme to body
        if (isDark) {
            document.body.classList.add('dark')
        } else {
            document.body.classList.remove('dark')
        }
        // Save to localStorage
        localStorage.setItem('theme', isDark ? 'dark' : 'light')
    }, [isDark])

    const toggleTheme = () => setIsDark(!isDark)

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
