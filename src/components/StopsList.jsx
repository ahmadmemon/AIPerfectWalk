import { useState } from 'react'
import StopItem from './StopItem'

export default function StopsList({ stops, onRemoveStop, onReorderStops }) {
    const [draggedIndex, setDraggedIndex] = useState(null)

    const handleDragStart = (e, index) => {
        setDraggedIndex(index)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = (e, dropIndex) => {
        e.preventDefault()
        if (draggedIndex !== null && draggedIndex !== dropIndex) {
            onReorderStops(draggedIndex, dropIndex)
        }
        setDraggedIndex(null)
    }

    if (stops.length === 0) {
        return (
            <div className="text-center py-4 text-gray-400 dark:text-slate-500 text-sm">
                No stops added yet
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {stops.map((stop, index) => (
                <StopItem
                    key={stop.id}
                    stop={stop}
                    index={index}
                    onRemove={onRemoveStop}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                />
            ))}
        </div>
    )
}
