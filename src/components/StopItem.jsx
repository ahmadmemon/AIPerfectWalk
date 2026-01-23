import { X, GripVertical } from 'lucide-react'
import { getStopColor } from '../utils/routeHelpers'

export default function StopItem({ stop, index, onRemove, onDragStart, onDragOver, onDrop }) {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, index)}
            className="
        flex items-center gap-3 p-3
        bg-white/60 dark:bg-slate-700/40
        backdrop-blur-sm
        border border-gray-200/50 dark:border-slate-600/30
        rounded-xl
        group cursor-move
        animate-slide-up
        hover:bg-white/80 dark:hover:bg-slate-700/60
        hover:shadow-md
        transition-all duration-200
      "
        >
            <GripVertical className="w-4 h-4 text-gray-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md flex-shrink-0"
                style={{
                    backgroundColor: getStopColor(index),
                    boxShadow: `0 4px 12px ${getStopColor(index)}40`
                }}
            >
                {index + 1}
            </div>

            <span className="flex-1 text-sm font-medium text-gray-700 dark:text-slate-300 truncate">
                {stop.address || `Stop ${index + 1}`}
            </span>

            <button
                onClick={() => onRemove(stop.id)}
                className="
          p-1.5 rounded-lg
          hover:bg-red-100 dark:hover:bg-red-900/30
          text-gray-400 hover:text-red-500
          dark:text-slate-500 dark:hover:text-red-400
          opacity-0 group-hover:opacity-100
          transition-all duration-200
        "
                aria-label="Remove stop"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}
