import type { User } from '../types'
import { USE_MOCK, http, delay, lsGet, lsSet } from './client'

const USER_KEY = 'lsd_user'

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
