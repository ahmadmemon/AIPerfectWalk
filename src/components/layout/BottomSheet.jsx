import { useEffect, useRef, useState } from 'react'

const SNAP_HEIGHTS = {
    collapsed: '120px',
    half: '50vh',
    full: 'calc(100vh - 88px)',
}

export default function BottomSheet({ children, defaultSnap = 'half' }) {
    const [snap, setSnap] = useState(defaultSnap)
    const [isDragging, setIsDragging] = useState(false)
    const [dragStartY, setDragStartY] = useState(0)
    const sheetRef = useRef(null)

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setSnap('collapsed')
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [])

    const handleDragStart = (e) => {
        setIsDragging(true)
        const clientY = e.touches ? e.touches[0].clientY : e.clientY
        setDragStartY(clientY)
    }

    const handleDragEnd = (e) => {
        if (!isDragging) return
        setIsDragging(false)

        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY
        const delta = dragStartY - clientY
        const threshold = 50

        if (delta > threshold) {
            if (snap === 'collapsed') setSnap('half')
            else if (snap === 'half') setSnap('full')
        } else if (delta < -threshold) {
            if (snap === 'full') setSnap('half')
            else if (snap === 'half') setSnap('collapsed')
        }
    }

    return (
        <div
            ref={sheetRef}
            className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/50 rounded-t-3xl shadow-2xl transition-[height] duration-300 ease-out"
            style={{ height: SNAP_HEIGHTS[snap] }}
        >
            <div
                className="flex items-center justify-center py-3 cursor-grab active:cursor-grabbing touch-none"
                onTouchStart={handleDragStart}
                onTouchEnd={handleDragEnd}
                onMouseDown={handleDragStart}
                onMouseUp={handleDragEnd}
                onMouseLeave={() => isDragging && setIsDragging(false)}
                role="button"
                tabIndex={0}
                aria-label="Resize panel"
            >
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="absolute top-3 right-4 flex gap-1.5">
                {['collapsed', 'half', 'full'].map((s) => (
                    <button
                        key={s}
                        onClick={() => setSnap(s)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${snap === s ? 'bg-primary' : 'bg-muted-foreground/30'
                            }`}
                        aria-label={`Snap to ${s}`}
                    />
                ))}
            </div>

            <div className="h-[calc(100%-40px)] overflow-y-auto overscroll-contain px-4 pb-safe">
                {children}
            </div>
        </div>
    )
}

