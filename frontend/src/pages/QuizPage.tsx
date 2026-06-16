import { useEffect, useMemo, useState } from 'react'
import { Gamepad2, Check, X, Trophy, RotateCcw, ChevronRight, Loader2, Clock, History } from 'lucide-react'
import type { QuizQuestion, QuizResult, Option, QuizAttemptSummary } from '../types'
import * as quizApi from '../api/quiz'
import './QuizPage.css'

type Phase = 'idle' | 'playing' | 'result'
const OPTIONS: Option[] = ['A', 'B', 'C', 'D']
const DIFF_LABEL = ['', 'Dễ', 'Trung bình', 'Khó']

export default function QuizPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [count, setCount] = useState(10)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Option>>({})
  const [startedAt, setStartedAt] = useState('')
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [attempts, setAttempts] = useState<QuizAttemptSummary[]>([])

  useEffect(() => {
    if (phase !== 'playing') return
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => {
    if (phase === 'idle') quizApi.getAttempts().then(setAttempts).catch(() => {})
  }, [phase])

  const current = questions[index]
  const progress = questions.length ? ((index + (answers[current?.id] ? 1 : 0)) / questions.length) * 100 : 0

  async function start() {
    setLoading(true)
    try {
      const qs = await quizApi.getQuestions(count)
      setQuestions(qs); setIndex(0); setAnswers({}); setResult(null)
      setSeconds(0); setStartedAt(new Date().toISOString()); setPhase('playing')
    } finally { setLoading(false) }
  }

  function choose(opt: Option) {
    if (!current) return
    setAnswers((prev) => ({ ...prev, [current.id]: opt }))
  }

  async function next() {
    if (index < questions.length - 1) { setIndex((i) => i + 1); return }
    setLoading(true)
    try {
      const payload = questions.map((q) => ({ questionId: q.id, selectedOption: answers[q.id] ?? null }))
      setResult(await quizApi.submitAttempt(payload, startedAt))
      setPhase('result')
    } finally { setLoading(false) }
  }

  const timeStr = useMemo(() => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`, [seconds])

  // ---------- IDLE ----------
  if (phase === 'idle') {
    return (
      <div className="page">
        <div className="page-head"><h1>Trắc nghiệm ôn tập</h1><p>Kiểm tra kiến thức Lịch sử Đảng giai đoạn 1954 – 1975</p></div>
        <div className="page-body">
          <div className="quiz-start card card-pad fade-in">
            <div className="quiz-start-icon"><Gamepad2 size={40} /></div>
            <h2>Sẵn sàng kiểm tra kiến thức?</h2>
            <p className="muted">Chọn số câu hỏi và bắt đầu. Mỗi câu đúng được 1 điểm, kết quả tính theo thang 100.</p>
            <div className="quiz-count">
              {[5, 10, 15].map((n) => (
                <button key={n} className={'quiz-count-btn' + (count === n ? ' active' : '')} onClick={() => setCount(n)}>
                  {n} câu
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-block" onClick={start} disabled={loading}>
              {loading ? <Loader2 size={18} className="spin" /> : <Gamepad2 size={18} />} Bắt đầu
            </button>
          </div>

          {attempts.length > 0 && (
            <div className="quiz-history fade-in">
              <h3><History size={18} /> Lịch sử làm bài</h3>
              <div className="quiz-history-list">
                {attempts.slice(0, 8).map((a) => (
                  <div key={a.id} className="quiz-history-row card">
                    <span className={'quiz-history-score ' + (a.score >= 80 ? 'green' : a.score >= 50 ? 'gold' : 'red')}>{a.score}</span>
                    <span className="quiz-history-detail">Đúng {a.correctCount}/{a.totalQuestions} câu</span>
                    <span className="muted quiz-history-date">{new Date(a.finishedAt).toLocaleString('vi-VN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ---------- RESULT ----------
  if (phase === 'result' && result) {
    const pct = result.score
    const tone = pct >= 80 ? 'green' : pct >= 50 ? 'gold' : 'red'
    return (
      <div className="page">
        <div className="page-head"><h1>Kết quả</h1><p>Xem lại đáp án và giải thích</p></div>
        <div className="page-body">
          <div className={'quiz-score card card-pad fade-in tone-' + tone}>
            <Trophy size={44} />
            <div className="quiz-score-big">{result.score}<span>/100</span></div>
            <p>Đúng <b>{result.correctCount}</b>/{result.totalQuestions} câu · Thời gian {timeStr}</p>
            <button className="btn btn-gold" onClick={() => setPhase('idle')}><RotateCcw size={18} /> Làm lại</button>
          </div>

          <div className="quiz-review">
            {result.results.map((r, i) => {
              const q = questions.find((x) => x.id === r.questionId)!
              return (
                <div key={r.questionId} className="quiz-review-item card card-pad">
                  <div className="quiz-review-head">
                    <span className={'quiz-review-badge ' + (r.isCorrect ? 'ok' : 'no')}>
                      {r.isCorrect ? <Check size={14} /> : <X size={14} />}
                    </span>
                    <strong>Câu {i + 1}. {q.question}</strong>
                  </div>
                  <div className="quiz-review-opts">
                    {OPTIONS.map((o) => {
                      const isCorrect = o === r.correctOption
                      const isChosen = o === r.selectedOption
                      return (
                        <div key={o} className={'quiz-review-opt' + (isCorrect ? ' correct' : isChosen ? ' wrong' : '')}>
                          <b>{o}.</b> {q.options[o]}
                          {isCorrect && <Check size={15} />}
                          {isChosen && !isCorrect && <X size={15} />}
                        </div>
                      )
                    })}
                  </div>
                  {r.explanation && <div className="quiz-review-exp">💡 {r.explanation}</div>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ---------- PLAYING ----------
  return (
    <div className="page">
      <div className="page-head quiz-play-head">
        <div>
          <h1>Câu {index + 1} / {questions.length}</h1>
          {current?.topic && <p>Chủ đề: {current.topic} · {DIFF_LABEL[current.difficulty]}</p>}
        </div>
        <div className="quiz-timer"><Clock size={18} /> {timeStr}</div>
      </div>
      <div className="quiz-progress"><div style={{ width: `${progress}%` }} /></div>

      <div className="page-body">
        {current && (
          <div className="quiz-q card card-pad fade-in" key={current.id}>
            <h2 className="quiz-q-text">{current.question}</h2>
            <div className="quiz-options">
              {OPTIONS.map((o) => (
                <button
                  key={o}
                  className={'quiz-option' + (answers[current.id] === o ? ' selected' : '')}
                  onClick={() => choose(o)}
                >
                  <span className="quiz-option-key">{o}</span>
                  <span>{current.options[o]}</span>
                </button>
              ))}
            </div>
            <div className="quiz-actions">
              <button className="btn btn-primary" onClick={next} disabled={!answers[current.id] || loading}>
                {loading ? <Loader2 size={18} className="spin" /> : index < questions.length - 1 ? <>Câu tiếp <ChevronRight size={18} /></> : <>Nộp bài <Check size={18} /></>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
