import { NavLink, Outlet } from 'react-router-dom'
import { MessageSquare, Gamepad2, Layers, BarChart3, LogOut, Star, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import UserMenu from './UserMenu'
import './Layout.css'

const NAV = [
  { to: '/chat', label: 'Trò chuyện', icon: MessageSquare },
  { to: '/quiz', label: 'Trắc nghiệm', icon: Gamepad2 },
  { to: '/flashcards', label: 'Thẻ ghi nhớ', icon: Layers },
  { to: '/dashboard', label: 'Thống kê', icon: BarChart3 },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navItems = user?.role === 2
    ? [...NAV, { to: '/manage', label: 'Quản lý', icon: Settings }]
    : NAV

  return (
    <div className="layout">
      <aside className="nav">
        <div className="nav-brand">
          <div className="nav-logo"><Star size={20} fill="#FFCD00" stroke="#FFCD00" /></div>
          <div className="nav-brand-text">
            <strong>Sử Đảng</strong>
            <span>1954 – 1975</span>
          </div>
        </div>

        <nav className="nav-links">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="nav-foot">
          <div className="nav-user">
            <div className="nav-avatar">{(user?.displayName ?? 'U').charAt(0).toUpperCase()}</div>
            <div className="nav-user-text">
              <strong>{user?.displayName}</strong>
              <span>{user?.role === 2 ? 'Quản trị' : 'Sinh viên'}</span>
            </div>
          </div>
          <button className="nav-logout" onClick={logout} title="Đăng xuất">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="content">
        <UserMenu />
        <Outlet />
      </main>
    </div>
  )
}
