import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, X, Loader2, Gamepad2, Layers, Users, Search } from 'lucide-react'
import type { QuizQuestionAdmin, QuizQuestionInput, Flashcard, FlashcardInput, Option, UserAdmin } from '../types'
import * as quizApi from '../api/quiz'
import * as fcApi from '../api/flashcards'
import * as usersApi from '../api/users'
import { useAuth } from '../context/AuthContext'
import './ManagePage.css'

const emptyQuiz: QuizQuestionInput = {
  question: '', optionA: '', optionB: '', optionC: '', optionD: '',
  correctOption: 'A', explanation: '', difficulty: 1, topic: '', period: '',
}
const emptyFc: FlashcardInput = { front: '', back: '', topic: '', period: '' }
const OPTS: Option[] = ['A', 'B', 'C', 'D']
const DIFF = [[1, 'Dễ'], [2, 'Trung bình'], [3, 'Khó']] as const
type ManageTab = 'users' | 'quiz' | 'flashcards'

function linePoints(values: number[]) {
  const width = 150
  const height = 44
  const max = Math.max(1, ...values)
  const step = values.length > 1 ? width / (values.length - 1) : width
  return values.map((value, index) => {
    const x = Math.round(index * step)
    const y = Math.round(height - (value / max) * (height - 8) - 4)
    return `${x},${y}`
  }).join(' ')
}

