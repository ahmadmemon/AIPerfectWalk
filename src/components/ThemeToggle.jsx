import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
    const { isDark, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            className="
        relative p-2.5 rounded-xl
        bg-gray-100/80 dark:bg-slate-700/80
        hover:bg-gray-200 dark:hover:bg-slate-600
        border border-gray-200/50 dark:border-slate-600/50
        transition-all duration-300
        hover:scale-105 active:scale-95
        group
      "
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            <div className="relative w-5 h-5">
                <Sun className={`
          absolute inset-0 w-5 h-5 text-amber-500
          transition-all duration-300
          ${isDark ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}
        `} />
                <Moon className={`
          absolute inset-0 w-5 h-5 text-slate-600
          transition-all duration-300
          ${isDark ? 'opacity-0 -rotate-90' : 'opacity-100 rotate-0'}
        `} />
            </div>
        </button>
    )
}
