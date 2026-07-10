import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '../types'
import * as authApi from '../api/auth'
import { getToken, setToken } from '../api/client'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  loginWithGoogle: (credential: string) => Promise<void>
  register: (username: string, password: string, displayName: string, email?: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => Boolean(getToken()))

  useEffect(() => {
    if (!getToken()) return
    authApi.me()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (username: string, password: string) => {
    const res = await authApi.login(username, password)
    setToken(res.token)
    setUser(res.user)
  }

  const loginWithGoogle = async (credential: string) => {
    const res = await authApi.googleLogin(credential)
    setToken(res.token)
    setUser(res.user)
  }

  const register = async (username: string, password: string, displayName: string, email?: string) => {
    const res = await authApi.register(username, password, displayName, email)
    setToken(res.token)
    setUser(res.user)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
