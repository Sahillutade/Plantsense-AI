import { useCallback, useState } from "react"


const STUB_RESPONSE = {
    answer:
        'P-204 failed on 2026-03-09 due to mechanical seal degradation, preceded ' +
        'by a gradual rise in vibration over 5 days. The reading exceeded 4.5 mm/s ' +
        'RMS but was not escalated for inspection per SOP-PUMP-204-01 Section 3.2. ' +
        'This is the second seal-related failure in the past 12 months (see WO-3275, November 2025).',
    confidence: 'High',
    sources: [
        {
        filename:   'Inspection_Report_Q1_2026.txt',
        docType:    'INSPECTION',
        chunkIndex: 0,
        excerpt:
            'On 2026-03-04, condition monitoring logs showed vibration readings of ' +
            '5.1 mm/s RMS, exceeding the SOP-PUMP-204-01 threshold of 4.5 mm/s RMS. ' +
            'This reading was recorded in the shift log but was not escalated for ' +
            'inspection per procedure...',
        score: 0.89,
        },
        {
        filename:   'SOP_Pump_P204.txt',
        docType:    'SOP',
        chunkIndex: 0,
        excerpt:
            'Any reading exceeding 4.5 mm/s RMS for more than 2 consecutive readings ' +
            'shall trigger a mandatory inspection within 24 hours, regardless of ' +
            'production schedule...',
        score: 0.74,
        },
        {
        filename:   'Incident_Report_INC_2025_114.txt',
        docType:    'INCIDENT',
        chunkIndex: 0,
        excerpt:
            'Seal face wear due to dry running conditions. Flush flow alarm setpoint ' +
            'was set above the actual minimum safe flow, delaying detection...',
        score: 0.61,
        }
    ]
}

// Simulated network delay (ms) - makes the stub feel realistic
const STUB_DELAY_MS = 1800

export function useChat() {

    const [messages, setMessages] = useState([])
    const [loading, seetLoading] = useState(false)
    const [error, setError] = useState(null)

    const sendMessage = useCallback(async (question, sessionId) => {
        if(!question.trim() || loading) return null

        setError(null)

        // Append user message immediately so UI feels responsive
        const userMsg = { role: 'user', content: question }
        setMessages((prev) => [...prev, userMsg])
        seetLoading(true)

        try {
            // STUB - replace this block in Phase 3
            await new Promise((resolve) => setTimeout(resolve, STUB_DELAY_MS))
            const data = { ...STUB_DELAY_MS, sessionId }

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
            const errMsg = {
                role: 'assistant',
                content: 'Something went wrong. Please try again.',
                sources: []
            }
            setMessages((prev) => [...prev, errMsg])
            setError(err.message)
            return null
        }
        finally {
            seetLoading(false)
        }
    }, [loading])

    const clearMessages = useCallback(() => {
        setMessages([])
        setError(null)
    }, [])

    return { messages, loading, error, sendMessage, clearMessages }

}