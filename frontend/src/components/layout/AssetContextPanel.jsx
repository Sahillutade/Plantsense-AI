const MOCK_EUIPMENT = {
    equipmentTag:    'P-204',
    totalWorkOrders: 5,
    correctiveCount: 2,
    nextInspection:  '2026-09-15',
    lastFailure: {
        workOrderId:   'WO-3381',
        date:          '2026-03-09',
        description:   'Pump failure - high vibration followed by seal rupture',
        rootCause:     'Mechanical seal degradation; vibration threshold exceeded 5 days prior without flagged inspection.',
        downtimeHours: 14,
    },
}

const MOCK_DOCS = [
    { documentId: 1, filename: 'SOP_Pump_P204.txt',              docType: 'SOP'        },
    { documentId: 5, filename: 'Inspection_Report_Q1_2026.txt',  docType: 'INSPECTION' },
    { documentId: 6, filename: 'Incident_Report_INC_2025_114.txt',docType: 'INCIDENT'  },
    { documentId: 10,filename: 'OEM_Manual_KBL_CP450_Excerpt.txt',docType: 'OEM_MANUAL'},
]

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

    const equipment = MOCK_EUIPMENT
    const docs = MOCK_DOCS

    return (
        <aside className="flex flex-col h-full w-full bg-slate-900 border-l border-slate-800 overflow-hodden">

            {/* Header */}
            <div className="shrink-0 px-4 py-2.5 border-b border-slate-800 flex items-center gap-2">
                <i className="bi bi-cpu text-cyan-400 text-sm" />
                <h2 className="text-xs font-semibold text-white uppercase tracking-widest">
                    {equipment.equipmentTag}
                </h2>
                <span className="ml-auto text-[10px] text-slate-600 uppercase tracking-wider">
                    Asset Context
                </span>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2.5">
                    <StatCard icon="bi-wrench" label="Work Orders" value={equipment.correctiveCount} warn></StatCard>
                    <StatCard icon="bi-exclamation-octagon" label="Corrective" value={equipment.correctiveCount} warn></StatCard>
                </div>
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
                <div className="rounded-xl border border-red-900/40 bg-red-950/30 px-3 py-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                        <i className="bi bi-lightning-fill text-red-400 text-xs" />
                        <p className="text-red-400 text-[10px] font-semibold uppercase tracking-wider">
                            Last Failure
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div>
                            <p className="text-slate-600 text-[10px]">Date</p>
                            <p className="text-slate-300"> {equipment.lastFailure.date} </p>
                        </div>
                        <div>
                            <p className="text-slate-600 text-[10px]">Work Order</p>
                            <p className="text-slate-300"> {equipment.lastFailure.workOrderId} </p>
                        </div>
                        <div>
                            <p className="text-slate-600 text-[10px]">Downtime</p>
                            <p className="text-slate-300"> {equipment.lastFailure.downtimeHours} hours </p>
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
                    <ul className="space-y-1.5">
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

        </aside>
    )

}

function StatCard({ icon, label, value, warn = false }) {
    return (
        <div className={`rounded-xl px-3 py-3 border ${warn ? 'bg-amber-950/30 border-amber-900/30' : 'bg-slate-800/60 border-slate-700/50'}`}>
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