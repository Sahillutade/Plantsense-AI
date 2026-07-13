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

export default function ChatPanel({ sessionId, onEquipmentDetected }) {

    const { messages, loading, historyLoaded, sendMessage } = useChat(sessionId)

    const bottomRef = useRef()

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    const detectTag = (text) => {
        if(!text) return null
        const upper = text.toUpperCase()
        return EQUIPMENT_TAGS.find((t) => upper.includes(t)) ?? null
    }

    const handleSend = async (question) => {
        const tagInQuestion = detectTag(question)
        if(tagInQuestion) onEquipmentDetected?.(tagInQuestion)

        const reply = await sendMessage(question)

        if(!tagInQuestion && reply) {
            const tagInAnswer = detectTag(reply.content)
            if(tagInAnswer) onEquipmentDetected?.(tagInAnswer)
        }
    }

    const isEmpty = messages.length === 0 && !loading
    const showSuggestions = isEmpty && historyLoaded

    return (
        <div className="flex flex-col h-full w-full bg-slate-950 min-w-0">

            {/* Message thread */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-5">
                
                {/* History loading skeleton */}
                {!historyLoaded && (
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-end">
                            <div className="w-48 h-10 bg-slate-800/60 rounded-2xl animate-pulse" />
                        </div>
                        <div className="flex justify-start gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-800/60 animate-pulse shrink-0" />
                            <div className="w-64 h-24 bg-slate-800/60 rounded-2xl animate-pulse" />
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {historyLoaded && isEmpty && <EmptyState />}

                {/* Messages */}
                {historyLoaded && (
                    <div className="flex flex-col gap-5">
                        {messages.map((msg, idx) => 
                            msg.role === 'user'
                            ? <UserMessage key={idx} content={msg.content} />
                            : <AssistantMessage key={idx} content={msg.content} confidence={msg.confidence} sources={msg.sources} />
                        )}
                        {loading && <TypingIndicator />}
                        <div ref={bottomRef} />
                    </div>
                )}

            </div>

            {/* Suggested query pills — only shown when thread is empty ─────── */}
            {showSuggestions && (
                <div className="shrink-0 px-3 sm:px-6 pb-2 flex flex-wrap gap-2">
                    {SUGGESTED_QUERIES.map((q) => (
                        <button
                            key={q}
                            onClick={() => handleSend(q)}
                            className="text-xs text-slate-500 border border-slate-800 rounded-full px-3 py-1.5 hover:border-cyan-500/40 hover:text-cyan-400 transition-colors duration-150"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* Query input */}
                <QueryInput onSend={handleSend} loading={loading} />

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