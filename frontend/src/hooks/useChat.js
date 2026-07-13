import { useCallback, useEffect, useState } from "react"
import { postChat, fetchHistory } from "../api/api"



// Simulated network delay (ms) - makes the stub feel realistic
const STUB_DELAY_MS = 1800

export function useChat(sessionId) {

    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [historyLoaded, setHistoryLoaded] = useState(false)
    const [error, setError] = useState(null)

    // Restore conversation history on mount
    useEffect(() => {
        if(!sessionId || historyLoaded) return

        fetchHistory(sessionId)
        .then((res) => {
            const restored = res.data.map((m) => ({
                role: m.role,
                content: m.content,
                confidence: m.confidence ?? null,
                // Sources comes back as a parsed array from history endpoint
                sources: Array.isArray(m.sources) ? m.sources : [],
            }))
            setMessages(restored)
        })
        .catch(() => {
            // History fetch failure is non-fatal — start with empty thread
            setMessages([])
        })
        .finally(() => setHistoryLoaded(true))
    }, [sessionId, historyLoaded])

    const sendMessage = useCallback(async (question, sessionId) => {
        if(!question.trim() || loading) return null

        setError(null)

        // Append user message immediately for snappy UX
        setMessages((prev) => [...prev, { role: 'user', content: question }])
        setLoading(true)

        try {
            // Real API call — replaces Phase 2 stub
            const res = await postChat(question, sessionId)
            const data = res.data

            const assistantMsg = {
                role: 'assistant',
                content: data.answer,
                confidence: data.confidence,
                sources: data.sources || []
            }

            setMessages((prev) => [...prev, assistantMsg])
            return assistantMsg
        }
        catch (err) {
            const msg = err.response?.data?.error || err.message || 'Something went wrong. Please try again.'

            const errMsg = {
                role:       'assistant',
                content:    msg,
                confidence: null,
                sources:    [],
            }
            setMessages((prev) => [...prev, errMsg])
            setError(err.message)
            return null
        }
        finally {
            setLoading(false)
        }
    }, [loading, sessionId])

    const clearMessages = useCallback(() => {
        setMessages([])
        setError(null)
        setHistoryLoaded(false)
    }, [])

    return { messages, loading, error, historyLoaded, sendMessage, clearMessages }

}