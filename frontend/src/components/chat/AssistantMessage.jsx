import SourceCitationCard from "./SourceCitationCard";
import ConfidenceBadge from "./ConfidenceBadge";

export default function AssistantMessage({ content, confidence, sources }) {

    return (
        <div className="flex justify-start">
            <div className="max-w-[90%] sm:max-w-[82%] flex flex-col gap-2.5">

                {/* Answer bubble */}
                <div className="flex item-start gap-2.5">
                    {/* Avatar */}
                    <div className="shrink-0 w-7 h-7 rounded-full bg-cyan-400/10 border border-cyan-400/25 flex items-center justify-center mt-0.5">
                        <i className="bi bi-shield-check text-cyan-400 text-xs" aria-hidden="true" />
                    </div>

                    {/* Bubble */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex flex-col gap-2.5">
                        <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">
                            {content}
                        </p>
                        <ConfidenceBadge confidence={confidence} />
                    </div>
                </div>

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