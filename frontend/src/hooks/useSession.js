import { useState } from "react";
import { v4 as uuidv4 } from 'uuid'



export function useSession() {

    const [sessionId] = useState(() => {
        const stored = localStorage.getItem('plantsense_session_id')
        if (stored) return stored
        const fresh = uuidv4()
        localStorage.setItem('plantsense_session_id', fresh)
        return fresh
    })

    const clearSession = () => {
        const fresh = uuidv4()
        localStorage.setItem('plantsense_session_id', fresh)
        window.location.reload()
    }

    return { sessionId, clearSession }

}