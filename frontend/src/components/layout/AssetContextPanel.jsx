import { useEffect, useState } from "react"
import { fetchEquipment, fetchEquipmentDocs } from '../../api/api'

const TYPE_META = {
    SOP:        { icon: 'bi-journal-text',       color: 'text-cyan-400'   },
    INCIDENT:   { icon: 'bi-exclamation-octagon', color: 'text-red-400'   },
    INSPECTION: { icon: 'bi-clipboard-check',    color: 'text-green-400'  },
    COMPLIANCE: { icon: 'bi-patch-check',        color: 'text-purple-400' },
    OEM_MANUAL: { icon: 'bi-book',               color: 'text-blue-400'   },
    WORK_ORDER: { icon: 'bi-tools',              color: 'text-amber-400'  },
    UNKNOWN:    { icon: 'bi-file-earmark',       color: 'text-slate-500'  }
}

export default function AssetContextPanel({ activeTag }) {

    const [equipment, setEquipment] = useState(null)
    const [docs, setDocs] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if(!activeTag) {
            setEquipment(null)
            setDocs([])
            return
        }

        setLoading(true)
        Promise.all([fetchEquipment(activeTag), fetchEquipmentDocs(activeTag)])
        .then(([eqRes, docRes]) => {
            setEquipment(eqRes.data)
            setDocs(docRes.data)
        })
        .catch(() => {
            setEquipment(null)
            setDocs([])
        })
        .finally(() => setLoading(false))
    }, [activeTag])

    return (
        <aside className="flex flex-col h-full w-full bg-slate-900 border-l border-slate-800 overflow-hodden">

            {/* Header */}
            <div className="shrink-0 px-4 py-2.5 border-b border-slate-800 flex items-center gap-2">
                <i className="bi bi-cpu text-cyan-400 text-sm" />
                <h2 className="text-xs font-semibold text-white uppercase tracking-widest">
                    {activeTag ?? 'Asset Context'}
                </h2>
            </div>

            {/* Body */}
            {!activeTag ? (
                <Placeholder />
            ) : loading ? (
                <LoadingSkeleton />
            ) : !equipment ? (
                <div className="flex-1 flex items-center justify-center px-4">
                    <p className="text-slate-600 text-xs text-center">
                        No data found for {activeTag}
                    </p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <StatCard icon="bi-wrench" label="Work Orders" value={equipment.totalWorkOrders} />
                        <StatCard icon="bi-exclamation-octagon" label="Corrective" value={equipment.correctiveCount} warn={equipment.correctiveCount > 0} />
                    </div>

                    {/* Next inspection */}
                    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-3">
                        <div className="flex items-center gap-1.5 mb-1">
                            <i className="bi bi-calendar-check text-slate-500 text-xs" />
                            <p className="text-slate-500 text-[10px] uppercase tracking-wider">
                                Next Inspection
                            </p>
                        </div>
                        <p className="text-white text-sm font-semibold">
                            {equipment.nextInspection}
                        </p>
                    </div>

                    {/* Last failure */}
                    {equipment.lastFailure && (
                        <div className="rounded-xl border border-red-900/40 bg-red-950/30 px-3 py-3 flex flex-col gap-2.5">
                            <div className="flex items-center gap-1.5">
                                <i className="bi bi-lightning-fill text-red-400 text-xs" />
                                <p className="text-red-400 text-[10px] font-semibold uppercase tracking-wider">
                                    Last Failure
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                <Field label="Date"       value={equipment.lastFailure.date} />
                                <Field label="Work Order" value={equipment.lastFailure.workOrderId} />
                                <div className="col-span-2">
                                    <p className="text-slate-600 text-[10px]">Downtime</p>
                                    <p className="text-red-300 font-semibold text-sm">
                                        {equipment.lastFailure.downtimeHours}h
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-red-900/30 pt-2">
                                <p className="text-slate-600 text-[10px] mb-1">Root Cause</p>
                                <p className="text-slate-300 text-xs leading-relaxed">
                                    {equipment.lastFailure.rootCause}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Related documents */}
                    {docs.length > 0 && (
                        <div>
                            <p className="text-slate-600 text-[10px] uppercase tracking-wider mb-2">
                                Related Documents
                            </p>
                            <ul className="flex flex-col gap-1.5">
                                {docs.map((doc) => {
                                    const meta = TYPE_META[doc.docType] || TYPE_META.UNKNOWN
                                    return (
                                        <li key={doc.documentId} className="flex items-center gap-2.5 bg-slate-800/50 border border-slate-700/40 rounded-lg px-2.5 py-2 hover:bg-slate-800 transition-colors">
                                            <i className={`bi ${meta.icon} ${meta.color} text-sm shrink-0`} />
                                            <div className="min-w-0">
                                                <p className="text-slate-300 text-xs truncate">
                                                    {doc.filename}
                                                </p>
                                                <p className="text-slate-600 text-[10px]">
                                                    {doc.docType.replace('_', ' ')}
                                                </p>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}

                </div>
            )}

        </aside>
    )

}

function Placeholder() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
            <i className="bi bi-cpu text-slate-800 text-3xl mb-3" aria-hidden="true" />
            <p className="text-slate-700 text-xs leading-relaxed max-w-[160px]">
                Ask about a piece of equipment to see its history here
            </p>
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="flex-1 px-4 py-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2.5">
                <div className="h-16 bg-slate-800/60 rounded-xl animate-pulse" />
                <div className="h-16 bg-slate-800/60 rounded-xl animate-pulse" />
            </div>
            <div className="h-14 bg-slate-800/60 rounded-xl animate-pulse" />
            <div className="h-28 bg-slate-800/60 rounded-xl animate-pulse" />
            <div className="h-20 bg-slate-800/60 rounded-xl animate-pulse" />
        </div>
    )
}

function StatCard({ icon, label, value, warn = false }) {
    return (
        <div className={`rounded-xl px-3 py-3 border ${warn ? 'bg-amber-950/30 border-amber-900/30' : 'bg-slate-800/60 border-slate-700/40'}`}>
            <div className="flex items-center gap-1.5 mb-1">
                <i className={`bi ${icon} text-xs ${warn ? 'text-amber-400' : 'text-slate-500'}`} />
                <p className={`text-[10px] uppercase tracking-wider ${warn ? 'text-amber-500' : 'text-slate-500'}`}>
                    {label}
                </p>
            </div>
            <p className={`text-2xl font-bold ${warn ? 'text-amber-400' : 'text-white'}`}>
                {value}
            </p>
        </div>
    )
}

function Field({ label, value }) {
    return (
        <div>
            <p className="text-slate-600 text-[10px]">{label}</p>
            <p className="text-slate-300 text-xs">{value}</p>
        </div>
    )
}