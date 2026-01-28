import { useEffect, useMemo, useState } from 'react'
import { Loader2, Sparkles, Wand2, X } from 'lucide-react'
import { ROUTE_TEMPLATES } from '../data/routeTemplates'
import { useRouteGenerator } from '../hooks/useRouteGenerator'

export default function RouteGenerator({ selectedArea, userLocation, onPreviewRoute, onUseRoute }) {
    const [prompt, setPrompt] = useState('')
    const { generate, result, isLoading, error, reset } = useRouteGenerator()

    const location = selectedArea || userLocation

    const placeholder = useMemo(() => {
        if (selectedArea?.name) return `e.g., “5km scenic walk near ${selectedArea.name}”…`
        return 'e.g., “5km scenic walk with coffee stops”…'
    }, [selectedArea?.name])

    useEffect(() => {
        if (!result?.loadRouteData) return
        onPreviewRoute?.(result.loadRouteData)
    }, [onPreviewRoute, result?.loadRouteData])

    const handleGenerate = async () => {
        if (!location || isLoading) return
        onPreviewRoute?.(null)
        await generate(prompt, { area: selectedArea, userLocation })
    }

    const handleUse = () => {
        if (!result?.loadRouteData) return
        onUseRoute?.(result.loadRouteData)
        onPreviewRoute?.(null)
        reset()
        setPrompt('')
    }

    const handleClear = () => {
        onPreviewRoute?.(null)
        reset()
    }

    const points = result?.route
        ? [
            { label: 'Start', name: result.route.start.name },
            ...result.route.stops.map((s, i) => ({ label: `Stop ${i + 1}`, name: s.name })),
            { label: 'End', name: result.route.end.name },
        ]
        : []

    return (
        <div className="rounded-3xl bg-card/50 backdrop-blur-xl border border-border/50 p-4 space-y-4">
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-primary/12 text-primary flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-semibold tracking-tight">AI Route Generator</div>
                    <div className="text-xs text-muted-foreground truncate">
                        Describe a walk and get a ready-to-use route
                    </div>
                </div>
                {result?.route && (
                    <button
                        onClick={handleClear}
                        className="ml-auto h-9 w-9 rounded-full bg-secondary/60 hover:bg-secondary border border-border/50 text-muted-foreground hover:text-foreground transition-colors focus-ring inline-flex items-center justify-center"
                        aria-label="Clear generated route"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {!location && (
                <div className="rounded-2xl bg-secondary/60 border border-border/50 p-4 text-sm text-muted-foreground">
                    Select an area in onboarding (or allow location access) to generate routes nearby.
                </div>
            )}

            <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                    {ROUTE_TEMPLATES.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setPrompt(t.prompt)}
                            className="px-3 py-1.5 rounded-full bg-secondary/60 hover:bg-secondary border border-border/50 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors focus-ring"
                        >
                            {t.label}
                        </button>
                    ))}
                    <button
                        onClick={() => setPrompt('Plan a 5km scenic walk with a coffee stop')}
                        className="px-3 py-1.5 rounded-full bg-secondary/60 hover:bg-secondary border border-border/50 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors focus-ring"
                    >
                        5km scenic walk
                    </button>
                    <button
                        onClick={() => setPrompt('Create a park hopping route that visits 3-4 parks and scenic viewpoints')}
                        className="px-3 py-1.5 rounded-full bg-secondary/60 hover:bg-secondary border border-border/50 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors focus-ring"
                    >
                        Park hopping route
                    </button>
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={placeholder}
                        className="flex-1 h-11 px-4 rounded-2xl bg-secondary/60 border border-border/50 focus-ring text-sm font-medium"
                        disabled={isLoading}
                        onKeyDown={(e) => {
                            if (e.key !== 'Enter') return
                            if (!prompt.trim() || isLoading || !location) return
                            handleGenerate()
                        }}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={!location || isLoading || !prompt.trim()}
                        className="h-11 px-4 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring inline-flex items-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        Generate
                    </button>
                </div>

                {error && (
                    <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                        {error}
                    </div>
                )}
            </div>

            {result?.route && (
                <div className="space-y-3 animate-fade-in">
                    <div className="rounded-2xl bg-secondary/60 border border-border/50 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold">Route Preview</div>
                            {result.route.totalDistance ? (
                                <div className="text-xs font-semibold text-muted-foreground">
                                    Target: {result.route.totalDistance}
                                </div>
                            ) : null}
                        </div>

                        {result.route.description ? (
                            <div className="text-sm text-muted-foreground">
                                {result.route.description}
                            </div>
                        ) : null}

                        <div className="space-y-2">
                            {points.map((p) => (
                                <div key={`${p.label}-${p.name}`} className="flex items-center justify-between gap-3">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        {p.label}
                                    </div>
                                    <div className="text-sm font-medium text-right truncate">
                                        {p.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleUse}
                            className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold transition-colors focus-ring inline-flex items-center justify-center gap-2"
                        >
                            Use This Route
                        </button>
                        <button
                            onClick={handleClear}
                            className="h-11 px-4 rounded-2xl bg-secondary/60 hover:bg-secondary border border-border/50 text-sm font-semibold transition-colors focus-ring inline-flex items-center justify-center gap-2"
                        >
                            Clear
                        </button>
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                        Preview appears on the map as a dashed route until you apply it.
                    </div>
                </div>
            )}
        </div>
    )
}
