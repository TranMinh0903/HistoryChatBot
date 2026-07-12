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
import { Flame, Layers, MessageSquare, PenLine, Star, Users, UserCheck } from 'lucide-react'
import type { Flashcard, FlashcardStatus, LeaderboardEntry, QuizAttemptSummary, StatsActivity, StatsOverview, StatsQuiz } from '../types'
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
  const [fcStatus, setFcStatus] = useState<FlashcardStatus[]>([])
  const [attempts, setAttempts] = useState<QuizAttemptSummary[]>([])
  const [board, setBoard] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    void (async () => {
      const [o, a, q, f, st, qa] = await Promise.all([
        statsApi.getOverview(),
        statsApi.getActivity(30),
        statsApi.getQuizStats(),
        fcApi.getFlashcards().catch(() => []),
        fcApi.getMyStatus().catch(() => []),   // trạng thái ghi nhớ THẬT của user
        // Admin xem toàn hệ thống (Get All); user thường chỉ xem của mình
        (isAdmin ? quizApi.getAllAttempts(20) : quizApi.getAttempts()).catch(() => []),
      ])
      setOverview(o)
      setActivity(a)
      setQuiz(q)
      setFlashcards(f)
      setFcStatus(st)
      setAttempts(qa)
      if (isAdmin) quizApi.getLeaderboard(10).then(setBoard).catch(() => {})
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

  // Trạng thái THẬT theo lần đánh giá mới nhất mỗi thẻ của user (backend /flashcards/my-status).
  const flashcardStatus = useMemo(() => {
    const remembered = fcStatus.filter((s) => s.remembered).length
    const notRemembered = fcStatus.filter((s) => !s.remembered).length
    const notReviewed = Math.max(0, flashcards.length - fcStatus.length)
    return [
      { name: 'Đã nhớ', value: remembered, color: GREEN },
      { name: 'Chưa nhớ', value: notRemembered, color: GOLD },
      { name: 'Chưa ôn', value: notReviewed, color: MUTED },
    ].filter((item) => item.value > 0)
  }, [fcStatus, flashcards.length])
  const hasReviewed = fcStatus.length > 0

  // Hoạt động học THẬT theo giai đoạn (backend: quiz đã trả lời + flashcard đã ôn).
  const topicData = useMemo(() => {
    const counts = new Map((quiz?.studyByPeriod ?? []).map((x) => [x.period, x.count]))
    return PERIODS.map((period) => ({ topic: period, value: counts.get(period) ?? 0 }))
      .sort((a, b) => b.value - a.value)
  }, [quiz])
  const hasTopicData = topicData.some((t) => t.value > 0)

  const kpis = isAdmin ? [
    { label: 'Tổng người dùng', value: overview?.totalUsers ?? 0, icon: Users },
    { label: 'Hoạt động 7 ngày', value: overview?.activeUsers7d ?? 0, icon: UserCheck },
    { label: 'Đoạn chat', value: sessions, icon: MessageSquare },
    { label: 'Quiz đã làm', value: totalAttempts, icon: PenLine },
    { label: 'Điểm trung bình', value: avgScore, icon: Star },
    { label: 'Flashcard đã ôn', value: flashcardReviews, icon: Layers },
  ] : [
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
            {hasReviewed ? (
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
            ) : (
              <div className="topic-empty muted">
                Chưa ôn thẻ ghi nhớ nào.<br />Vào mục "Thẻ ghi nhớ" và đánh giá để theo dõi tiến độ.
              </div>
            )}
          </article>

          <article className="analytics-card analytics-topic card">
            <div className="analytics-title">
              <h2>Chủ đề học nhiều nhất</h2>
              <span>Theo giai đoạn</span>
            </div>
            {hasTopicData ? (
              <ResponsiveContainer width="100%" height={285}>
                <BarChart data={topicData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis type="category" dataKey="topic" tickLine={false} axisLine={false} fontSize={12} width={46} />
                  <Tooltip />
                  <Bar dataKey="value" name="Lượt học" fill={RED} radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="topic-empty muted">
                Chưa có dữ liệu học tập.<br />Hãy làm quiz hoặc ôn thẻ ghi nhớ để xem giai đoạn bạn học nhiều nhất.
              </div>
            )}
          </article>

          {isAdmin && (
            <article className="analytics-card analytics-leaderboard card">
              <div className="analytics-title">
                <h2>Bảng xếp hạng</h2>
                <span>Top điểm cao</span>
              </div>
              <div className="lb-list">
                {board.length === 0 && <p className="muted lb-empty">Chưa có ai làm quiz.</p>}
                {board.map((e, i) => (
                  <div key={e.userId} className={'lb-row' + (i < 3 ? ' lb-top' : '')}>
                    <span className={'lb-rank lb-rank-' + (i + 1)}>{i + 1}</span>
                    <span className="lb-name">{e.displayName}</span>
                    <span className="lb-attempts muted">{e.attempts} lượt</span>
                    <span className="lb-score"><Star size={13} fill="#FFCD00" stroke="#FFCD00" /> {e.bestScore}</span>
                  </div>
                ))}
              </div>
            </article>
          )}
        </div>
      </div>
    </div>
  )
}
