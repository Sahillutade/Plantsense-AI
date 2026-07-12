import axios from 'axios'

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 60000, // 60s — embedding + LLM can take time on cold start
})

// Documents

export const fetchDocuments = () => client.get('/documents')

export const fetchStats = () => client.get('/documents/stats')

// Chat

export const postChat = (question, sessionId) => client.post('/chat', { question, sessionId })

export const fetchHistory = (sessionId) => client.get(`/chat/history?sessionId=${encodeURIComponent(sessionId)}`)

// Equipment

export const fetchEquipment = (tag) => client.get(`/equipment/${encodeURIComponent(tag)}`)

export const fetchEquipmentDocs = (tag) => client.get(`/equipment/${encodeURIComponent(tag)}/docs`)

// Ingestion

export const ingestFile = (file) => {
    const form = new FormData()
    form.append('file', file)
    return client.post('/ingest', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 2 min — ingestion + embedding per chunk takes time
    })
}