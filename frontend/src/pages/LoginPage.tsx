import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { USE_MOCK } from '../api/client'
import './LoginPage.css'

export default function LoginPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') await login(username.trim(), password)
      else await register(username.trim(), password, displayName.trim(), email.trim() || undefined)
      navigate('/chat')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <div className="login-hero">
        <div className="login-hero-inner">
          <div className="login-star"><Star size={40} fill="#FFCD00" stroke="#FFCD00" /></div>
          <h1>ChatBot Lịch sử Đảng</h1>
          <p className="login-period">Cộng sản Việt Nam · Giai đoạn 1954 – 1975</p>
          <ul className="login-features">
            <li>💬 Trò chuyện, hỏi đáp về các sự kiện lịch sử</li>
            <li>🎮 Ôn tập bằng trắc nghiệm &amp; thẻ ghi nhớ</li>
            <li>📊 Theo dõi tiến độ học tập</li>
          </ul>
        </div>
      </div>

      <div className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <h2>{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h2>
          <p className="muted login-sub">
            {mode === 'login' ? 'Chào mừng bạn trở lại!' : 'Bắt đầu hành trình ôn tập lịch sử'}
          </p>

          {mode === 'register' && (
            <div className="field">
              <label className="label">Họ và tên</label>
              <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nguyễn Văn A" />
            </div>
          )}

          <div className="field">
            <label className="label">Tên đăng nhập</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" autoFocus />
          </div>

          {mode === 'register' && (
            <div className="field">
              <label className="label">Email (tùy chọn)</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@fpt.edu.vn" />
            </div>
          )}

          <div className="field">
            <label className="label">Mật khẩu</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button className="btn btn-primary btn-block" disabled={loading} type="submit">
            {loading && <Loader2 size={18} className="spin" />}
            {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </button>

          <div className="login-switch">
            {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
              {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </div>

          {USE_MOCK && (
            <div className="login-demo">
              ⚙️ Chế độ <b>demo</b> (chưa kết nối backend). Nhập tài khoản bất kỳ để vào.
              Dùng tên <b>admin</b> để xem quyền quản trị.
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
