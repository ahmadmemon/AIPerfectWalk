import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
    const { isDark, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            className="relative h-9 w-9 rounded-full bg-secondary/60 hover:bg-secondary border border-border/50 transition-colors focus-ring flex items-center justify-center"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            <div className="relative w-5 h-5">
                <Sun
                    className={`absolute inset-0 w-5 h-5 transition-all duration-200 ${isDark ? 'opacity-100 rotate-0 text-warning' : 'opacity-0 rotate-90'
                        }`}
                />
                <Moon
                    className={`absolute inset-0 w-5 h-5 transition-all duration-200 ${isDark ? 'opacity-0 -rotate-90' : 'opacity-100 rotate-0 text-muted-foreground'
                        }`}
                />
            </div>
        </button>
    )
}
