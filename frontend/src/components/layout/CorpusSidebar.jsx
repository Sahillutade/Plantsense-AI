import { useCallback, useEffect, useRef, useState } from "react";
import { fetchDocuments, ingestFile } from "../../api/api";

const TYPE_META = {
    SOP:      { icon: 'bi-journal-text',      color: 'text-cyan-400'   },
  INCIDENT:   { icon: 'bi-exclamation-octagon',color: 'text-red-400'   },
  INSPECTION: { icon: 'bi-clipboard-check',   color: 'text-green-400'  },
  COMPLIANCE: { icon: 'bi-patch-check',       color: 'text-purple-400' },
  OEM_MANUAL: { icon: 'bi-book',              color: 'text-blue-400'   },
  WORK_ORDER: { icon: 'bi-tools',             color: 'text-amber-400'  },
  UNKNOWN:    { icon: 'bi-file-earmark',      color: 'text-slate-500'  }
};

const FILTER_TABS = ['ALL', 'SOP', 'INCIDENT', 'INSPECTION', 'COMPLIANCE']

export default function CorpusSidebar({ onDocumentAdded }) {

    const [documents, setDocuments] = useState([])
    const [fetching, setFetching] = useState(true)
    const [filter, setFilter] = useState('ALL')
    const [uploading, setUploading] = useState(false)
    const [uploadMsg, setUploadMsg] = useState(null)
    const [dragOver, setDragOver] = useState(false)
    const fileInputRef = useRef()

    const loadDocuments = useCallback(() => {
        setFetching(true)
        fetchDocuments()
        .then((res) => setDocuments(res.data))
        .catch(() => setDocuments([]))
        .finally(() => setFetching(false))
    }, [])

    useEffect(() => { loadDocuments() }, [loadDocuments])

    const handleUpload = async (file) => {
        if(!file || uploading) return
        setUploading(true)
        setUploadMsg(null)

        try {
            const res = await ingestFile(file)
            setUploadMsg({ text: `Ingested: ${res.data.filename}`, ok: true })
            loadDocuments()
            onDocumentAdded?.()
        }
        catch (err) {
            const msg = err.response?.data?.error || 'Upload failed'
            setUploadMsg({ text: msg, ok: false })
        }
        finally {
            setUploading(false)
            // Clear message after 4 seconds
            setTimeout(() => setUploadMsg(null), 4000)
            // Reset file input so same file can be re-uploaded
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const onDrop = (e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleUpload(file)
    }

    const filtered = filter === 'ALL'
    ? documents
    : documents.filter((d) => d.docType === filter)

    const countFor = (type) => 
        type === 'ALL'
            ? documents.length
            : documents.filter((d) => d.docType === type).length

    return(
        <aside className="flex flex-col h-full w-full bg-slate-900 border-r border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="shrink-0 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                    Corpus
                </h2>
                <span className="text-[10px] text-slate-600">
                    {fetching ? '...' : `${documents.length} docs`}
                </span>
            </div>

            {/* Filter tabs */}
            <div className="shrink-0 flex overflow-x-auto gap-1 px-2 py-1.5 border-b border-slate-800 scrollbar-none">
                {FILTER_TABS.map((tab) => (
                    <button key={tab} onClick={() => setFilter(tab)} className={`shrink-0 flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md transition-colors ${filter === tab ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'}`}>
                        {tab === 'ALL' ? 'ALL' : tab.replace('_', ' ')}
                        <span className={`text-[9px] rounded px-1 ${filter === tab ? 'text-cyan-500' : 'text-slate-700'}`}>
                            {countFor(tab)}
                        </span>
                    </button>
                ))}
            </div>

            {/* Document List */}
            <div className="flex-1 overflow-y-auto py-1.5">
                {fetching ? (
                    <div className="flex flex-col gap-1.5 px-3 py-2">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-8 bg-slate-800/60 rounded-md animate-pulse" />
                        ))}
                    </div>
                ) : documents.length === 0 ? (
                    <p className="text-slate-600 text-xs px-4 py-4 text-center">
                        No documents ingested yet.
                    </p>
                ) : (
                    <ul>
                        {filtered.map((doc) => {
                            const meta = TYPE_META[doc.docType] ?? TYPE_META.UNKNOWN
                            return (
                                <li key={doc.id} title={doc.filename} className="flex items-start gap-2.5 px-3 py-2 hover:bg-slate-800/70 rounded-md mx-1.5 cursor-default transition-colors group">
                                    <i className={`bi ${meta.icon} ${meta.color} text=sm shrink-0 mt-px`} aria-hidden="true" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-slate-300 text-xs truncate laeding-snug group-hover:text-slate-100 transition-colors">
                                            {doc.filename}
                                        </p>
                                        <span className="text-[9px] text-slate-600 uppercase tracking-wider">
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
                
                {/* Upload feedback */}
                {uploadMsg && (
                    <p className={`text-[10px] mb-1.5 text-center px-1 leading-snug ${uploadMsg.ok ? 'text-green-400' : 'text-red-400'}`}>
                        {uploadMsg.ok
                            ? <><i className="bi bi-check-circle me-1" /> {uploadMsg.text} </>
                            : <><i className="bi bi-x-circle me-1" /> {uploadMsg.text} </>
                        }
                    </p>
                )}

                <div 
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-3 py-4 transition-colors duration-150 ${uploading ? 'border-cyan-500/40 bg-cyan-500/5 cursor-wait' : dragOver ? 'border-cyan-400 bg-cyan-400/10 cursor-copy' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 cursor-pointer'}`}>
                    {uploading ? (
                        <>
                            <i className="bi bi-arrow-repeat text-cyan-400 text-lg animate-spin" aria-hidden="true" />
                            <p className="text-slate-400 text-xs">Processing...</p>
                        </>
                    ) : (
                        <>
                            <i className={`bi bi-cloud-upload text-lg transition-colors ${dragOver ? 'text-cyan-400' : 'text-slate-600'}`} aria-hidden="true" />
                            <p className="text-slate-500 text-xs text-center leading-snug">
                                Drop file or{' '}
                                <span className="text-cyan-500">browse</span>
                            </p>
                            <p className="text-slate-700 text-[10px]">.txt · .pdf · .csv</p>
                        </>
                    )}
                </div>

                <input ref={fileInputRef} type="file" accept=".txt,.pdf,.csv" className="hidden" onChange={(e) => handleUpload(e.target.files[0])} />

            </div>
        </aside>
    )

}