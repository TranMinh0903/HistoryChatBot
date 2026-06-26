import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Flame,
  Gamepad2,
  History,
  Loader2,
  Rocket,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  X,
} from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { QuizQuestion, QuizResult, Option, QuizAttemptSummary } from '../types'
import * as quizApi from '../api/quiz'
import './QuizPage.css'

type Phase = 'idle' | 'playing' | 'result'
const OPTIONS: Option[] = ['A', 'B', 'C', 'D']
const DIFF_LABEL = ['', 'Dễ', 'Trung bình', 'Khó']
const QUIZ_MODES = [
  { count: 5, name: 'Nhanh', time: '~2 phút', icon: Sparkles },
  { count: 10, name: 'Tiêu chuẩn', time: '~5 phút', icon: BookOpen },
  { count: 15, name: 'Thử thách', time: '~8 phút', icon: Trophy },
]

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
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttemptSummary | null>(null)
  const [showAllAttempts, setShowAllAttempts] = useState(false)

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
  const totalAttempts = attempts.length
  const bestScore = attempts.length ? Math.max(...attempts.map((a) => a.score)) : 0
  const avgScore = attempts.length ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length) : 0
  const streak = useMemo(() => {
    const days = Array.from(new Set(attempts.map((a) => new Date(a.finishedAt).toDateString())))
      .map((d) => new Date(d).getTime())
      .sort((a, b) => b - a)
    if (!days.length) return 0
    let value = 1
    for (let i = 1; i < days.length; i++) {
      const diff = Math.round((days[i - 1] - days[i]) / 86400000)
      if (diff === 1) value += 1
      else break
    }
    return value
  }, [attempts])
  const chartData = useMemo(
    () => attempts.slice(0, 8).reverse().map((a, i) => ({
      name: `Lần ${i + 1}`,
      score: a.score,
    })),
    [attempts],
  )

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
        <div className="page-body quiz-idle-body">
          <div className="quiz-start card card-pad fade-in">
            <div className="quiz-start-icon"><Gamepad2 size={40} /></div>
            <h2>Sẵn sàng kiểm tra kiến thức?</h2>
            <p className="muted">Chọn số câu hỏi và bắt đầu. Mỗi câu đúng được 1 điểm, kết quả tính theo thang 100.</p>
            <div className="quiz-count">
              {QUIZ_MODES.map((mode) => {
                const Icon = mode.icon
                return (
                <button key={mode.count} className={'quiz-count-btn' + (count === mode.count ? ' active' : '')} onClick={() => setCount(mode.count)}>
                  <span className="quiz-mode-icon"><Icon size={18} /></span>
                  <strong>{mode.name}</strong>
                  <span>{mode.count} câu</span>
                  <small>{mode.time}</small>
                </button>
                )
              })}
            </div>
            <div className="quiz-preview">
              <span><Check size={15} /> Trắc nghiệm</span>
              <span><Check size={15} /> Chấm điểm ngay</span>
              <span><Check size={15} /> Không giới hạn thời gian</span>
            </div>
            <button className="btn btn-primary btn-block" onClick={start} disabled={loading}>
              {loading ? <Loader2 size={18} className="spin" /> : <Rocket size={18} />} Bắt đầu bài kiểm tra
            </button>
          </div>

          {attempts.length > 0 && (
            <section className="quiz-history-shell fade-in">
              <div className="quiz-chart card">
                <div className="quiz-section-title">
                  <h3><BarChart3 size={18} /> Điểm gần đây</h3>
                  <span>{chartData.length} lần gần nhất</span>
                </div>
                <div className="quiz-mini-chart">
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="quizScoreFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#B22222" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#B22222" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <Tooltip />
                      <Area type="monotone" dataKey="score" stroke="#B22222" strokeWidth={3} fill="url(#quizScoreFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="quiz-history">
                <div className="quiz-section-title">
                  <h3><History size={18} /> Lịch sử làm bài</h3>
                  {attempts.length > 3 ? (
                    <button type="button" className="quiz-view-all" onClick={() => setShowAllAttempts(true)}>Xem tất cả</button>
                  ) : (
                    <span>Click để xem lại</span>
                  )}
                </div>
                <div className="quiz-history-list">
                  <div className="quiz-history-header">
                    <span>Score</span>
                    <span>Progress</span>
                    <span>Ngày</span>
                  </div>
                  {attempts.slice(0, 3).map((a) => (
                    <button key={a.id} className="quiz-history-row card" type="button" onClick={() => setSelectedAttempt(a)}>
                      <span className={'quiz-history-score ' + (a.score >= 80 ? 'green' : a.score >= 50 ? 'gold' : 'red')}>{a.score}</span>
                      <span className="quiz-history-detail">
                        <b>{a.correctCount}/{a.totalQuestions}</b>
                        <i><span style={{ width: `${Math.round((a.correctCount / a.totalQuestions) * 100)}%` }} /></i>
                      </span>
                      <span className="muted quiz-history-date">{new Date(a.finishedAt).toLocaleDateString('vi-VN')}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="quiz-achievements fade-in" aria-label="Tóm tắt thành tích">
            <div className="quiz-stat-card">
              <span><History size={16} /></span>
              <p>Tổng bài</p>
              <strong>{totalAttempts}</strong>
            </div>
            <div className="quiz-stat-card">
              <span><Trophy size={16} /></span>
              <p>Cao nhất</p>
              <strong>{bestScore}</strong>
            </div>
            <div className="quiz-stat-card">
              <span><Target size={16} /></span>
              <p>Trung bình</p>
              <strong>{avgScore}</strong>
            </div>
            <div className="quiz-stat-card">
              <span><Flame size={16} /></span>
              <p>Chuỗi học</p>
              <strong>{streak}</strong>
            </div>
          </section>

          {selectedAttempt && (
            <div className="quiz-attempt-overlay" onClick={() => setSelectedAttempt(null)}>
              <div className="quiz-attempt-dialog card" onClick={(e) => e.stopPropagation()}>
                <button className="quiz-attempt-close" type="button" onClick={() => setSelectedAttempt(null)}><X size={18} /></button>
                <span className={'quiz-history-score ' + (selectedAttempt.score >= 80 ? 'green' : selectedAttempt.score >= 50 ? 'gold' : 'red')}>
                  {selectedAttempt.score}
                </span>
                <h3>Tóm tắt lần làm bài</h3>
                <p>Đúng {selectedAttempt.correctCount}/{selectedAttempt.totalQuestions} câu</p>
                <div className="quiz-attempt-progress">
                  <span style={{ width: `${Math.round((selectedAttempt.correctCount / selectedAttempt.totalQuestions) * 100)}%` }} />
                </div>
                <small>{new Date(selectedAttempt.finishedAt).toLocaleString('vi-VN')}</small>
              </div>
            </div>
          )}

          {showAllAttempts && (
            <div className="quiz-attempt-overlay" onClick={() => setShowAllAttempts(false)}>
              <div className="quiz-all-dialog card" onClick={(e) => e.stopPropagation()}>
                <button className="quiz-attempt-close" type="button" onClick={() => setShowAllAttempts(false)}><X size={18} /></button>
                <div className="quiz-section-title">
                  <h3><History size={18} /> Tất cả lần làm bài</h3>
                  <span>{attempts.length} lần</span>
                </div>
                <div className="quiz-history-list">
                  <div className="quiz-history-header">
                    <span>Score</span>
                    <span>Progress</span>
                    <span>Ngày</span>
                  </div>
                  {attempts.map((a) => (
                    <button key={a.id} className="quiz-history-row card" type="button" onClick={() => { setSelectedAttempt(a); setShowAllAttempts(false) }}>
                      <span className={'quiz-history-score ' + (a.score >= 80 ? 'green' : a.score >= 50 ? 'gold' : 'red')}>{a.score}</span>
                      <span className="quiz-history-detail">
                        <b>{a.correctCount}/{a.totalQuestions}</b>
                        <i><span style={{ width: `${Math.round((a.correctCount / a.totalQuestions) * 100)}%` }} /></i>
                      </span>
                      <span className="muted quiz-history-date">{new Date(a.finishedAt).toLocaleDateString('vi-VN')}</span>
                    </button>
                  ))}
                </div>
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
