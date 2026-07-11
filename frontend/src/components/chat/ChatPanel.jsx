import { useEffect, useRef } from "react"
import { useChat } from '../../hooks/useChat'
import TypingIndicator from "./TypingIndicator";
import QueryInput from "./QueryInput";
import UserMessage from "./UserMessage";
import AssistantMessage from './AssistantMessage';

const EQUIPMENT_TAGS = ['P-204','P-101','C-301','V-12','V-22','HX-205','T-410','M-115']

const SUGGESTED_QUERIES = [
    'Why did pump P-204 fail last March?',
    'What caused C-301 to trip?',
    'Is V-12 due for inspection soon?',
    'What does the SOP say about vibration limits?',
]

export default function ChatPanel() {

    const { messages, loading, sendMessage } = useChat();
    const bottomRef = useRef()
    const inputRef = useRef()

    // Auto-scroll to bottom whenever messages or loading state changes
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'emooth' })
    }, [messages, loading])

    const detectTag = (text) => {
        if (!text) return null
        const upper = text.toUpperCase()
        return EQUIPMENT_TAGS.find((tag) => upper.includes(tag)) ?? null
    }

    const handleSend = async (question) => {
        // Detect tag in question immediately — show asset panel while loading
        const tagInQuestion = detectTag(question)
        if (tagInQuestion) onEquipmentDetected?.(tagInQuestion)

        const reply = await sendMessage(question, sessionId)

        // Also check the answer for tags in case question didn't contain one
        if (!tagInQuestion && reply) {
            const tagInAnswer = detectTag(reply.content)
            if (tagInAnswer) onEquipmentDetected?.(tagInAnswer)
        }
    }

    const handleSuggestion = (query) => {
        // Populate input field with suggested query text
        if (inputRef.current?.querySelector('textarea')) {
            inputRef.current.querySelector('textarea').value = query
            inputRef.current.querySelector('textarea').focus()
        }
    }

    const isEmpty = messages.length === 0 && !loading

    return (
        <div className="flex flex-col h-full w-full bg-slate-950 min-w-0">

            {/* Message thread */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-5">
                {isEmpty
                    ? <EmptyState />
                    : (
                        <div className="flex flex-col gap-5">
                            {messages.map((msg, idx) => 
                                msg.role === 'user'
                                    ? <UserMessage key={idx} content={msg.content} />
                                    : <AssistantMessage key={idx} content={msg.content} confidence={msg.confidence} sources={msg.sources} />
                            )}
                            {loading && <TypingIndicator />}
                            <div ref={bottomRef} />
                        </div>
                    )
                }
            </div>

            {/* Suggested query pills — only shown when thread is empty ─────── */}
            {isEmpty && (
                <div className="shrink-0 px-3 sm:px-6 pb-2 flex flex-wrap gap-2">
                    {SUGGESTED_QUERIES.map((q) => (
                        <button key={q} onClick={() => handleSend(q)} className="text-xs text-slate-500 border border-slate-800 rounded-full px-3 py-1.5 hover:border-cyan-500/40 hover:text-cyan-400 transition-colors duration-150">
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* Query input */}
            <div ref={inputRef}>
                <QueryInput onSend={handleSend} loading={loading} />
            </div>

        </div>
    )

}

function EmptyState() {
    return (
        <div className="h-full flex flex-colitems-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-cyan-400/10 border border-cyan-400/15 flex items-center justify-center mb-4">
                <i className="bi bi-shield-check text-cyan-400 text-2xl" aria-hidden="true" />
            </div>
            <h3 className="text-white font-medium text-base mb-2">
                Ask Plantsense
            </h3>
            <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                Query across SOPs, inspection reports, incident records, and equipment maintenance history
            </p>
        </div>
    )
}