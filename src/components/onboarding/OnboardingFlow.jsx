import { useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, MapPin, Sparkles, Target } from 'lucide-react'
import AreaSelector from '../AreaSelector'
import { DISTANCE_OPTIONS, TIME_OPTIONS, VIBE_OPTIONS } from '../../hooks/usePreferences'

export default function OnboardingFlow({ onComplete, onSkip, initialPreferences }) {
    const [step, setStep] = useState(1)
    const [area, setArea] = useState(initialPreferences?.area || null)
    const [vibes, setVibes] = useState(initialPreferences?.vibes || [])
    const [activity, setActivity] = useState(initialPreferences?.activity || 'walk')
    const [distance, setDistance] = useState(initialPreferences?.distance || 5000)
    const [customDistance, setCustomDistance] = useState('')
    const [routeShape, setRouteShape] = useState(initialPreferences?.routeShape || 'loop')
    const [timeAvailable, setTimeAvailable] = useState(initialPreferences?.timeAvailable || 30)

    const canProceedStep1 = !!area
    const canComplete = !!area

    const vibeSet = useMemo(() => new Set(vibes), [vibes])

    const toggleVibe = (id) => {
        setVibes((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
    }

    const handleDistanceSelect = (value) => {
        setDistance(value)
        setCustomDistance('')
    }

    const handleCustomDistance = (value) => {
        setCustomDistance(value)
        const parsed = parseFloat(value)
        if (!Number.isNaN(parsed) && parsed > 0) {
            setDistance(Math.round(parsed * 1000))
        }
    }

    const handleFinish = () => {
        onComplete({
            area,
            vibes,
            activity,
            distance,
            routeShape,
            timeAvailable,
            hasCompletedOnboarding: true,
        })
    }

    return (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-10 bg-primary' : s < step ? 'w-10 bg-primary/40' : 'w-10 bg-muted'
                                }`}
                        />
                    ))}
                </div>

                {step === 1 && (
                    <div className="animate-fade-in space-y-7">
                        <div className="text-center space-y-3">
                            <div className="w-16 h-16 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center">
                                <MapPin className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-2xl font-semibold tracking-tight">Where do you want to walk?</h1>
                            <p className="text-muted-foreground">Choose a city, region, or country</p>
                        </div>

                        <div className="glass-card p-4">
                            <AreaSelector
                                onAreaSelect={(a) => setArea(a)}
                                currentArea={area}
                            />
                            {area && (
                                <div className="mt-3 flex items-center gap-2 p-3 rounded-2xl bg-primary/10 text-primary">
                                    <Check className="w-4 h-4" />
                                    <span className="font-medium truncate">{area.name}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                className="flex-1 h-11 rounded-2xl bg-secondary/60 hover:bg-secondary border border-border/50 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
                                onClick={onSkip}
                                disabled={!canProceedStep1}
                            >
                                Skip for now
                            </button>
                            <button
                                className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring flex items-center justify-center"
                                disabled={!canProceedStep1}
                                onClick={() => setStep(2)}
                            >
                                Continue
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-fade-in space-y-7">
                        <div className="text-center space-y-3">
                            <div className="w-16 h-16 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-2xl font-semibold tracking-tight">What vibe are you going for?</h1>
                            <p className="text-muted-foreground">Select all that apply</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {VIBE_OPTIONS.map((vibe) => (
                                <button
                                    key={vibe.id}
                                    onClick={() => toggleVibe(vibe.id)}
                                    className={`p-3 rounded-2xl text-left transition-all duration-200 flex items-center gap-2 focus-ring ${vibeSet.has(vibe.id)
                                            ? 'bg-primary text-primary-foreground shadow-lg'
                                            : 'bg-secondary/60 hover:bg-secondary border border-border/50'
                                        }`}
                                >
                                    <span className="text-lg">{vibe.icon}</span>
                                    <span className="text-sm font-semibold">{vibe.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                className="h-11 px-4 rounded-2xl bg-secondary/60 hover:bg-secondary border border-border/50 text-sm font-semibold transition-colors focus-ring flex items-center"
                                onClick={() => setStep(1)}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Back
                            </button>
                            <button
                                className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold transition-colors focus-ring flex items-center justify-center"
                                onClick={() => setStep(3)}
                            >
                                Continue
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-fade-in space-y-6">
                        <div className="text-center space-y-3">
                            <div className="w-16 h-16 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center">
                                <Target className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-2xl font-semibold tracking-tight">Set your goals</h1>
                            <p className="text-muted-foreground">We’ll tailor suggestions to your preferences</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Activity</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActivity('walk')}
                                    className={`flex-1 py-3 rounded-2xl font-semibold transition-all focus-ring ${activity === 'walk'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-secondary/60 hover:bg-secondary border border-border/50'
                                        }`}
                                >
                                    🚶 Walk
                                </button>
                                <button
                                    onClick={() => setActivity('run')}
                                    className={`flex-1 py-3 rounded-2xl font-semibold transition-all focus-ring ${activity === 'run'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-secondary/60 hover:bg-secondary border border-border/50'
                                        }`}
                                >
                                    🏃 Run
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Distance goal</label>
                            <div className="flex gap-2">
                                {DISTANCE_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleDistanceSelect(opt.value)}
                                        className={`flex-1 py-3 rounded-2xl font-semibold transition-all focus-ring ${distance === opt.value && !customDistance
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-secondary/60 hover:bg-secondary border border-border/50'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    value={customDistance}
                                    onChange={(e) => handleCustomDistance(e.target.value)}
                                    placeholder="Custom (km)"
                                    inputMode="decimal"
                                    className="flex-1 h-11 px-4 rounded-2xl bg-secondary/60 border border-border/50 focus-ring text-sm"
                                />
                                <div className="text-sm text-muted-foreground w-24 text-right">
                                    {(distance / 1000).toFixed(1)} km
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Route shape</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'loop', label: 'Loop' },
                                    { id: 'out-and-back', label: 'Out & back' },
                                    { id: 'point-to-point', label: 'Point-to-point' },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setRouteShape(opt.id)}
                                        className={`py-3 rounded-2xl text-sm font-semibold transition-all focus-ring ${routeShape === opt.id
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-secondary/60 hover:bg-secondary border border-border/50'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">Time available</label>
                            <div className="flex gap-2">
                                {TIME_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setTimeAvailable(opt.value)}
                                        className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all focus-ring ${timeAvailable === opt.value
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-secondary/60 hover:bg-secondary border border-border/50'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-1">
                            <button
                                className="h-11 px-4 rounded-2xl bg-secondary/60 hover:bg-secondary border border-border/50 text-sm font-semibold transition-colors focus-ring flex items-center"
                                onClick={() => setStep(2)}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Back
                            </button>
                            <button
                                className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring flex items-center justify-center"
                                onClick={handleFinish}
                                disabled={!canComplete}
                            >
                                Start planning
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

