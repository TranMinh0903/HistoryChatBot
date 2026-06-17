import { useEffect, useRef, useState, type MouseEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Plus, Send, Trash2, MessageSquare, Star, Loader2, AlertTriangle } from 'lucide-react'
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
  const [confirmId, setConfirmId] = useState<string | null>(null)   // xác nhận xóa
  const [editingId, setEditingId] = useState<string | null>(null)   // đang đổi tên
  const [editTitle, setEditTitle] = useState('')
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

  // Bấm "Đoạn chat mới" chỉ mở khung trống — KHÔNG tạo session rỗng trong DB.
  // Session được tạo (và tự đặt tên) khi gửi tin nhắn đầu tiên.
  function newChat() {
    setActiveId(null)
    setMessages([])
    setInput('')
  }

  // ----- Đổi tên (double-click vào tiêu đề) -----
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

  // ----- Xóa (modal xác nhận, không dùng confirm() mặc định) -----
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

    // Tạo session ngay lần gửi đầu (nếu đang ở khung trống)
    let sid = activeId
    if (!sid) {
      const s = await chatApi.createSession()
      setSessions((prev) => [s, ...prev])
      setActiveId(s.id)
      sid = s.id
    }

    const optimistic: ChatMessage = { id: 'tmp-' + Date.now(), role: 'user', content, createdAt: new Date().toISOString() }
    setMessages((prev) => [...prev, optimistic])

    try {
      const res = await chatApi.sendMessage(sid, content)
      setMessages((prev) => [...prev.filter((m) => m.id !== optimistic.id), res.userMessage, res.assistantMessage])
      await loadSessions() // cập nhật tiêu đề (tự đặt theo câu hỏi đầu) & thứ tự
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

      {/* ----- Modal xác nhận xóa ----- */}
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
