import { useEffect, useRef, useState } from "react"
import { fetchEquipmentDocs } from "../../api/api"


const EQUIPMENT_NODES = [
    { tag: 'P-204',  type: 'Centrifugal Pump',            criticality: 'High'   },
    { tag: 'P-101',  type: 'Centrifugal Pump',            criticality: 'Medium' },
    { tag: 'C-301',  type: 'Reciprocating Compressor',    criticality: 'High'   },
    { tag: 'V-12',   type: 'Pressure Vessel',             criticality: 'High'   },
    { tag: 'V-22',   type: 'Pressure Relief Valve',       criticality: 'High'   },
    { tag: 'HX-205', type: 'Heat Exchanger',              criticality: 'Medium' },
    { tag: 'T-410',  type: 'Storage Tank',                criticality: 'Low'    },
    { tag: 'M-115',  type: 'Induction Motor',             criticality: 'Medium' }
]

const DOC_TYPE_COLOR = {
    SOP:        '#22d3ee',
    INCIDENT:   '#f87171',
    INSPECTION: '#4ade80',
    COMPLIANCE: '#c084fc',
    OEM_MANUAL: '#60a5fa',
    WORK_ORDER: '#fbbf24',
    UNKNOWN:    '#475569'
}

const CRITICALITY_COLOR = {
    High:   '#f87171',
    Medium: '#fbbf24',
    Low:    '#4ade80'
}

const W = 800
const H = 600
const CX = W / 2
const CY = H / 2

const EQ_RADIUS = 150
const DOC_RADIUS = 260
const EQ_NODE_R = 22
const DOC_NODE_R = 9

