import type { AuthResponse, User } from '../types'
import { USE_MOCK, http, delay, uid, lsGet, lsSet } from './client'

const USER_KEY = 'lsd_user'

export async function login(username: string, password: string): Promise<AuthResponse> {
  if (USE_MOCK) {
    await delay()
    if (!username || !password) throw new Error('Vui lòng nhập tài khoản và mật khẩu')
    const user: User = {
      id: lsGet<User | null>(USER_KEY, null)?.id ?? uid(),
      username,
      displayName: username,
      role: username.toLowerCase() === 'admin' ? 2 : 1,
    }
    lsSet(USER_KEY, user)
    return { token: 'mock-token', user }
  }
  const { data } = await http.post<AuthResponse>('/auth/login', { username, password })
  return data
}

export async function register(
  username: string, password: string, displayName: string, email?: string,
): Promise<AuthResponse> {
  if (USE_MOCK) {
    await delay()
    const user: User = { id: uid(), username, displayName: displayName || username, email, role: 1 }
    lsSet(USER_KEY, user)
    return { token: 'mock-token', user }
  }
  const { data } = await http.post<AuthResponse>('/auth/register', { username, password, displayName, email })
  return data
}

export async function googleLogin(credential: string): Promise<AuthResponse> {
  if (USE_MOCK) {
    await delay()
    const user: User = { id: uid(), username: 'google_user', displayName: 'Google User', role: 1 }
    lsSet(USER_KEY, user)
    return { token: 'mock-token', user }
  }
  const { data } = await http.post<AuthResponse>('/auth/google', { credential })
  return data
}

export async function me(): Promise<User> {
  if (USE_MOCK) {
    await delay(120)
    const user = lsGet<User | null>(USER_KEY, null)
    if (!user) throw new Error('Chưa đăng nhập')
    return user
  }
  const { data } = await http.get<User>('/auth/me')
  return data
}