export default function ManagePage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<ManageTab>('users')
  const [users, setUsers] = useState<UserAdmin[]>([])
  const [userQuery, setUserQuery] = useState('')
  const [questions, setQuestions] = useState<QuizQuestionAdmin[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [quizModal, setQuizModal] = useState<{ id: string | null; form: QuizQuestionInput } | null>(null)
  const [fcModal, setFcModal] = useState<{ id: string | null; form: FlashcardInput } | null>(null)

  useEffect(() => {
    if (user?.role === 2) void load()
  }, [user?.role])

  async function load() {
    setLoading(true)
    try {
      const [us, qs, fc] = await Promise.all([
        usersApi.getUsersAdmin(),
        quizApi.getQuestionsAdmin(),
        fcApi.getFlashcards(),
      ])
      setUsers(us); setQuestions(qs); setFlashcards(fc)
    } finally { setLoading(false) }
  }

  const setQ = <K extends keyof QuizQuestionInput>(key: K, val: QuizQuestionInput[K]) =>
    setQuizModal((m) => (m ? { ...m, form: { ...m.form, [key]: val } } : m))
  const setF = <K extends keyof FlashcardInput>(key: K, val: FlashcardInput[K]) =>
    setFcModal((m) => (m ? { ...m, form: { ...m.form, [key]: val } } : m))

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase()
    return users.filter((u) => !q || [u.displayName, u.username, u.email ?? ''].some((value) => value.toLowerCase().includes(q)))
  }, [userQuery, users])

  const userStats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.lastLoginAt && Date.now() - new Date(u.lastLoginAt).getTime() <= 7 * 86400000).length,
    visits: users.reduce((sum, u) => sum + u.totalVisits, 0),
    uses: users.reduce((sum, u) => sum + u.webUses, 0),
  }), [users])

  async function delUser(id: string) {
    if (!confirm('Xóa người dùng này? Toàn bộ dữ liệu học tập liên quan sẽ bị xóa.')) return
    await usersApi.deleteUser(id)
    await load()
  }

  async function saveQuiz() {
    if (!quizModal || !quizModal.form.question.trim()) return
    setSaving(true)
    try {
      if (quizModal.id) await quizApi.updateQuestion(quizModal.id, quizModal.form)
      else await quizApi.createQuestion(quizModal.form)
      setQuizModal(null); await load()
    } finally { setSaving(false) }
  }
  async function delQuiz(id: string) {
    if (!confirm('Xóa câu hỏi này?')) return
    await quizApi.deleteQuestion(id); await load()
  }

  async function saveFc() {
    if (!fcModal || !fcModal.form.front.trim()) return
    setSaving(true)
    try {
      if (fcModal.id) await fcApi.updateFlashcard(fcModal.id, fcModal.form)
      else await fcApi.createFlashcard(fcModal.form)
      setFcModal(null); await load()
    } finally { setSaving(false) }
  }
  async function delFc(id: string) {
    if (!confirm('Xóa thẻ này?')) return
    await fcApi.deleteFlashcard(id); await load()
  }

  if (user?.role !== 2) return <Navigate to="/chat" replace />

  return (
    <div className="page">
      <div className="page-head">
        <h1>Quản lý hệ thống</h1>
        <p>Theo dõi người dùng, lượt truy cập và quản lý nội dung học tập</p>
      </div>
      <div className="page-body">
        <div className="mng-tabs">
          <button className={'mng-tab' + (tab === 'users' ? ' active' : '')} onClick={() => setTab('users')}>
            <Users size={17} /> Người dùng ({users.length})
          </button>
          <button className={'mng-tab' + (tab === 'quiz' ? ' active' : '')} onClick={() => setTab('quiz')}>
            <Gamepad2 size={17} /> Câu hỏi quiz ({questions.length})
          </button>
          <button className={'mng-tab' + (tab === 'flashcards' ? ' active' : '')} onClick={() => setTab('flashcards')}>
            <Layers size={17} /> Flashcards ({flashcards.length})
          </button>
        </div>

        {loading ? (
          <p className="muted">Đang tải…</p>
        ) : tab === 'users' ? (
          <>
            <section className="mng-user-stats" aria-label="Tổng quan người dùng">
              <div className="mng-stat-card">
                <span><Users size={17} /></span>
                <p>Tổng người dùng</p>
                <strong>{userStats.total}</strong>
              </div>
              <div className="mng-stat-card">
                <span><Search size={17} /></span>
                <p>Hoạt động 7 ngày</p>
                <strong>{userStats.active}</strong>
              </div>
              <div className="mng-stat-card">
                <span><Search size={17} /></span>
                <p>Lượt truy cập</p>
                <strong>{userStats.visits}</strong>
              </div>
              <div className="mng-stat-card">
                <span><Gamepad2 size={17} /></span>
                <p>Lần sử dụng</p>
                <strong>{userStats.uses}</strong>
              </div>
            </section>

            <div className="mng-user-tools">
              <label className="mng-search">
                <Search size={17} />
                <input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="Tìm theo tên, tài khoản hoặc email" />
              </label>
            </div>

            <div className="mng-user-list">
              {filteredUsers.map((u) => {
                const isMe = u.id === user.id
                return (
                  <article key={u.id} className="mng-user-row card">
                    <div className="mng-user-avatar">
                      {u.avatarUrl ? <img src={u.avatarUrl} alt="" referrerPolicy="no-referrer" /> : (u.displayName || u.username).charAt(0).toUpperCase()}
                    </div>
                    <div className="mng-user-main">
                      <div className="mng-user-name">
                        <strong>{u.displayName || u.username}</strong>
                        {isMe && <span className="badge badge-gold">Bạn</span>}
                      </div>
                      <div className="mng-user-meta">
                        <span>@{u.username}</span>
                        {u.email && <span>{u.email}</span>}
                        <span>Tham gia {new Date(u.createdAt).toLocaleDateString('vi-VN')}</span>
                        <span>{u.lastLoginAt ? `Hoạt động ${new Date(u.lastLoginAt).toLocaleDateString('vi-VN')}` : 'Chưa đăng nhập'}</span>
                      </div>
                    </div>
                    <div className="mng-user-metrics">
                      <span><b>{u.totalVisits}</b> lượt truy cập</span>
                      <span><b>{u.webUses}</b> lần sử dụng</span>
                      <span><b>{u.quizAttempts}</b> bài kiểm tra</span>
                      <span><b>{u.flashcardReviews}</b> lượt thẻ</span>
                    </div>
                    <div className="mng-user-activity" aria-hidden="true">
                      <svg viewBox="0 0 150 44" preserveAspectRatio="none">
                        <polyline points={linePoints(u.activityMap)} />
                      </svg>
                    </div>
                    <div className="mng-user-actions">
                      <button className="mng-icon danger" disabled={isMe} title="Xóa người dùng" onClick={() => delUser(u.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                )
              })}
              {filteredUsers.length === 0 && <p className="mng-empty muted">Không có người dùng phù hợp với bộ lọc hiện tại.</p>}
            </div>
          </>
        ) : tab === 'quiz' ? (
          <>
            <button className="btn btn-primary mng-add" onClick={() => setQuizModal({ id: null, form: { ...emptyQuiz } })}>
              <Plus size={17} /> Thêm câu hỏi
            </button>
            <div className="mng-list">
              {questions.map((q) => (
                <div key={q.id} className="mng-item card">
                  <div className="mng-item-main">
                    <div className="mng-item-title">{q.question}</div>
                    <div className="mng-item-meta">
                      <span className="badge badge-green">Đáp án đúng: {q.correctOption}</span>
                      {q.topic && <span className="badge badge-gold">{q.topic}</span>}
                      {q.period && <span className="badge badge-red">{q.period}</span>}
                      <span className="muted">{DIFF.find((d) => d[0] === q.difficulty)?.[1]}</span>
                    </div>
                  </div>
                  <div className="mng-item-actions">
                    <button className="mng-icon" title="Sửa" onClick={() => setQuizModal({
                      id: q.id,
                      form: {
                        question: q.question, optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD,
                        correctOption: q.correctOption, explanation: q.explanation ?? '', difficulty: q.difficulty,
                        topic: q.topic ?? '', period: q.period ?? '',
                      },
                    })}><Pencil size={16} /></button>
                    <button className="mng-icon danger" title="Xóa" onClick={() => delQuiz(q.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <button className="btn btn-primary mng-add" onClick={() => setFcModal({ id: null, form: { ...emptyFc } })}>
              <Plus size={17} /> Thêm thẻ
            </button>
            <div className="mng-list">
              {flashcards.map((f) => (
                <div key={f.id} className="mng-item card">
                  <div className="mng-item-main">
                    <div className="mng-item-title">{f.front}</div>
                    <div className="mng-item-sub">{f.back}</div>
                    <div className="mng-item-meta">
                      {f.topic && <span className="badge badge-gold">{f.topic}</span>}
                      {f.period && <span className="badge badge-red">{f.period}</span>}
                    </div>
                  </div>
                  <div className="mng-item-actions">
                    <button className="mng-icon" title="Sửa" onClick={() => setFcModal({
                      id: f.id, form: { front: f.front, back: f.back, topic: f.topic ?? '', period: f.period ?? '' },
                    })}><Pencil size={16} /></button>
                    <button className="mng-icon danger" title="Xóa" onClick={() => delFc(f.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ---- Modal quiz ---- */}
      {quizModal && (
        <div className="mng-overlay" onClick={() => setQuizModal(null)}>
          <div className="mng-modal card" onClick={(e) => e.stopPropagation()}>
            <div className="mng-modal-head">
              <h3>{quizModal.id ? 'Sửa câu hỏi' : 'Thêm câu hỏi'}</h3>
              <button className="mng-icon" onClick={() => setQuizModal(null)}><X size={18} /></button>
            </div>
            <div className="mng-form">
              <div>
                <label className="label">Câu hỏi</label>
                <textarea className="textarea" rows={2} value={quizModal.form.question} onChange={(e) => setQ('question', e.target.value)} />
              </div>
              {OPTS.map((o) => {
                const key = `option${o}` as 'optionA' | 'optionB' | 'optionC' | 'optionD'
                return (
                  <div key={o}>
                    <label className="label">Đáp án {o}</label>
                    <input className="input" value={quizModal.form[key]} onChange={(e) => setQ(key, e.target.value)} />
                  </div>
                )
              })}
              <div className="mng-form-row">
                <div>
                  <label className="label">Đáp án đúng</label>
                  <select className="input" value={quizModal.form.correctOption} onChange={(e) => setQ('correctOption', e.target.value as Option)}>
                    {OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Độ khó</label>
                  <select className="input" value={quizModal.form.difficulty} onChange={(e) => setQ('difficulty', Number(e.target.value))}>
                    {DIFF.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="mng-form-row">
                <div>
                  <label className="label">Chủ đề</label>
                  <input className="input" value={quizModal.form.topic ?? ''} onChange={(e) => setQ('topic', e.target.value)} />
                </div>
                <div>
                  <label className="label">Giai đoạn</label>
                  <input className="input" value={quizModal.form.period ?? ''} onChange={(e) => setQ('period', e.target.value)} placeholder="vd 1954" />
                </div>
              </div>
              <div>
                <label className="label">Giải thích đáp án</label>
                <textarea className="textarea" rows={2} value={quizModal.form.explanation ?? ''} onChange={(e) => setQ('explanation', e.target.value)} />
              </div>
            </div>
            <div className="mng-modal-foot">
              <button className="btn btn-ghost" onClick={() => setQuizModal(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={saveQuiz} disabled={saving}>
                {saving && <Loader2 size={16} className="spin" />} Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Modal flashcard ---- */}
      {fcModal && (
        <div className="mng-overlay" onClick={() => setFcModal(null)}>
          <div className="mng-modal card" onClick={(e) => e.stopPropagation()}>
            <div className="mng-modal-head">
              <h3>{fcModal.id ? 'Sửa thẻ' : 'Thêm thẻ'}</h3>
              <button className="mng-icon" onClick={() => setFcModal(null)}><X size={18} /></button>
            </div>
            <div className="mng-form">
              <div>
                <label className="label">Mặt trước (câu hỏi / mốc sự kiện)</label>
                <textarea className="textarea" rows={2} value={fcModal.form.front} onChange={(e) => setF('front', e.target.value)} />
              </div>
              <div>
                <label className="label">Mặt sau (đáp án / nội dung)</label>
                <textarea className="textarea" rows={2} value={fcModal.form.back} onChange={(e) => setF('back', e.target.value)} />
              </div>
              <div className="mng-form-row">
                <div>
                  <label className="label">Chủ đề</label>
                  <input className="input" value={fcModal.form.topic ?? ''} onChange={(e) => setF('topic', e.target.value)} />
                </div>
                <div>
                  <label className="label">Giai đoạn</label>
                  <input className="input" value={fcModal.form.period ?? ''} onChange={(e) => setF('period', e.target.value)} placeholder="vd 1975" />
                </div>
              </div>
            </div>
            <div className="mng-modal-foot">
              <button className="btn btn-ghost" onClick={() => setFcModal(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={saveFc} disabled={saving}>
                {saving && <Loader2 size={16} className="spin" />} Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
