import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpenText,
  ChartNoAxesCombined,
  History,
  Loader2,
  LockKeyhole,
  Mail,
  MessageSquareText,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { USE_MOCK } from '../api/client'
import GoogleLoginButton from '../components/GoogleLoginButton'
import './LoginPage.css'

export default function LoginPage() {
  const { login, register, loginWithGoogle } = useAuth()
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

  const handleGoogle = async (credential: string) => {
    setError('')
    setLoading(true)
    try {
      await loginWithGoogle(credential)
      navigate('/chat')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập Google thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <div className="login-hero">
        <div className="login-hero-inner">
          <div className="login-brand">
            <div className="login-brand-mark"><Sparkles size={26} /></div>
            <span>VNR History AI</span>
          </div>

          <div className="login-kicker">Trợ lý học tập thông minh</div>
          <h1>Ôn tập Lịch sử Đảng rõ ràng, mạch lạc hơn.</h1>
          <p className="login-period">Tập trung giai đoạn 1954 - 1975, kết hợp hỏi đáp AI, quiz và flashcards.</p>

          <ul className="login-features" aria-label="Tính năng chính">
            <li><MessageSquareText size={18} /> Hỏi đáp theo ngữ cảnh, lưu lại lịch sử trò chuyện</li>
            <li><BookOpenText size={18} /> Ôn tập bằng câu hỏi trắc nghiệm và thẻ ghi nhớ</li>
            <li><ChartNoAxesCombined size={18} /> Theo dõi tiến độ học tập qua dashboard trực quan</li>
          </ul>
        </div>
      </div>

      <div className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <div className="login-form-badge">
            <History size={16} />
            <span>Lịch sử Đảng Cộng sản Việt Nam</span>
          </div>

          <h2>{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h2>
          <p className="muted login-sub">
            {mode === 'login'
              ? 'Chào mừng bạn trở lại. Tiếp tục phiên ôn tập của bạn.'
              : 'Bắt đầu hành trình ôn tập với không gian học tập cá nhân.'}
          </p>

          {mode === 'register' && (
            <div className="field">
              <label className="label">Họ và tên</label>
              <div className="login-input-shell">
                <UserRound size={18} />
                <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nguyễn Văn A" />
              </div>
            </div>
          )}

          <div className="field">
            <label className="label">Tên đăng nhập</label>
            <div className="login-input-shell">
              <UserRound size={18} />
              <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" autoFocus />
            </div>
          </div>

          {mode === 'register' && (
            <div className="field">
              <label className="label">Email tùy chọn</label>
              <div className="login-input-shell">
                <Mail size={18} />
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@fpt.edu.vn" />
              </div>
            </div>
          )}

          <div className="field">
            <label className="label">Mật khẩu</label>
            <div className="login-input-shell">
              <LockKeyhole size={18} />
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nhập mật khẩu" />
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button className="btn btn-primary btn-block" disabled={loading} type="submit">
            {loading && <Loader2 size={18} className="spin" />}
            {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </button>

          <div className="login-divider"><span>hoặc</span></div>
          <div className="login-google"><GoogleLoginButton onCredential={handleGoogle} /></div>

          <div className="login-switch">
            {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
              {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </div>

          {USE_MOCK && (
            <div className="login-demo">
              <Sparkles size={16} />
              <span>Chế độ <b>demo</b>: nhập tài khoản bất kỳ để vào. Dùng tên <b>admin</b> để xem quyền quản trị.</span>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
