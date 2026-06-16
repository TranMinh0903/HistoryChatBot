import { useEffect, useRef, useState, type MouseEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Plus, Send, Trash2, MessageSquare, Star, Loader2 } from 'lucide-react'
import type { ChatSession, ChatMessage } from '../types'
import * as chatApi from '../api/chat'
import './ChatPage.css'

const SUGGESTIONS = [
  'Hiệp định Genève 1954 có ý nghĩa gì?',
  'Phong trào Đồng Khởi diễn ra ở đâu?',
  'Ý nghĩa của cuộc Tổng tiến công Tết Mậu Thân 1968?',
  'Tóm tắt diễn biến Đại thắng mùa Xuân 1975?',
]

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { void loadSessions() }, [])
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [messages, sending])

  async function loadSessions() {
    const list = await chatApi.listSessions()
    setSessions(list)
    if (list.length && !activeId) await selectSession(list[0].id)
  }

  async function selectSession(id: string) {
    setActiveId(id)
    setMessages(await chatApi.getMessages(id))
  }

  async function newChat() {
    const s = await chatApi.createSession()
    setSessions((prev) => [s, ...prev])
    setActiveId(s.id)
    setMessages([])
  }

  async function removeSession(id: string, e: MouseEvent) {
    e.stopPropagation()
    if (!confirm('Xóa đoạn chat này?')) return
    await chatApi.deleteSession(id)
    const rest = sessions.filter((s) => s.id !== id)
    setSessions(rest)
    if (activeId === id) {
      if (rest.length) await selectSession(rest[0].id)
      else { setActiveId(null); setMessages([]) }
    }
  }

  async function send(text: string) {
    const content = text.trim()
    if (!content || sending) return
    setInput('')
    setSending(true)

    // đảm bảo có session
    let sid = activeId
    if (!sid) {
      const s = await chatApi.createSession()
      setSessions((prev) => [s, ...prev])
      setActiveId(s.id)
      sid = s.id
    }

    // hiển thị tin nhắn người dùng ngay
    const optimistic: ChatMessage = { id: 'tmp-' + Date.now(), role: 'user', content, createdAt: new Date().toISOString() }
    setMessages((prev) => [...prev, optimistic])

    try {
      const res = await chatApi.sendMessage(sid, content)
      setMessages((prev) => [...prev.filter((m) => m.id !== optimistic.id), res.userMessage, res.assistantMessage])
      await loadSessions() // cập nhật tiêu đề & thứ tự
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: 'err-' + Date.now(), role: 'assistant', content: '⚠️ Xin lỗi, có lỗi khi gửi tin nhắn. Vui lòng thử lại.', createdAt: new Date().toISOString() },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="chat">
      {/* ----- Sidebar: lịch sử đoạn chat ----- */}
      <div className="chat-sessions">
        <button className="btn btn-primary btn-block" onClick={newChat}>
          <Plus size={18} /> Đoạn chat mới
        </button>
        <div className="chat-sessions-list">
          {sessions.length === 0 && <p className="chat-sessions-empty muted">Chưa có đoạn chat nào</p>}
          {sessions.map((s) => (
            <div
              key={s.id}
              className={'chat-session-item' + (s.id === activeId ? ' active' : '')}
              onClick={() => selectSession(s.id)}
            >
              <MessageSquare size={16} className="chat-session-icon" />
              <span className="chat-session-title">{s.title}</span>
              <button className="chat-session-del" onClick={(e) => removeSession(s.id, e)} title="Xóa">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ----- Cửa sổ chat ----- */}
      <div className="chat-main">
        <div className="chat-messages" ref={scrollRef}>
          {messages.length === 0 && !sending ? (
            <div className="chat-empty">
              <div className="chat-empty-star"><Star size={36} fill="#FFCD00" stroke="#FFCD00" /></div>
              <h2>Trợ lý Lịch sử Đảng (1954 – 1975)</h2>
              <p className="muted">Hãy đặt câu hỏi về các sự kiện, mốc thời gian, nhân vật lịch sử.</p>
              <div className="chat-suggestions">
                {SUGGESTIONS.map((q) => (
                  <button key={q} className="chat-suggestion" onClick={() => send(q)}>{q}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="chat-thread">
              {messages.map((m) => (
                <div key={m.id} className={'msg msg-' + m.role + ' fade-in'}>
                  <div className="msg-avatar">{m.role === 'user' ? 'Tôi' : <Star size={16} fill="#FFCD00" stroke="#FFCD00" />}</div>
                  <div className="msg-bubble">
                    {m.role === 'assistant'
                      ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      : m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="msg msg-assistant fade-in">
                  <div className="msg-avatar"><Star size={16} fill="#FFCD00" stroke="#FFCD00" /></div>
                  <div className="msg-bubble"><span className="typing"><i /><i /><i /></span></div>
                </div>
              )}
            </div>
          )}
        </div>

        <form
          className="chat-input"
          onSubmit={(e) => { e.preventDefault(); void send(input) }}
        >
          <textarea
            className="textarea"
            rows={1}
            value={input}
            placeholder="Nhập câu hỏi về lịch sử Đảng 1954–1975…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input) }
            }}
          />
          <button className="btn btn-primary chat-send" type="submit" disabled={sending || !input.trim()}>
            {sending ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  )
}
