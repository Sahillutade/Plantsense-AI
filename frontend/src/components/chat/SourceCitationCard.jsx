import { useEffect, useRef, useState } from "react"


const TYPE_META = {
    SOP:        { icon: 'bi-journal-text',        color: 'text-cyan-400'   },
    INCIDENT:   { icon: 'bi-exclamation-octagon', color: 'text-red-400'   },
    INSPECTION: { icon: 'bi-clipboard-check',     color: 'text-green-400' },
    COMPLIANCE: { icon: 'bi-patch-check',         color: 'text-purple-400'},
    OEM_MANUAL: { icon: 'bi-book',                color: 'text-blue-400'  },
    WORK_ORDER: { icon: 'bi-tools',               color: 'text-amber-400' },
    UNKNOWN:    { icon: 'bi-file-earmark',        color: 'text-slate-500' }
}

function scoreColor(pct) {
    if(pct >= 70) return 'bg-green-400'
    if(pct >= 40) return 'bg-amber-400'
    return 'bg-red-400'
}

export default function SourceCitationCard({ source }) {

    const [expanded, setExpanded] = useState(false)
    const [height, setHeight] = useState(0)
    const excerptRef = useRef(null)

    const meta = TYPE_META[source.docType] ?? TYPE_META.UNKNOWN
    const pct = Math.round(source.score * 100)

    // Measure excerpt height for smooth animation
    useEffect(() => {
        if(excerptRef.current) {
            setHeight(excerptRef.current.scrollHeight)
        }
    }, [source.excerpt])

    return (
        <div className="border border-slate-800 rounded-xl bg-slate-900/80 overflow-hidden">

            {/* Header - always visible */}
            <button onClick={() => setExpanded((p) => !p)} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-800/6 transition-colors text-left" aria-expanded={expanded}>
                {/* Doc type icon */}
                <i className={`bi ${meta.icon} ${meta.color} text-sm shrink-0`} aria-hidden="true" />

                {/* Filename + type */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-slate-300 text-xs font-medium truncate">
                            {source.filename}
                        </p>
                        <span className={`inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 ${meta.badge}`}>
                            {source.docType.replace('_', ' ')}
                        </span>
                    </div>
                    <p className="text-slate-600 text-[10px] mt-0.5">
                        chunk {source.chunkIndex}
                    </p>
                </div>

                {/* Relevance score bar */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-10 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${scoreColor(pct)}`} style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className={`text-[10px] tabular-nums w-5 text-right ${pct >= 70 ? 'text-green-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                        {pct}%
                    </span>
                </div>

                {/* Expand chevron */}
                <i className={`bi ${expanded ? 'bi-chevron-up' : 'bi-chevron-down'} text-slate-700 text-xs shrink-0 transition-transform duration-150`} aria-hidden="true" />
            </button>

            {/* Excerpt - shown when expanded */}
            <div style={{ 
                maxHeight: expanded ? `${height + 32}px` : '0px',
                overflow: 'hidden',
                transition: 'max-height 200ms ease-in-out',
             }}>
                <div ref={excerptRef} className="px-3 pb-3 pt-2 border-t border-slate-800/60">
                    <p className="text-slate-400 text-xs leading-relaxed">
                        {source.excerpt}
                    </p>
                </div>
             </div>

        </div>
    )

}