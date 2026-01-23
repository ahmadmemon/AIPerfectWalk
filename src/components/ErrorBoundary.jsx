import { Component } from 'react'

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { error: null }
    }

    static getDerivedStateFromError(error) {
        return { error }
    }

    componentDidCatch(error, info) {
        console.error('App crashed:', error, info)
    }

    render() {
        if (this.state.error) {
            return (
                <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
                    <div className="glass-card w-full max-w-xl p-6">
                        <h1 className="text-lg font-semibold tracking-tight">Something went wrong</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Open DevTools Console to see the error details.
                        </p>
                        <pre className="mt-4 text-xs bg-secondary/60 border border-border/50 rounded-2xl p-4 overflow-auto max-h-[240px]">
                            {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
                        </pre>
                        <div className="mt-4 flex gap-2">
                            <button
                                className="h-10 px-4 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity focus-ring"
                                onClick={() => window.location.reload()}
                            >
                                Reload
                            </button>
                            <button
                                className="h-10 px-4 rounded-2xl bg-secondary/60 hover:bg-secondary border border-border/50 text-sm font-semibold transition-colors focus-ring"
                                onClick={() => this.setState({ error: null })}
                            >
                                Try to continue
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

