/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Light mode
                light: {
                    bg: '#FAFAFA',
                    surface: '#FFFFFF',
                    text: '#1F2937',
                    muted: '#6B7280',
                },
                // Dark mode
                dark: {
                    bg: '#0F172A',
                    surface: '#1E293B',
                    text: '#F1F5F9',
                    muted: '#94A3B8',
                },
                // Accent colors
                primary: {
                    light: '#3B82F6',
                    dark: '#60A5FA',
                },
                accent: {
                    light: '#10B981',
                    dark: '#34D399',
                }
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'pulse-soft': 'pulseSoft 2s infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
            },
        },
    },
    plugins: [],
}
