import { useEffect, useRef, useState } from "react";


const MAX_CHARS = 500

export default function QueryInput({ onSend, loading, disabled }) {

    const [value, setValue] = useState('')
    const [focused, setFocused] = useState('')
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
        const trimmed = value.trim()
        if(!trimmed || loading || disabled) return
        onSend(trimmed)
        setValue('')
    }

    const handlePaste = (e) => {
        e.preventDefault()
        const pasted = e.clipboardData
        .getData('text')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        const newVal = (value + pasted).slice(0, MAX_CHARS)
        setValue(newVal)
    }

    // Auto-resize textarea as user types
    const handleInput = () => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    }

    const charCount = value.length
    const nearLimit = charCount > MAX_CHARS * 0.8
    const atLimit = charCount >= MAX_CHARS
    const canSend = value.trim().length > 0 && !loading && !disabled

    return (
        <div className="shrink-0 border-t border-slate-800/60 px-3 sm:px-5 py-3">
            
            {/* Input box */}
            <div className={`flex items-end gap-2 bg-slate-900 border rounded-xl px-3 py-2.5 transition-colors duration-150 ${focused ? 'border-cyan-500/40' : 'border-slate-800'} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <textarea ref={textareaRef} rows={1} value={value} onChange={(e) => setValue(e.target.value.slice(0, MAX_CHARS))} onKeyDown={handleKeyDown} onPaste={handlePaste} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="Ask about equipment, procedures, or incidents..." disabled={disabled || loading} aria-label="Chat input" className="flex-1 bg-transparent text-slate-100 text-sm placeholder-slate-600 resize-none outline-none leading-relaxed disabled:opacity-40 min-h-[20px] max-h-[120px] overflow-y-auto" style={{ fieldSizing: 'content' }} />

                {/* Send button */}
                <button onClick={handleSend} disabled={!canSend} aria-label="Send message" className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-white active:scale-95">
                    {loading
                        ? <i className="bi bi-arrow-repeat text-sm animate-spin" aria-hidden="true" />
                        : <i className="bi bi-arrow-up text-sm" aria-hidden="true" />
                    }
                </button>
            </div>

            {/* Footer row - hint + char counter */}
            <div className="flex items-center justify-between mt-1.5 px-0.5">
                <p className="text-slate-700 text-[10px]">
                    Enter to send · Shift+Enter for new line
                </p>

                {/* Character counter - only shown near limit */}
                {nearLimit && (
                    <p className={`text-[10px] tabular-nums transition-colors ${atLimit ? 'text-red-400' : 'text-slate-600'}`}>
                        {charCount}/{MAX_CHARS}
                    </p>
                )}
            </div>

        </div>
    )

}