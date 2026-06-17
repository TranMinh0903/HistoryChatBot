import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts'
import { Users, UserCheck, MessageSquare, MessagesSquare, Gamepad2, Trophy, Layers, Star, Medal } from 'lucide-react'
import type { StatsOverview, StatsActivity, StatsQuiz, LeaderboardEntry } from '../types'
import * as statsApi from '../api/stats'
import * as quizApi from '../api/quiz'
import { useAuth } from '../context/AuthContext'
import './DashboardPage.css'

const RED = '#DA251D'
const GOLD = '#FFB300'

export default function DashboardPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 2

  const [overview, setOverview] = useState<StatsOverview | null>(null)
  const [activity, setActivity] = useState<StatsActivity | null>(null)
  const [quiz, setQuiz] = useState<StatsQuiz | null>(null)
  const [board, setBoard] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    void (async () => {
      const [o, a, q] = await Promise.all([
        statsApi.getOverview(), statsApi.getActivity(30), statsApi.getQuizStats(),
      ])
      setOverview(o); setActivity(a); setQuiz(q)
      if (isAdmin) quizApi.getLeaderboard(5).then(setBoard).catch(() => {})
    })()
  }, [isAdmin])

  const cards = !overview ? [] : isAdmin ? [
    { label: 'Người dùng', value: overview.totalUsers, icon: Users, tone: 'red' },
    { label: 'Hoạt động 7 ngày', value: overview.activeUsers7d, icon: UserCheck, tone: 'gold' },
    { label: 'Đoạn chat', value: overview.totalSessions, icon: MessageSquare, tone: 'red' },
    { label: 'Tin nhắn', value: overview.totalUserMessages, icon: MessagesSquare, tone: 'gold' },
    { label: 'Lượt làm quiz', value: overview.totalQuizAttempts, icon: Gamepad2, tone: 'red' },
    { label: 'Điểm TB quiz', value: overview.avgQuizScore.toFixed(1), icon: Trophy, tone: 'gold' },
    { label: 'Lượt ôn thẻ', value: overview.totalFlashcardReviews, icon: Layers, tone: 'red' },
  ] : [
    { label: 'Đoạn chat của tôi', value: overview.totalSessions, icon: MessageSquare, tone: 'red' },
    { label: 'Tin nhắn của tôi', value: overview.totalUserMessages, icon: MessagesSquare, tone: 'gold' },
    { label: 'Lượt làm quiz', value: overview.totalQuizAttempts, icon: Gamepad2, tone: 'red' },
    { label: 'Điểm TB', value: overview.avgQuizScore.toFixed(1), icon: Trophy, tone: 'gold' },
    { label: 'Điểm cao nhất', value: quiz?.bestScore ?? 0, icon: Medal, tone: 'red' },
    { label: 'Thẻ đã ôn', value: overview.totalFlashcardReviews, icon: Layers, tone: 'gold' },
  ]

  const shortDay = (d: string) => d.slice(5) // MM-DD

  return (
    <div className="page">
      <div className="page-head">
        <h1>{isAdmin ? 'Bảng thống kê (Quản trị)' : 'Thống kê của tôi'}</h1>
        <p>{isAdmin ? 'Tổng quan số liệu người dùng & hoạt động toàn hệ thống' : 'Theo dõi hoạt động học tập của bạn'}</p>
      </div>
      <div className="page-body">
        {/* Stat cards */}
        <div className="dash-cards">
          {cards.map((c) => (
            <div key={c.label} className="dash-card card fade-in">
              <div className={'dash-card-icon tone-' + c.tone}><c.icon size={22} /></div>
              <div>
                <div className="dash-card-value">{c.value}</div>
                <div className="dash-card-label">{c.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="dash-grid">
          {/* Messages per day */}
          <div className="card card-pad dash-chart">
            <h3>{isAdmin ? 'Tin nhắn theo ngày (30 ngày)' : 'Tin nhắn của tôi (30 ngày)'}</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={activity?.messagesPerDay ?? []}>
                <defs>
                  <linearGradient id="gMsg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={RED} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={RED} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                <XAxis dataKey="day" tickFormatter={shortDay} fontSize={11} stroke="#aaa" interval={5} />
                <YAxis fontSize={11} stroke="#aaa" width={28} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" name="Tin nhắn" stroke={RED} strokeWidth={2} fill="url(#gMsg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* New users per day — chỉ Admin */}
          {isAdmin && (
            <div className="card card-pad dash-chart">
              <h3>Người dùng mới (30 ngày)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={activity?.newUsersPerDay ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                  <XAxis dataKey="day" tickFormatter={shortDay} fontSize={11} stroke="#aaa" interval={5} />
                  <YAxis fontSize={11} stroke="#aaa" width={28} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Người dùng mới" fill={GOLD} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Quiz score distribution */}
          <div className="card card-pad dash-chart">
            <h3>{isAdmin ? 'Phân bố điểm trắc nghiệm' : 'Phân bố điểm quiz của tôi'}</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={quiz?.scoreDistribution ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                <XAxis dataKey="bucket" fontSize={11} stroke="#aaa" />
                <YAxis fontSize={11} stroke="#aaa" width={28} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Số lượt" radius={[4, 4, 0, 0]}>
                  {(quiz?.scoreDistribution ?? []).map((_, i) => (
                    <Cell key={i} fill={i >= 3 ? '#2E7D32' : i >= 1 ? GOLD : RED} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Leaderboard — chỉ Admin */}
          {isAdmin && (
            <div className="card card-pad dash-chart">
              <h3>Bảng xếp hạng</h3>
              <div className="dash-board">
                {board.length === 0 && <p className="muted">Chưa có dữ liệu.</p>}
                {board.map((e, i) => (
                  <div key={e.userId} className="dash-board-row">
                    <span className={'dash-rank rank-' + (i + 1)}>{i + 1}</span>
                    <span className="dash-board-name">{e.displayName}</span>
                    <span className="dash-board-attempts muted">{e.attempts} lượt</span>
                    <span className="dash-board-score"><Star size={13} fill="#FFCD00" stroke="#FFCD00" /> {e.bestScore}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
