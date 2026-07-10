import { useRef, useState } from "react";

const TYPE_META = {
    SOP:      { icon: 'bi-journal-text',      color: 'text-cyan-400'   },
  INCIDENT:   { icon: 'bi-exclamation-octagon',color: 'text-red-400'   },
  INSPECTION: { icon: 'bi-clipboard-check',   color: 'text-green-400'  },
  COMPLIANCE: { icon: 'bi-patch-check',       color: 'text-purple-400' },
  OEM_MANUAL: { icon: 'bi-book',              color: 'text-blue-400'   },
  WORK_ORDER: { icon: 'bi-tools',             color: 'text-amber-400'  },
  UNKNOWN:    { icon: 'bi-file-earmark',      color: 'text-slate-500'  }
};

const MOCK_DOCUMENTS = [
    { id: 1,  filename: 'SOP_Pump_P204.txt',                  docType: 'SOP'        },
    { id: 2,  filename: 'SOP_Compressor_C301.txt',            docType: 'SOP'        },
    { id: 3,  filename: 'SOP_Vessel_V12.txt',                 docType: 'SOP'        },
    { id: 4,  filename: 'SOP_Tank_T410.txt',                  docType: 'SOP'        },
    { id: 5,  filename: 'Inspection_Report_Q1_2026.txt',      docType: 'INSPECTION' },
    { id: 6,  filename: 'Incident_Report_INC_2025_114.txt',   docType: 'INCIDENT'   },
    { id: 7,  filename: 'Incident_Report_INC_2025_098.txt',   docType: 'INCIDENT'   },
    { id: 8,  filename: 'Incident_Report_INC_2025_142.txt',   docType: 'INCIDENT'   },
    { id: 9,  filename: 'Compliance_Certificate_V12.txt',     docType: 'COMPLIANCE' },
    { id: 10, filename: 'OEM_Manual_KBL_CP450_Excerpt.txt',   docType: 'OEM_MANUAL' }
];

export default function CorpusSidebar() {

    const [documents] = useState(MOCK_DOCUMENTS);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef();

    const handleFileDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        // wired to real ingestFile() in Phase 3
    }

    return(
        <aside className="flex flex-col h-full w-full bg-slate-900 border-r border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="shrink-0 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                    Corpus
                </h2>
                <span className="text-[10px] text-slate-600">
                    {documents.length} docs
                </span>
            </div>

            {/* Document List */}
            <div className="flex-1 overflow-y-auto py-1.5">
                {documents.length === 0 ? (
                    <p className="text-slate-600 text-xs px-4 py-4 text-center">
                        No documents ingested yet.
                    </p>
                ) : (
                    <ul>
                        {documents.map((doc) => {
                            const meta = TYPE_META[doc.docType] || TYPE_META.UNKNOWN
                            return (
                                <li key={doc.id} title={doc.filename} className="flex items-start gap-2.5 px-3 py-2 hover:bg-slate-800/70 rounded-md mx-1.5 cursor-default transition-colors group">
                                    <i className={`bi ${meta.icon} ${meta.color} text-sm shrink-0 mt-px`} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-slate-300 text-xs truncate leading-snug group-hover:text-slate-100 transition-colors">
                                            {doc.filename}
                                        </p>
                                        <span className="inline-block text-[9px] text-slate-600 mt-0.5 uppercase tracking-wider">
                                            {doc.docType.replace('_', ' ')}
                                        </span>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>

            {/* Upload zone */}
            <div className="shrink-0 px-3 pb-3 pt-2 border-t border-slate-800">
                <div onDragOver={(e) => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={handleFileDrop} onClick={() => fileInputRef.current?.click()} className={`flex flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-3 py-4 cursor-pointer transition-colors duration-150 ${dragOver ? 'border-cyan-400 bg-cyan-400/10' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'}`}>
                    <i className={`bi bi-vloud-upload text-lg transition-colors ${dragOver ? 'text-cyan-400' : 'text-slate-600'}`} />
                    <p className="text-slate-500 text-xs text-center leading-snug">
                        Drop file or <span className="text-cyan-500">browse</span>
                    </p>
                    <p className="text-slate-700 text-[10px]">.txt · .pdf · .csv</p>
                </div>

                <input ref={fileInputRef} type="file" accept=".txt,.pdf,.csv" className="hidden" onChange={() => {/* wired in Phase 3 */}}></input>
            </div>
        </aside>
    )

}