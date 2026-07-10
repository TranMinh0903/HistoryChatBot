import type { User, UserAdmin } from '../types'
import { USE_MOCK, http, delay, lsGet, lsSet } from './client'

const USER_KEY = 'lsd_user'
const USERS_KEY = 'lsd_admin_users'

function mockUsers(): UserAdmin[] {
  const current = lsGet<User | null>(USER_KEY, null)
  const saved = lsGet<UserAdmin[] | null>(USERS_KEY, null)
  const map = (seed: number) => Array.from({ length: 14 }, (_, i) => (seed + i * 2) % 5)
  if (saved) {
    return saved.map((user, index) => ({
      ...user,
      totalVisits: user.totalVisits ?? Math.max(1, Math.ceil((user.chatSessions + user.quizAttempts + user.flashcardReviews) / 3)),
      webUses: user.webUses ?? (user.chatSessions + user.quizAttempts + user.flashcardReviews),
      activityMap: user.activityMap ?? map(index + 1),
    }))
  }

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
      totalVisits: 36,
      webUses: 104,
      activityMap: map(4),
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
      totalVisits: 18,
      webUses: 58,
      activityMap: map(2),
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
      totalVisits: 9,
      webUses: 29,
      activityMap: map(1),
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

export async function deleteUser(id: string): Promise<void> {
  if (USE_MOCK) {
    await delay(100)
    lsSet(USERS_KEY, mockUsers().filter((user) => user.id !== id))
    return
  }
  await http.delete(`/users/${id}`)
}
