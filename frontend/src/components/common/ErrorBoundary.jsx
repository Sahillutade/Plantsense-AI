import { Component } from "react";


export default class ErrorBoundary extends Component {

    constructor(props) {
        super(props)
        this.state = { hasError: false, message: '' }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, message: error?.message || 'Unknown error' }
    }

    componentDidCatch(error, info) {
        console.error('[Plantsense ErrorBoundary]', error, info)
    }

    reset = () => this.setState({ hasError: false, message: '' })

    render() {
        if(!this.state.hasError) return this.props.children

        return(
            <div className="h-screen w-screen bg-slate-950 flex items-center justify-center px-6">
                <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
                    <div className="w-12 h-12 roundd-full bg-red-400/10 border border-red-400/20 flex items-center justify-center mx-auto mb-4">
                        <i className="bi bi-exclamation-triangle text-red-400 text-xl" aria-hidden="true" />
                    </div>
                    <h2 className="text-white font-semibold text-base mb-1">
                        Something went wrong
                    </h2>
                    <p className="text-slate-500 text-xs mb-4 leading-relaxed">
                        {this.state.message}
                    </p>
                    <button onClick={this.reset} className="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium transition-colors">
                        Try again
                    </button>
                </div>
            </div>
        )
    }

}