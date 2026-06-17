import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, X, Loader2, Gamepad2, Layers } from 'lucide-react'
import type { QuizQuestionAdmin, QuizQuestionInput, Flashcard, FlashcardInput, Option } from '../types'
import * as quizApi from '../api/quiz'
import * as fcApi from '../api/flashcards'
import { useAuth } from '../context/AuthContext'
import './ManagePage.css'

const emptyQuiz: QuizQuestionInput = {
  question: '', optionA: '', optionB: '', optionC: '', optionD: '',
  correctOption: 'A', explanation: '', difficulty: 1, topic: '', period: '',
}
const emptyFc: FlashcardInput = { front: '', back: '', topic: '', period: '' }
const OPTS: Option[] = ['A', 'B', 'C', 'D']
const DIFF = [[1, 'Dễ'], [2, 'Trung bình'], [3, 'Khó']] as const

export default function ManagePage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'quiz' | 'flashcards'>('quiz')
  const [questions, setQuestions] = useState<QuizQuestionAdmin[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [quizModal, setQuizModal] = useState<{ id: string | null; form: QuizQuestionInput } | null>(null)
  const [fcModal, setFcModal] = useState<{ id: string | null; form: FlashcardInput } | null>(null)

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [qs, fc] = await Promise.all([quizApi.getQuestionsAdmin(), fcApi.getFlashcards()])
      setQuestions(qs); setFlashcards(fc)
    } finally { setLoading(false) }
  }

  if (user?.role !== 2) return <Navigate to="/chat" replace />

  const setQ = <K extends keyof QuizQuestionInput>(key: K, val: QuizQuestionInput[K]) =>
    setQuizModal((m) => (m ? { ...m, form: { ...m.form, [key]: val } } : m))
  const setF = <K extends keyof FlashcardInput>(key: K, val: FlashcardInput[K]) =>
    setFcModal((m) => (m ? { ...m, form: { ...m.form, [key]: val } } : m))

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

  return (
    <div className="page">
      <div className="page-head">
        <h1>Quản lý nội dung</h1>
        <p>Thêm / sửa / xóa câu hỏi trắc nghiệm và thẻ ghi nhớ (chỉ quản trị viên)</p>
      </div>
      <div className="page-body">
        <div className="mng-tabs">
          <button className={'mng-tab' + (tab === 'quiz' ? ' active' : '')} onClick={() => setTab('quiz')}>
            <Gamepad2 size={17} /> Câu hỏi quiz ({questions.length})
          </button>
          <button className={'mng-tab' + (tab === 'flashcards' ? ' active' : '')} onClick={() => setTab('flashcards')}>
            <Layers size={17} /> Flashcards ({flashcards.length})
          </button>
        </div>

        {loading ? (
          <p className="muted">Đang tải…</p>
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
