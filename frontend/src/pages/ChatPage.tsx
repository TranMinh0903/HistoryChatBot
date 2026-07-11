import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AlertTriangle, Bot, Loader2, MessageSquare, Plus, Send, Sparkles, Trash2, UserRound } from 'lucide-react'
import type { ChatSession, ChatMessage } from '../types'
import * as chatApi from '../api/chat'
import './ChatPage.css'

const SUGGESTIONS = [
  'Hiệp định Genève 1954 có ý nghĩa gì?',
  'Đại hội Đảng lần III xác định nhiệm vụ gì?',
  'Ý nghĩa của Tổng tiến công Tết Mậu Thân 1968?',
  'Tóm tắt Chiến dịch Hồ Chí Minh năm 1975?',
]

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const selectSession = useCallback(async (id: string) => {
    setActiveId(id)
    setMessages(await chatApi.getMessages(id))
  }, [])

  const loadSessions = useCallback(async () => {
    const list = await chatApi.listSessions()
    setSessions(list)
    if (list.length && !activeId) await selectSession(list[0].id)
  }, [activeId, selectSession])

  useEffect(() => {
    let cancelled = false
    void chatApi.listSessions().then(async (list) => {
      if (cancelled) return
      setSessions(list)
      if (!list.length) return
      const messages = await chatApi.getMessages(list[0].id)
      if (cancelled) return
      setActiveId(list[0].id)
      setMessages(messages)
    })
    return () => { cancelled = true }
  }, [])
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [messages, sending])

  function newChat() {
    setActiveId(null)
    setMessages([])
    setInput('')
  }

  function startRename(s: ChatSession, e: MouseEvent) {
    e.stopPropagation()
    setEditingId(s.id)
    setEditTitle(s.title)
  }

  async function saveRename(id: string) {
    const title = editTitle.trim()
    setEditingId(null)
    const current = sessions.find((s) => s.id === id)
    if (!title || !current || title === current.title) return
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)))
    try { await chatApi.renameSession(id, title) } catch { void loadSessions() }
  }

  function askDelete(id: string, e: MouseEvent) {
    e.stopPropagation()
    setConfirmId(id)
  }

  async function doDelete() {
    const id = confirmId
    if (!id) return
    setConfirmId(null)
    await chatApi.deleteSession(id)
    const rest = sessions.filter((s) => s.id !== id)
    setSessions(rest)
    if (activeId === id) { setActiveId(null); setMessages([]) }
  }

  async function send(text: string) {
    const content = text.trim()
    if (!content || sending) return
    setInput('')
    setSending(true)

    let sid = activeId
    if (!sid) {
      const s = await chatApi.createSession()
      setSessions((prev) => [s, ...prev])
      setActiveId(s.id)
      sid = s.id
    }

    const optimistic: ChatMessage = { id: 'tmp-' + Date.now(), role: 'user', content, createdAt: new Date().toISOString() }
    const streamId = 'stream-' + Date.now()
    setMessages((prev) => [...prev, optimistic])
    setStreaming(false)

    try {
      let started = false
      const res = await chatApi.sendMessageStream(sid, content, (delta) => {
        setMessages((prev) => {
          if (!started) {
            started = true
            setStreaming(true)
            return [...prev, { id: streamId, role: 'assistant', content: delta, createdAt: new Date().toISOString() }]
          }
          return prev.map((m) => (m.id === streamId ? { ...m, content: m.content + delta } : m))
        })
      })
      // thay tin nhắn tạm bằng bản thật từ server
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimistic.id && m.id !== streamId),
        res.userMessage, res.assistantMessage,
      ])
      await loadSessions()
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== streamId),
        { id: 'err-' + Date.now(), role: 'assistant', content: 'Xin lỗi, có lỗi khi gửi tin nhắn. Vui lòng thử lại.', createdAt: new Date().toISOString() },
      ])
    } finally {
      setSending(false)
      setStreaming(false)
    }
  }

  const isEmpty = messages.length === 0 && !sending
  const sessionGroups = ['Hôm nay', 'Hôm qua', '7 ngày trước']
    .map((label) => ({
      label,
      items: sessions.filter((s) => {
        const updated = new Date(s.updatedAt)
        const today = new Date()
        const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
        const startUpdated = new Date(updated.getFullYear(), updated.getMonth(), updated.getDate()).getTime()
        const diffDays = Math.round((startToday - startUpdated) / 86400000)
        if (label === 'Hôm nay') return diffDays === 0
        if (label === 'Hôm qua') return diffDays === 1
        return diffDays > 1
      }),
    }))
    .filter((group) => group.items.length > 0)

  const chatInput = (
    <form
      className="chat-input"
      onSubmit={(e) => { e.preventDefault(); void send(input) }}
    >
      <textarea
        className="textarea"
        rows={1}
        value={input}
        placeholder="Hỏi bất kỳ điều gì về Lịch sử Đảng 1954-1975..."
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input) }
        }}
      />
      <button className="btn btn-primary chat-send" type="submit" disabled={sending || !input.trim()} aria-label="Gửi tin nhắn">
        {sending ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
      </button>
    </form>
  )

  return (
    <div className="chat">
      <div className="chat-sessions">
        <div className="chat-sessions-head">
          <span>Chatbot học tập</span>
          <strong>Cuộc trò chuyện</strong>
          <p>AI hỗ trợ học tập Lịch sử Đảng Cộng sản Việt Nam.</p>
        </div>

        <button className="btn btn-primary btn-block" onClick={newChat}>
          <Plus size={18} /> Đoạn chat mới
        </button>

        <div className="chat-sessions-list">
          {sessions.length === 0 && <p className="chat-sessions-empty muted">Chưa có đoạn chat nào</p>}
          {sessionGroups.map((group) => (
            <section className="chat-session-group" key={group.label}>
              <div className="chat-session-group-label">{group.label}</div>
              {group.items.map((s) => (
                <div
                  key={s.id}
                  className={'chat-session-item' + (s.id === activeId ? ' active' : '')}
                  onClick={() => selectSession(s.id)}
                >
                  <MessageSquare size={16} className="chat-session-icon" />
                  {editingId === s.id ? (
                    <input
                      className="chat-session-edit"
                      value={editTitle}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => saveRename(s.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(s.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                    />
                  ) : (
                    <span
                      className="chat-session-title"
                      title="Double-click để đổi tên"
                      onDoubleClick={(e) => startRename(s, e)}
                    >
                      {s.title}
                    </span>
                  )}
                  <button className="chat-session-del" onClick={(e) => askDelete(s.id, e)} title="Xóa">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </section>
          ))}
        </div>
      </div>

      <div className={'chat-main' + (isEmpty ? ' chat-main-empty' : '')}>
        <div className="chat-messages" ref={scrollRef}>
          {isEmpty ? (
            <div className="chat-empty">
              <div className="chat-empty-mark"><Sparkles size={28} /></div>
              <h2>AI Chatbot Lịch sử Việt Nam</h2>
              <p className="muted">Hỏi đáp về Lịch sử Đảng Cộng sản Việt Nam, giai đoạn 1954-1975.</p>
              {chatInput}
              <div className="chat-suggestions-wrap">
                <span>Gợi ý</span>
                <div className="chat-suggestions">
                  {SUGGESTIONS.map((q) => (
                    <button key={q} className="chat-suggestion" onClick={() => send(q)}>{q}</button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="chat-thread">
              {messages.map((m) => (
                <div key={m.id} className={'msg msg-' + m.role + ' fade-in'}>
                  <div className="msg-avatar">
                    {m.role === 'user' ? <UserRound size={17} /> : <Bot size={17} />}
                  </div>
                  <div className="msg-bubble">
                    {m.role === 'assistant'
                      ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      : m.content}
                  </div>
                </div>
              ))}
              {sending && !streaming && (
                <div className="msg msg-assistant fade-in">
                  <div className="msg-avatar"><Bot size={17} /></div>
                  <div className="msg-bubble"><span className="typing"><i /><i /><i /></span></div>
                </div>
              )}
            </div>
          )}
        </div>

        {!isEmpty && chatInput}
      </div>

      {confirmId && (
        <div className="chat-confirm-overlay" onClick={() => setConfirmId(null)}>
          <div className="chat-confirm card" onClick={(e) => e.stopPropagation()}>
            <div className="chat-confirm-icon"><AlertTriangle size={26} /></div>
            <h3>Xóa đoạn chat?</h3>
            <p className="muted">Toàn bộ tin nhắn trong đoạn chat này sẽ bị xóa và không thể khôi phục.</p>
            <div className="chat-confirm-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmId(null)}>Hủy</button>
              <button className="btn btn-danger" onClick={doDelete}><Trash2 size={16} /> Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
