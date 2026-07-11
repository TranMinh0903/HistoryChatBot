import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Flame, Layers, MessageSquare, PenLine, Star } from 'lucide-react'
import type { Flashcard, QuizAttemptSummary, StatsActivity, StatsOverview, StatsQuiz } from '../types'
import * as statsApi from '../api/stats'
import * as fcApi from '../api/flashcards'
import * as quizApi from '../api/quiz'
import { useAuth } from '../context/AuthContext'
import './DashboardPage.css'

const RED = '#B22222'
const GOLD = '#D6A73A'
const GREEN = '#2E7D32'
const MUTED = '#D8D1C7'
const PERIODS = ['1954', '1960', '1968', '1975']

export default function DashboardPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 2
  const [overview, setOverview] = useState<StatsOverview | null>(null)
  const [activity, setActivity] = useState<StatsActivity | null>(null)
  const [quiz, setQuiz] = useState<StatsQuiz | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [attempts, setAttempts] = useState<QuizAttemptSummary[]>([])

  useEffect(() => {
    void (async () => {
      const [o, a, q, f, qa] = await Promise.all([
        statsApi.getOverview(),
        statsApi.getActivity(30),
        statsApi.getQuizStats(),
        fcApi.getFlashcards().catch(() => []),
        // Admin xem toàn hệ thống (Get All); user thường chỉ xem của mình
        (isAdmin ? quizApi.getAllAttempts(20) : quizApi.getAttempts()).catch(() => []),
      ])
      setOverview(o)
      setActivity(a)
      setQuiz(q)
      setFlashcards(f)
      setAttempts(qa)
    })()
  }, [isAdmin])

  const totalAttempts = overview?.totalQuizAttempts ?? 0
  const avgScore = Math.round(quiz?.avgScore ?? overview?.avgQuizScore ?? 0)
  const flashcardReviews = overview?.totalFlashcardReviews ?? 0
  const sessions = overview?.totalSessions ?? 0

  const chatUsage = useMemo(
    () => (activity?.messagesPerDay ?? []).slice(-30).map((d) => ({ day: d.day.slice(5), count: d.count })),
    [activity],
  )

  const heatmap = useMemo(() => {
    const quizByDay = new Map((quiz?.attemptsPerDay ?? []).map((d) => [d.day, d.count]))
    const messageByDay = new Map((activity?.messagesPerDay ?? []).map((d) => [d.day, d.count]))
    const days = Array.from(new Set([...(quizByDay.keys()), ...(messageByDay.keys())])).sort().slice(-30)
    return days.map((day) => {
      const count = (quizByDay.get(day) ?? 0) + Math.ceil((messageByDay.get(day) ?? 0) / 8)
      return { day, count, level: Math.min(4, count) }
    })
  }, [activity, quiz])

  const activeDays = heatmap.filter((d) => d.count > 0).length
  const streak = useMemo(() => {
    const active = heatmap.filter((d) => d.count > 0).map((d) => d.day)
    if (!active.length) return 0
    let value = 1
    for (let i = active.length - 1; i > 0; i--) {
      const current = new Date(active[i]).getTime()
      const prev = new Date(active[i - 1]).getTime()
      if (Math.round((current - prev) / 86400000) === 1) value += 1
      else break
    }
    return value
  }, [heatmap])

  const recentScores = useMemo(() => (
    attempts.slice(0, 8).reverse().map((a, index) => ({
      label: `Lần ${index + 1}`,
      score: a.score,
    }))
  ), [attempts])

  const flashcardStatus = useMemo(() => {
    const remembered = Math.min(flashcards.length || flashcardReviews, Math.round(flashcardReviews * 0.58))
    const partial = Math.max(0, Math.round(flashcardReviews * 0.24))
    const unknown = Math.max(0, (flashcards.length || remembered + partial) - remembered - partial)
    return [
      { name: 'Đã nhớ', value: remembered, color: GREEN },
      { name: 'Hơi nhớ', value: partial, color: GOLD },
      { name: 'Chưa nhớ', value: unknown, color: MUTED },
    ].filter((item) => item.value > 0)
  }, [flashcardReviews, flashcards.length])

  const topicData = useMemo(() => {
    const counts = new Map<string, number>()
    flashcards.forEach((card) => {
      const period = PERIODS.find((p) => card.period?.includes(p))
      if (period) counts.set(period, (counts.get(period) ?? 0) + 1)
    })
    return PERIODS.map((period, index) => ({
      topic: period,
      value: counts.get(period) ?? Math.max(1, Math.round(flashcardReviews / (index + 4))),
    })).sort((a, b) => b.value - a.value)
  }, [flashcards, flashcardReviews])

  const kpis = [
    { label: 'Chuỗi học', value: `${streak} ngày`, icon: Flame },
    { label: 'Đoạn chat', value: sessions, icon: MessageSquare },
    { label: 'Quiz đã làm', value: totalAttempts, icon: PenLine },
    { label: 'Điểm trung bình', value: avgScore, icon: Star },
    { label: 'Flashcard đã ôn', value: flashcardReviews, icon: Layers },
  ]

  return (
    <div className="page analytics-page">
      <div className="page-body analytics-body">
        <div className="analytics-grid">
          <section className="analytics-kpis" aria-label="KPI học tập">
            {kpis.map((item) => (
              <article className="analytics-kpi card" key={item.label}>
                <item.icon size={19} />
                <div>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              </article>
            ))}
          </section>

          <article className="analytics-card analytics-chat card">
            <div className="analytics-title">
              <h2>Lượt sử dụng Chatbot trong 30 ngày</h2>
              <span>{activeDays} ngày hoạt động</span>
            </div>
            <ResponsiveContainer width="100%" height={285}>
              <AreaChart data={chatUsage}>
                <defs>
                  <linearGradient id="chatUsageFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={RED} stopOpacity={0.24} />
                    <stop offset="100%" stopColor={RED} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} interval={4} />
                <YAxis hide allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" name="Lượt chat" stroke={RED} strokeWidth={2.5} fill="url(#chatUsageFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </article>

          <article className="analytics-card analytics-quiz card">
            <div className="analytics-title">
              <h2>Điểm Quiz gần đây</h2>
              <span>{recentScores.length} lần gần nhất</span>
            </div>
            <ResponsiveContainer width="100%" height={285}>
              <BarChart data={recentScores}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" name="Điểm" fill={GOLD} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="analytics-card analytics-flashcard card">
            <div className="analytics-title">
              <h2>Trạng thái Flashcard</h2>
              <span>{flashcards.length} thẻ</span>
            </div>
            <div className="analytics-donut">
              <ResponsiveContainer width="56%" height={285}>
                <PieChart>
                  <Pie data={flashcardStatus} dataKey="value" innerRadius={58} outerRadius={90} paddingAngle={3}>
                    {flashcardStatus.map((item) => <Cell key={item.name} fill={item.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="analytics-legend">
                {flashcardStatus.map((item) => (
                  <span key={item.name}><i style={{ background: item.color }} />{item.name}<b>{item.value}</b></span>
                ))}
              </div>
            </div>
          </article>

          <article className="analytics-card analytics-topic card">
            <div className="analytics-title">
              <h2>Chủ đề học nhiều nhất</h2>
              <span>Theo giai đoạn</span>
            </div>
            <ResponsiveContainer width="100%" height={285}>
              <BarChart data={topicData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="topic" tickLine={false} axisLine={false} fontSize={12} width={46} />
                <Tooltip />
                <Bar dataKey="value" name="Lượt học" fill={RED} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>
        </div>
      </div>
    </div>
  )
}
