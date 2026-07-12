import { useEffect, useState } from "react"
import { fetchStats } from "../../api/api"


export default function TopStrip({ mobilePanel, setMobilePanel, onClearSession, refreshKey }) {

    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        fetchStats()
        .then((res) => setStats(res.data))
        .catch(() => setStats(null))
        .finally(() => setLoading(false))
    }, [refreshKey])

    return(
        <header className="shrink-0 w-full bg-slate-900 border-b border-slate-800 px-4 h-12 flex items-center justify-between gap-4 z-10">

            {/* Left - Brand */}
            <div className="flex items-center gap-2.5 shrink-0">
                <button onClick={() => setMobilePanel((p) => (p === 'sidebar' ? 'chat' : 'sidebar'))}
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors" aria-label="Toggle sidebar">
                    <i className="bi bi-layout-sidebar text-base"></i>
                </button>

                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
                        <i className="bi bi-shield-check text-cyan-400 text-sm"></i>
                    </div>
                    <div className="leading-none">
                        <span className="text-white font-semibold text-sm tracking-wide">
                            Plantsense
                        </span>
                        <span className="text-cyan-400 font-semibold text-sm"> AI</span>
                    </div>
                    <span className="hidden lg:inline text-slate-600 text-xs">
                        · Industrial Knowledge Intelligence
                    </span>
                </div>
            </div>

            {/* Right - Stats + clear session */}
            <div className="flex items-center gap-4">

                {/* Stats */}
                <div className="flex items-center gap-3 sm:gap-5 text-xs">
                    {loading ? (
                        <span className="text-slate-700 text-xs animate-pulse">
                            Loading...
                        </span>
                    ) : stats ? (
                        <>
                            <StatPill icon="bi-file-earmark-text" value={stats.documentsIndexed} label="indexed" color="text-slate-400" />
                            <StatPill icon="bi-cpu" value={stats.assetsTracked} label="assets" color="text-slate-400" />
                            {stats.openFlags > 0 && (
                                <StatPill icon="bi-exclamation-triangle-fill" value={stats.openFlags} label="flags" color="text-amber-400" />
                            )}
                        </>
                    ) : null}
                </div>

                {/* Clear session button */}
                <button onClick={onClearSession} title="Start a new conversation" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-colors shrink-0">
                    <i className="bi bi-arrow-counterclockwise text-sm" aria-hidden="true" />
                </button>

            </div>

        </header>
    )

}

function StatPill({ icon, value, label, color }) {
    return(
        <div className={`flex items-center gap-1.5 ${color}`}>
            <i className={`bi ${icon} text-xs`}></i>
            <span className="font-semibold text-white">{value}</span>
            <span className="hidden sm:inline text-slate-500">{label}</span>
        </div>
    )
}