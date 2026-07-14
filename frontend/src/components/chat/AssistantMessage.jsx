import SourceCitationCard from "./SourceCitationCard";
import ConfidenceBadge from "./ConfidenceBadge";
import { useState } from "react";

export default function AssistantMessage({ content, confidence, sources, timestamp }) {

    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
        catch {
            // Clipboard API not available (HTTP / old browser) — silent fail
        }
    }

    return (
        <div className="flex justify-start">
            <div className="max-w-[90%] sm:max-w-[82%] flex flex-col gap-2.5">

                {/* Answer bubble */}
                <div className="flex item-start gap-2.5">
                    {/* Avatar */}
                    <div className="shrink-0 w-7 h-7 rounded-full bg-cyan-400/10 border border-cyan-400/25 flex items-center justify-center mt-0.5">
                        <i className="bi bi-shield-check text-cyan-400 text-xs" aria-hidden="true" />
                    </div>

                    {/* Bubble + copy button */}
                    <div className="relative group flex-1">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex flex-col gap-2.5">
                            <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">
                                {content}
                            </p>

                            <ConfidenceBadge confidence={confidence} />
                        </div>

                        {/* Copy button - visible on hover */}
                        <button onClick={handleCopy} title="Copy answer" aria-label="Copy answer to clipboard" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 w-6 h-6 rounded-md flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-500 hover:text-slate-300">
                            <i className={`bi ${copied ? 'bi-check-lg text-green-400' : 'bi-copy'} text-xs`} aria-hidden="true" />
                        </button>
                    </div>
                    
                </div>

                {/* Timestamp */}
                {timestamp && (
                    <p className="ml-9 text-slate-700 text-[10px]">
                        {timestamp}
                    </p>
                )}

                {/* Source citation cards */}
                {sources && sources.length > 0 && (
                    <div className="ml-9 flex flex-col gap-1.5">
                        <p className="text-slate-600 text-[10px] uppercase tracking-wider px-0.5">
                            Sources
                        </p>
                        {sources.map((src, i) => (
                            <SourceCitationCard key={i} source={src} />
                        ))}
                    </div>
                )}

            </div>
        </div>
    )

}