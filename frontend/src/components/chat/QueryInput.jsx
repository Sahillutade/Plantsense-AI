import { useEffect, useRef } from "react";


export default function QueryInput({ onSend, loading, disabled }) {

    const textareaRef = useRef()

    // Focus input on mount
    useEffect(() => {
        textareaRef.current?.focus()
    }, [])

    const handleKeyDown = (e) => {
        if(e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleSend = () => {
        const value = textareaRef.current?.value.trim()
        if(!value || loading || disabled) return
        onSend(value)
        textareaRef.current.value = ''
        // Reset height after clearing
        textareaRef.current.style.height = 'auto'
    }

    // Auto-resize textarea as user types
    const handleInput = () => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    }

    return (
        <div className="shrink-0 border-t border-slate-800/60 px-3 sm:px-5 py-3">
            <div className="flex items-end gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 focus-within:border-cyan-500/40 transition-colors duration-150">
            
                <textarea ref={textareaRef} rows={1} onKeyDown={handleKeyDown} onInput={handleInput} placeholder="Ask about equipment, procedures, or incidents..." disabled={disabled} className="flex-1 bg-transparent text-slate-100 text-sm placeholder-slate-600 resize-none outline-none leading-relaxed overflow-hidden disabled:opacity-40" style={{ maxHeight: '120px' }} />

                <button onClick={handleSend} disabled={loading || disabled} aria-label="Send message" className="shrink-0 w-8 h-8 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 flex items-center justify-center transition-colors duration-150 text-white">
                    {loading
                        ? <i className="bi bi-arrow-repeat text-sm animate-spin" aria-hidden="true" />
                        : <i className="bi bi-arrow-up text-sm" aria-hidden="true" />
                    }
                </button>

            </div>

            <p className="text-slate-700 text-[10px] mt-1.5 text-center select-none">
                Enter to send · Shift+Enter for new line
            </p>
        </div>
    )

}