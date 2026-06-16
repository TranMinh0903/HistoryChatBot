import axios from 'axios'

// Nếu chưa cấu hình backend → tự động chạy MOCK MODE (localStorage).
export const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !API_BASE

export const http = axios.create({ baseURL: API_BASE })

const TOKEN_KEY = 'lsd_token'
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY)

http.interceptors.request.use((cfg) => {
  const t = getToken()
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

// ----- helpers dùng chung cho mock -----
export const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))
export const uid = () => (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2))

export function lsGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}
export function lsSet(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}
