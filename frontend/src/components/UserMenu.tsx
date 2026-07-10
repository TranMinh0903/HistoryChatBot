import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import {
  Award,
  BarChart3,
  Camera,
  Check,
  ChevronRight,
  Loader2,
  LogOut,
  Moon,
  Settings,
  Shield,
  Sun,
  Trash2,
  Upload,
  UserRound,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import * as statsApi from '../api/stats'
import * as flashcardsApi from '../api/flashcards'
import * as usersApi from '../api/users'
import { resizeImageFile } from '../utils/image'
import type { StatsOverview, StatsQuiz } from '../types'
import './UserMenu.css'

const DEFAULT_AVATARS = ['#B22222', '#7f1117', '#C59A3A', '#2F5D50', '#4A5568']
const profileKey = (userId?: string) => `lsd_profile_${userId ?? 'guest'}`

interface ProfilePrefs {
  avatarColor?: string
  joinedAt?: string
}

interface LearningStats {
  overview?: StatsOverview
  quiz?: StatsQuiz
  flashcards: number
}

export default function UserMenu() {
  const { user, logout, setUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [prefs, setPrefs] = useState<ProfilePrefs>({})
  const [learning, setLearning] = useState<LearningStats>({ flashcards: 0 })
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const initials = useMemo(() => {
    const name = user?.displayName || user?.username || 'U'
    return name.trim().charAt(0).toUpperCase()
  }, [user])

  useEffect(() => {
    if (!user) return
    const raw = localStorage.getItem(profileKey(user.id))
    const parsed = raw ? JSON.parse(raw) as ProfilePrefs : {}
    const next: ProfilePrefs = {
      joinedAt: parsed.joinedAt ?? new Date().toISOString(),
      avatarColor: parsed.avatarColor ?? DEFAULT_AVATARS[0],
    }
    setPrefs(next)
    localStorage.setItem(profileKey(user.id), JSON.stringify(next))
  }, [user])

  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [open])

  useEffect(() => {
    if (!profileOpen) return
    void Promise.allSettled([
      statsApi.getOverview(),
      statsApi.getQuizStats(),
      flashcardsApi.getFlashcards(),
    ]).then(([overview, quiz, flashcards]) => {
      setLearning({
        overview: overview.status === 'fulfilled' ? overview.value : undefined,
        quiz: quiz.status === 'fulfilled' ? quiz.value : undefined,
        flashcards: flashcards.status === 'fulfilled' ? flashcards.value.length : 0,
      })
    })
  }, [profileOpen])

  if (!user) return null

  const color = prefs.avatarColor ?? DEFAULT_AVATARS[0]
  const role = user.role === 2 ? 'Admin' : 'Sinh viên'
  const joined = new Date(prefs.joinedAt ?? new Date()).toLocaleDateString('vi-VN')
  const averageScore = Math.round(learning.quiz?.avgScore ?? learning.overview?.avgQuizScore ?? 0)
  const streak = calculateStreak()

  // Avatar dùng chung: ảnh thật từ backend (user.avatarUrl) hoặc chữ cái trên nền màu
  const renderAvatar = () =>
    user.avatarUrl
      ? <img src={user.avatarUrl} alt="Avatar" referrerPolicy="no-referrer" />
      : <span style={{ backgroundColor: color }}>{initials}</span>

  function openProfile() {
    setError('')
    setSaved(false)
    setOpen(false)
    setProfileOpen(true)
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const dataUrl = await resizeImageFile(file, 256, 0.82) // nén ~256px trước khi lưu
      const updated = await usersApi.updateAvatar(dataUrl)
      setUser(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tải ảnh thất bại')
    } finally {
      setUploading(false)
    }
  }

  async function handleRemoveAvatar() {
    setError('')
    setUploading(true)
    try {
      setUser(await usersApi.removeAvatar())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xóa ảnh thất bại')
    } finally {
      setUploading(false)
    }
  }

  function pickColor(next: string) {
    const updated = { ...prefs, avatarColor: next }
    setPrefs(updated)
    localStorage.setItem(profileKey(user?.id), JSON.stringify(updated))
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1400)
  }

  function calculateStreak() {
    const days = learning.quiz?.attemptsPerDay ?? []
    if (!days.length) return 0
    let total = 0
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) total += 1
      else if (total > 0) break
    }
    return total
  }

  return (
    <div className="user-menu-wrap" ref={menuRef}>
      <button className="account-trigger" onClick={() => setOpen((v) => !v)} aria-label="Mở menu người dùng">
        {renderAvatar()}
      </button>

      {open && (
        <div className="user-menu fade-in">
          <div className="user-menu-head">
            <div className="user-menu-avatar">{renderAvatar()}</div>
            <div>
              <strong>{user.displayName || user.username}</strong>
              <span>{role}</span>
            </div>
          </div>
          <div className="user-menu-sep" />
          <button onClick={openProfile}><UserRound size={17} /> Hồ sơ <ChevronRight size={16} /></button>
          <button onClick={openProfile}><Settings size={17} /> Cài đặt <ChevronRight size={16} /></button>
          <button onClick={openProfile}><Award size={17} /> Thành tích <ChevronRight size={16} /></button>
          <div className="theme-menu-row">
            <div className="theme-menu-label">
              <Moon size={17} />
              <div>
                <strong>Giao diện</strong>
                <span>{theme === 'dark' ? 'Chế độ tối' : 'Chế độ sáng'}</span>
              </div>
            </div>
            <div className="theme-switch" role="group" aria-label="Chọn giao diện">
              <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')} aria-label="Chế độ sáng">
                <Sun size={14} />
              </button>
              <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')} aria-label="Chế độ tối">
                <Moon size={14} />
              </button>
            </div>
          </div>
          <div className="user-menu-sep" />
          <button className="danger" onClick={logout}><LogOut size={17} /> Đăng xuất</button>
        </div>
      )}

      {profileOpen && (
        <div className="profile-overlay" onClick={() => setProfileOpen(false)}>
          <section className="profile-dialog" onClick={(e) => e.stopPropagation()}>
            <header className="profile-head">
              <div>
                <span>Hồ sơ cá nhân</span>
                <h2>{user.displayName || user.username}</h2>
              </div>
              <button className="profile-icon-btn" onClick={() => setProfileOpen(false)} aria-label="Đóng">
                <X size={18} />
              </button>
            </header>

            <div className="profile-main">
              <div className="profile-avatar-panel">
                <div className="profile-avatar" style={user.avatarUrl ? undefined : { backgroundColor: color }}>
                  {user.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" referrerPolicy="no-referrer" /> : <span>{initials}</span>}
                  {uploading && <div className="profile-avatar-loading"><Loader2 size={22} className="spin" /></div>}
                </div>
                <div className="profile-avatar-buttons">
                  <label className="profile-upload">
                    <Upload size={16} />
                    Upload ảnh
                    <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
                  </label>
                  {user.avatarUrl && (
                    <button className="profile-remove" onClick={handleRemoveAvatar} disabled={uploading}>
                      <Trash2 size={15} /> Xóa ảnh
                    </button>
                  )}
                </div>
                <div className="profile-avatar-options" aria-label="Màu nền khi không có ảnh">
                  {DEFAULT_AVATARS.map((c) => (
                    <button
                      key={c}
                      className={color === c && !user.avatarUrl ? 'selected' : ''}
                      style={{ backgroundColor: c }}
                      onClick={() => pickColor(c)}
                      aria-label="Chọn màu nền avatar"
                    >
                      {color === c && !user.avatarUrl ? <Check size={13} /> : null}
                    </button>
                  ))}
                </div>
                {error
                  ? <p className="profile-avatar-error">{error}</p>
                  : <p>Ảnh tự nén ~256px và lưu vào tài khoản (mọi thiết bị đều thấy).</p>}
              </div>

              <div className="profile-info">
                <div className="profile-field">
                  <label>Họ tên</label>
                  <div>{user.displayName || 'Chưa cập nhật'}</div>
                </div>
                <div className="profile-field">
                  <label>Email</label>
                  <div>{user.email || user.username || 'Chưa cập nhật'}</div>
                </div>
                <div className="profile-field">
                  <label>Vai trò</label>
                  <div><Shield size={15} /> {role}</div>
                </div>
                <div className="profile-field">
                  <label>Ngày tham gia</label>
                  <div>{joined}</div>
                </div>
              </div>
            </div>

            <div className="profile-stats">
              <ProfileStat label="Tổng cuộc trò chuyện" value={learning.overview?.totalSessions ?? 0} icon={<UserRound size={17} />} />
              <ProfileStat label="Tổng quiz đã làm" value={learning.overview?.totalQuizAttempts ?? 0} icon={<BarChart3 size={17} />} />
              <ProfileStat label="Tổng flashcards" value={learning.flashcards} icon={<Camera size={17} />} />
              <ProfileStat label="Điểm TB quiz" value={`${averageScore}%`} icon={<Award size={17} />} />
              <ProfileStat label="Streak học tập" value={`${streak} ngày`} icon={<Check size={17} />} />
            </div>

            <footer className="profile-actions">
              {saved && <span className="profile-saved"><Check size={15} /> Đã lưu</span>}
              <button className="btn btn-ghost" onClick={logout}><LogOut size={16} /> Đăng xuất</button>
              <button className="btn btn-primary" onClick={() => setProfileOpen(false)}>Đóng</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  )
}

function ProfileStat({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return (
    <div className="profile-stat">
      <div>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