export default function KnowledgeGraph({ onClose }) {

    const [docMap, setDocMap] = useState({})
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState(null)
    const [hovered, setHovered] = useState(null)
    const svgRef = useRef()

    // Fetch related docs for each equipment tag
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const results = await Promise.all(
                    EQUIPMENT_NODES.map(async (eq) => {
                        try {
                            const res = await fetchEquipmentDocs(eq.tag)
                            return [eq.tag, res.data]
                        }
                        catch {
                            return [eq.tag, []]
                        }
                    })
                )
                setDocMap(Object.fromEntries(results))
            }
            catch {
                setDocMap({})
            }
            finally {
                setLoading(false)
            }
        }

        fetchAll()
    }, [])

    // Compute node positions
    const eqPositions = EQUIPMENT_NODES.map((eq, i) => {
        const angle = (2 * Math.PI * i) / EQUIPMENT_NODES.length - Math.PI / 2
        return {
            ...eq,
            x: CX + EQ_RADIUS + Math.cos(angle),
            y: CY + EQ_RADIUS + Math.sin(angle),
            angle,
        }
    })

    //Build flat list of document nodes, de-duplicated per equipment ring
    const docNodes = []
    eqPositions.forEach((eq) => {
        const docs = docMap[eq.tag] || []
        docs.forEach((doc, j) => {
            const spread = Math.min(0.6, 0.2 * docs.length)
            const offset = docs.length > 1 ? (j / (docs.length - 1) - 0.5) * spread : 0
            const angle = eq.angle + offset
            docNodes.push({
                id: `${eq.tag}-${j}`,
                filename: doc.filename,
                docType: doc.docType,
                eqTag: eq.tag,
                x: CX + DOC_RADIUS * Math.cos(angle),
                y: CY + DOC_RADIUS * Math.sin(angle),
            })
        })
    })

    const active = selected ?? hovered

    const handleBgClick = () => {
        setSelected(null)
        setHovered(null)
    }

    // Legend data
    const legendItems = Object.entries(DOC_TYPE_COLOR).filter(([type]) => 
        docNodes.some((d) => d.docType === type)
    )

    return (
        <div onClick={handleBgClick} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-center px-5 py-3.5 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <i className="bi bi-diagram-3 text-cyan-400 text-base" aria-hidden="true" />
                        <h2 className="text-white font-semibold text-sm">
                            Knowledge Graph
                        </h2>
                        <span className="text-slate-600 text-xs">
                            — equipment × document relationships                            
                        </span>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors" aria-label="Close knowledge graph">
                        <i className="bi bi-x-lg text-sm" aria-hidden="true" />
                    </button>
                </div>

                {/* Graph */}
                <div className="relative">
                    {loading ? (
                        <div className="flex items-center justify-center h-[500px]">
                            <div className="flex flex-col items-center gap-3">
                                <i className="bi bi-arrow-repeat text-cyan-400 text-3xl animate-spin" aria-hidden="true" />
                                <p className="text-slate-500 text-sm">
                                    Building knowledge graph...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: '500px' }} aria-label="Knowledge graph diagram">
                            {/* Glow filter */}
                            <defs>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                                <filter id="glow-strong">
                                    <feGaussianBlur stdDeviation="5" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Background rings */}
                            <circle cx={CX} cy={CY} r={EQ_RADIUS} fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 6" opacity="0.5" />
                            <circle cx={CX} cy={CY} r={DOC_RADIUS} fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 6" opacity="0.3" />

                            {/* Edges (equipment -> documents) */}
                            {docNodes.map((doc) => {
                                const eq = eqPositions.find((e) => e.tag === doc.eqTag)
                                if (!eq) return null
                                const isActive = active === doc.eqTag
                                const dimmed = active && !isActive
                                return (
                                    <line key={`edge-${doc.id}`} x1={eq.x} y1={eq.y} x2={doc.x} y2={doc.y} stroke={isActive ? DOC_TYPE_COLOR[doc.docType] || '#475569' : '#1e293b'} strokeWidth={isActive ? 1.5 : 1} opacity={dimmed ? 0.05 : isActive ? 0.7 : 0.3} style={{ transition: 'opacity 200ms, stroke 200ms' }} />
                                )
                            })}

                            {/* Document nodes */}
                            {docNodes.map((doc) => {
                                const isActive = active === doc.eqTag
                                const dimmed = active && !isActive
                                const color = DOC_TYPE_COLOR[doc.docType] || '#475569'
                                
                                //Compute label position (push outward from centre)
                                const dx = doc.x - CX
                                const dy = doc.y - CY
                                const dist = Math.sqrt(dx * dx + dy * dy)
                                const lx = doc.x + (dx / dist) * 16
                                const ly = doc.y + (dy / dist) * 16
                                const anchor = dx > 0 ? 'start' : 'end'

                                return (
                                    <g key={doc.id} opacity={dimmed ? 0.1 : 1} style={{ transition: 'opacity 200ms' }}>
                                        <circle cx={doc.x} cy={doc.y} r={DOC_NODE_R} fill={color} fillOpacity={isActive ? 0.9 : 0.4} stroke={color} strokeWidth={isActive ? 1.5 : 0.5} filter={isActive ? 'url(#glow)' : undefined} style={{ transition: 'fill-opacity 200ms' }} />
                                        {isActive && (
                                            <text x={lx} y={ly} fill="#cbd5e1" fontSize="9" textAnchor={anchor} dominantBaseline="middle" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                                                {doc.filename.replace(/\.(txt|pdf|csv)$/i, '')}
                                            </text>
                                        )}
                                    </g>
                                )
                            })}

                            {/* Equipment nodes (rendered last - on top) */}
                            {eqPositions.map((eq) => {
                                const isActive = active === eq.tag
                                const dimmed = active && !isActive
                                const critColor = CRITICALITY_COLOR[eq.criticality] || '#475569'
                                const docCount = (docMap[eq.tag] || []).length

                                return (
                                    <g key={eq.tag} style={{ cursor: 'pointer' }} onClick={(e) => {
                                        e.stopPropagation()
                                        setSelected((p) => p === eq.tag ? null : eq.tag)
                                        setHovered(null)
                                    }} onMouseEnter={() => !selected && setHovered(eq.tag)} onMouseLeave={() => !selected && setHovered(null)} opacity={dimmed ? 0.2 : 1} style={{ transition: 'opacity 200ms' }}>
                                        {/* Outer glow ring */}
                                        <circle cx={eq.x} cy={eq.y} r={EQ_NODE_R + 6} fill={critColor} fillOpacity={isActive ? 0.12 : 0} style={{ transition: 'fill-opacity 200ms' }} />

                                        {/* Main circle */}
                                        <circle cx={eq.x} cy={eq.y} r={EQ_NODE_R} fill="#0f172a" stroke={critColor} strokeWidth={isActive ? 2 : 1.5} filter={isActive ? 'url(#glow-strong)' : undefined} style={{ transition: 'stroke-width 200ms' }} />

                                        {/* Tag label */}
                                        <text x={eq.x} y={eq.y - 2} fill={isActive ? '#fff' : '#e2e8f0'} fontSize="10" fontWeight="600" textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill 200ms' }}>
                                            {eq.tag}
                                        </text>

                                        {/* Doc count badge */}
                                        <text x={eq.x} y={eq.y + 10} fill={isActive ? critColor : '#475569'} fontSize="8" textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill 200ms' }}>
                                            {docCount} doc{docCount !== 1 ? 's' : ''}
                                        </text>
                                    </g>
                                )
                            })}

                            {/* Centre label */}
                            <text x={CX} y={CY - 6} fill="#1e3a5f" fontSize="11" fontWeight="600" textAnchor="middle">
                                PLANTSENSE
                            </text>
                            <text x={CX} y={CY + 8} fill="#1e3a5f" fontSize="8" textAnchor="middle">
                                KNOWLEDGE
                            </text>

                            {/* Hint text */}
                            <text x={CX} y={H - 14} fill="#1e293b" fontSize="9" textAnchor="middle">
                                Click an equipment node to explore its document connections
                            </text>
                        </svg>
                    )}
                </div>

                {/* Footer: legend + stats */}
                <div className="border-t border-slate-800 px-5 py-3 flex items-center justify-between gap-4 flex-wrap">

                    {/* Doc type legend */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {legendItems.map(([type, color]) => (
                            <div key={type} className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                                <span className="text-[10px] text-slate-500">
                                    {type.replace('_', ' ')}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Criticality legend */}
                    <div className="flex items-center gap-3">
                        {Object.entries(CRITICALITY_COLOR).map(([crit, color]) => (
                            <div key={crit} className="flex item-center gap-1.5">
                                <span className="w-2 h-2 rounded-full border shrink-0" style={{ borderColor: color }}></span>
                                <span className="text-[10px] text-slate-500">
                                    {crit}
                                </span>
                            </div>
                        ))}
                        <span className="text-[10px] text-slate-700">criticality</span>
                    </div>

                </div>

            </div>
        </div>
    )

}