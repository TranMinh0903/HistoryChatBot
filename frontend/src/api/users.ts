import type { User, UserAdmin, Role } from '../types'
import { USE_MOCK, http, delay, lsGet, lsSet } from './client'

const USER_KEY = 'lsd_user'
const USERS_KEY = 'lsd_admin_users'

function mockUsers(): UserAdmin[] {
  const current = lsGet<User | null>(USER_KEY, null)
  const saved = lsGet<UserAdmin[] | null>(USERS_KEY, null)
  if (saved) return saved

  const now = new Date()
  const daysAgo = (days: number) => new Date(now.getTime() - days * 86400000).toISOString()
  const base: UserAdmin[] = [
    {
      id: current?.id ?? 'admin',
      username: current?.username ?? 'admin',
      displayName: current?.displayName ?? 'Quản trị viên',
      email: current?.email,
      role: current?.role ?? 2,
      avatarUrl: current?.avatarUrl,
      createdAt: daysAgo(28),
      lastLoginAt: now.toISOString(),
      chatSessions: 18,
      quizAttempts: 12,
      avgQuizScore: 86,
      flashcardReviews: 74,
    },
    {
      id: 'student-1',
      username: 'minhan',
      displayName: 'Nguyễn Minh An',
      email: 'minhan@fpt.edu.vn',
      role: 1,
      createdAt: daysAgo(18),
      lastLoginAt: daysAgo(1),
      chatSessions: 9,
      quizAttempts: 7,
      avgQuizScore: 78,
      flashcardReviews: 42,
    },
    {
      id: 'student-2',
      username: 'thubinh',
      displayName: 'Trần Thu Bình',
      email: 'thubinh@fpt.edu.vn',
      role: 1,
      createdAt: daysAgo(11),
      lastLoginAt: daysAgo(4),
      chatSessions: 5,
      quizAttempts: 3,
      avgQuizScore: 64,
      flashcardReviews: 21,
    },
  ]
  lsSet(USERS_KEY, base)
  return base
}

// Cập nhật avatar — nhận data URL ảnh đã nén, trả về user đã cập nhật.
export async function updateAvatar(dataUrl: string): Promise<User> {
  if (USE_MOCK) {
    await delay(120)
    const user = { ...lsGet<User>(USER_KEY, {} as User), avatarUrl: dataUrl }
    lsSet(USER_KEY, user)
    return user
  }
  const { data } = await http.post<User>('/users/avatar', { dataUrl })
  return data
}

export async function removeAvatar(): Promise<User> {
  if (USE_MOCK) {
    await delay(80)
    const user = { ...lsGet<User>(USER_KEY, {} as User), avatarUrl: undefined }
    lsSet(USER_KEY, user)
    return user
  }
  const { data } = await http.delete<User>('/users/avatar')
  return data
}

export async function getUsersAdmin(): Promise<UserAdmin[]> {
  if (USE_MOCK) {
    await delay(160)
    return mockUsers()
  }
  const { data } = await http.get<UserAdmin[]>('/users/manage')
  return data
}

export async function updateUserRole(id: string, role: Role): Promise<User> {
  if (USE_MOCK) {
    await delay(120)
    const users = mockUsers().map((user) => (user.id === id ? { ...user, role } : user))
    lsSet(USERS_KEY, users)
    const updated = users.find((user) => user.id === id)!
    return updated
  }
  const { data } = await http.patch<User>(`/users/${id}/role`, { role })
  return data
}

export async function deleteUser(id: string): Promise<void> {
  if (USE_MOCK) {
    await delay(100)
    lsSet(USERS_KEY, mockUsers().filter((user) => user.id !== id))
    return
  }
  await http.delete(`/users/${id}`)
}
