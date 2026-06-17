import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'
import QuizPage from './pages/QuizPage'
import FlashcardsPage from './pages/FlashcardsPage'
import DashboardPage from './pages/DashboardPage'
import ManagePage from './pages/ManagePage'

export default function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center' }}>
        <div className="muted">Đang tải…</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/flashcards" element={<FlashcardsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/manage" element={<ManagePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  )
}
