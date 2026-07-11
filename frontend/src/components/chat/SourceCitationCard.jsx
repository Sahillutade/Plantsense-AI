import { useState } from "react"


const TYPE_META = {
    SOP:        { icon: 'bi-journal-text',        color: 'text-cyan-400'   },
    INCIDENT:   { icon: 'bi-exclamation-octagon', color: 'text-red-400'   },
    INSPECTION: { icon: 'bi-clipboard-check',     color: 'text-green-400' },
    COMPLIANCE: { icon: 'bi-patch-check',         color: 'text-purple-400'},
    OEM_MANUAL: { icon: 'bi-book',                color: 'text-blue-400'  },
    WORK_ORDER: { icon: 'bi-tools',               color: 'text-amber-400' },
    UNKNOWN:    { icon: 'bi-file-earmark',        color: 'text-slate-500' }
}

export default function SourceCitationCard({ source }) {

    const [expanded, setExpanded] = useState(false)
    const meta = TYPE_META[source.docType] ?? TYPE_META.UNKNOWN
    const pct = Math.round(source.score * 100)

    return (
        <div className="border border-slate-800 rounded-xl bg-slate-900/80 overflow-hidden">

            {/* Header - always visible */}
            <button onClick={() => setExpanded((p) => !p)} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-800/6 transition-colors text-left" aria-expanded={expanded}>
                {/* Doc type icon */}
                <i className={`bi ${meta.icon} ${meta.color} text-sm shrink-0`} aria-hidden="true" />

                {/* Filename + type */}
                <div className="flex-1 min-w-0">
                    <p className="text-slate-300 text-xs font-medium truncate">
                        {source.filename}
                    </p>
                    <p className="text-slate-600 text-[10px]">
                        {source.docType.replace('_', ' ')} · chunk {source.chunkIndex}
                    </p>
                </div>

                {/* Relevance score bar */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-10 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 rounded-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                        <span className="text-slate-600 text-[10px] w-5 text-right tabular-nums">
                            {pct}%
                        </span>
                    </div>

                    {/* Expand chevron */}
                    <i className={`bi ${expanded ? 'bi-chevron-up' : 'bi-chevron-down'} text-slate-700 text-xs shrink-0 transition-transform duration-150`} aria-hidden="true" />
                </div>
            </button>

            {/* Excerpt - shown when expanded */}
            {expanded && (
                <div className="px-3 pb-3 pt-1.5 border-t border-slate-800/60">
                    <p className="text-slate-400 text-xs leading-relaxed">
                        {source.excerpt}
                    </p>
                </div>
            )}

        </div>
    )

}