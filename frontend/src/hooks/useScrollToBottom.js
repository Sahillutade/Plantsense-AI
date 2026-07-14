import { useEffect, useRef } from "react";


export function useScrollToBottom(deps = []) {

    const bottomRef = useRef(null)

    useEffect(() => {
        if (!bottomRef.current) return
        bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, deps)

    return bottomRef

}