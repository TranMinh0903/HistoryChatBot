import type { ChatSession, ChatMessage, SendMessageResponse } from '../types'
import { USE_MOCK, http, delay, uid, lsGet, lsSet } from './client'
import { mockChatReply } from '../mock/data'

const SESSIONS_KEY = 'lsd_sessions'
const msgKey = (sid: string) => `lsd_msgs_${sid}`

// ---------- list ----------
export async function listSessions(): Promise<ChatSession[]> {
  if (USE_MOCK) {
    await delay(150)
    return lsGet<ChatSession[]>(SESSIONS_KEY, []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }
  const { data } = await http.get<ChatSession[]>('/chat/sessions')
  return data
}

// ---------- create ----------
export async function createSession(title = 'Đoạn chat mới'): Promise<ChatSession> {
  if (USE_MOCK) {
    await delay(120)
    const now = new Date().toISOString()
    const s: ChatSession = { id: uid(), title, createdAt: now, updatedAt: now }
    const all = lsGet<ChatSession[]>(SESSIONS_KEY, [])
    lsSet(SESSIONS_KEY, [s, ...all])
    lsSet(msgKey(s.id), [])
    return s
  }
  const { data } = await http.post<ChatSession>('/chat/sessions', { title })
  return data
}

// ---------- messages ----------
export async function getMessages(sessionId: string): Promise<ChatMessage[]> {
  if (USE_MOCK) {
    await delay(120)
    return lsGet<ChatMessage[]>(msgKey(sessionId), [])
  }
  const { data } = await http.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`)
  return data
}

export async function sendMessage(sessionId: string, content: string): Promise<SendMessageResponse> {
  if (USE_MOCK) {
    await delay(700) // giả lập độ trễ AI
    const now = new Date().toISOString()
    const userMessage: ChatMessage = { id: uid(), role: 'user', content, createdAt: now }
    const assistantMessage: ChatMessage = {
      id: uid(), role: 'assistant', content: mockChatReply(content),
      createdAt: new Date().toISOString(), tokenCount: 0,
    }
    const msgs = lsGet<ChatMessage[]>(msgKey(sessionId), [])
    lsSet(msgKey(sessionId), [...msgs, userMessage, assistantMessage])

    // cập nhật session: đặt tiêu đề theo câu đầu + bump updatedAt
    const all = lsGet<ChatSession[]>(SESSIONS_KEY, [])
    const next = all.map((s) => {
      if (s.id !== sessionId) return s
      const isFirst = msgs.length === 0
      return {
        ...s,
        title: isFirst ? content.slice(0, 60) : s.title,
        updatedAt: new Date().toISOString(),
      }
    })
    lsSet(SESSIONS_KEY, next)
    return { userMessage, assistantMessage }
  }
  const { data } = await http.post<SendMessageResponse>(`/chat/sessions/${sessionId}/messages`, { content })
  return data
}

// ---------- rename / delete ----------
export async function renameSession(sessionId: string, title: string): Promise<void> {
  if (USE_MOCK) {
    await delay(80)
    const all = lsGet<ChatSession[]>(SESSIONS_KEY, [])
    lsSet(SESSIONS_KEY, all.map((s) => (s.id === sessionId ? { ...s, title } : s)))
    return
  }
  await http.patch(`/chat/sessions/${sessionId}`, { title })
}

export async function deleteSession(sessionId: string): Promise<void> {
  if (USE_MOCK) {
    await delay(80)
    const all = lsGet<ChatSession[]>(SESSIONS_KEY, [])
    lsSet(SESSIONS_KEY, all.filter((s) => s.id !== sessionId))
    localStorage.removeItem(msgKey(sessionId))
    return
  }
  await http.delete(`/chat/sessions/${sessionId}`)
}
