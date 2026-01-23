import { useMemo, useRef, useState } from 'react'
import { Send, Plus, Loader2 } from 'lucide-react'
import { getChatResponse } from '../services/geminiService'
import { resolvePlaceQuery } from '../services/placesService'

function getMidpoint(a, b) {
    return {
        lat: (a.lat + b.lat) / 2,
        lng: (a.lng + b.lng) / 2,
    }
}

export default function GeminiChat({ selectedArea, userLocation, route, onAddStop }) {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [isSending, setIsSending] = useState(false)
    const bottomRef = useRef(null)

    const baseLocation = useMemo(() => {
        if (route?.startPoint && route?.endPoint) {
            return getMidpoint(route.startPoint, route.endPoint)
        }
        return selectedArea || userLocation
    }, [route?.startPoint, route?.endPoint, selectedArea, userLocation])

    const areaName = selectedArea?.name || ''

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ block: 'end' })
    }

    const handleSend = async () => {
        const text = input.trim()
        if (!text || !baseLocation || isSending) return

        setIsSending(true)
        setInput('')

        setMessages((prev) => [
            ...prev,
            { id: `u-${Date.now()}`, role: 'user', text },
        ])

        try {
            const result = await getChatResponse(text, {
                location: baseLocation,
                areaName,
                route,
            })

            setMessages((prev) => [
                ...prev,
                {
                    id: `a-${Date.now()}`,
                    role: 'assistant',
                    text: result.reply,
                    places: result.places || [],
                },
            ])
        } finally {
            setIsSending(false)
            setTimeout(scrollToBottom, 50)
        }
    }

    const addPlaceToRoute = async (place, preferredType) => {
        if (!baseLocation) return
        const match = await resolvePlaceQuery(place.query, baseLocation)
        if (match?.lat && match?.lng) {
            onAddStop({
                lat: match.lat,
                lng: match.lng,
                address: match.address || place.query,
                name: match.name || place.query,
                type: preferredType || place.type || 'place',
            })
        }
    }

    const examples = [
        'Find a scenic 5K loop near parks',
        'Suggest a coffee stop halfway',
        'Recommend 3 parks to include on my route',
    ]

    return (
        <div className="flex flex-col h-full">
            <div className="text-xs text-muted-foreground mb-3">
                Ask for route ideas or stops. If you already set Start/End, suggestions bias toward the midpoint.
            </div>

            {messages.length === 0 && (
                <div className="mb-4">
                    <div className="text-xs font-semibold text-muted-foreground mb-2">
                        Try:
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {examples.map((ex) => (
                            <button
                                key={ex}
                                onClick={() => setInput(ex)}
                                className="text-xs px-3 py-1.5 rounded-full bg-secondary/60 hover:bg-secondary border border-border/50 text-foreground transition-colors focus-ring"
                            >
                                {ex}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-auto space-y-3 pr-1">
                {messages.map((m) => (
                    <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                        <div
                            className={`
                max-w-[85%] rounded-2xl px-4 py-3 text-sm
                ${m.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary/50 text-foreground border border-border/50'
                                }
              `}
                        >
                            <div className="whitespace-pre-wrap">{m.text}</div>

                            {m.role === 'assistant' && Array.isArray(m.places) && m.places.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    <div className="text-xs font-semibold text-muted-foreground">
                                        Suggested places
                                    </div>
                                    <div className="space-y-2">
                                        {m.places.map((p, idx) => (
                                            <div
                                                key={`${m.id}-p-${idx}`}
                                                className="flex items-center gap-2 rounded-2xl bg-background/30 border border-border/50 px-3 py-2"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-semibold text-foreground truncate">
                                                        {p.query}
                                                    </div>
                                                    {p.type && (
                                                        <div className="text-[11px] text-muted-foreground">
                                                            {p.type}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => addPlaceToRoute(p, p.type)}
                                                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl bg-primary/12 text-primary hover:opacity-85 transition-opacity focus-ring"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    Add
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    {m.places.length > 1 && (
                                        <button
                                            onClick={async () => {
                                                await Promise.allSettled(
                                                    m.places.map((p) => addPlaceToRoute(p, p.type))
                                                )
                                            }}
                                            className="w-full h-10 flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity focus-ring"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add All to Route
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            <div className="mt-4 flex items-center gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={baseLocation ? 'Ask for a route or stop…' : 'Select an area first…'}
                    className="flex-1 h-11 px-4 rounded-2xl bg-secondary/60 border border-border/50 text-sm font-medium text-foreground placeholder:text-muted-foreground focus-ring"
                    disabled={!baseLocation || isSending}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || !baseLocation || isSending}
                    className="h-11 w-11 rounded-2xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center justify-center focus-ring"
                    aria-label="Send"
                >
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
            </div>
        </div>
    )
}
