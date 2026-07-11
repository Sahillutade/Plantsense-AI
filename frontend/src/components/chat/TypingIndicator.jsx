

export default function TypingIndicator() {

    return (
        <div className="flex justify-start">
            <div className="flex items-center gap-2.5">

                {/* Avatar */}
                <div className="shrink-0 w-7 h-7 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
                    <i className="bi bi-shield-check text-cyan-400 text-xs" aria-hidden="true" />
                </div>

                {/* Bubble */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                    <span className="text-slate-500 text-xs">Plantsense AI is thinking</span>
                    <span className="flex items-center gap-0.5" aria-hidden="true">
                        {[0, 1, 2].map((i) => (
                            <span key={i} className="bounce-dot w-1 h-1 rounded-full bg-cyan-500" style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                    </span>
                </div>

            </div>
        </div>
    )

}