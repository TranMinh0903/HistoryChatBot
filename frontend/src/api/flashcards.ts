import type { Flashcard, FlashcardInput, FlashcardStatus } from '../types'
import { USE_MOCK, http, delay } from './client'
import { FLASHCARDS } from '../mock/data'

export async function getFlashcards(): Promise<Flashcard[]> {
  if (USE_MOCK) {
    await delay(180)
    return FLASHCARDS
  }
  const { data } = await http.get<Flashcard[]>('/flashcards')
  return data
}

// Trạng thái ghi nhớ thật của user (mỗi thẻ = lần đánh giá mới nhất). Thẻ chưa ôn sẽ không có trong list.
export async function getMyStatus(): Promise<FlashcardStatus[]> {
  if (USE_MOCK) {
    await delay(80)
    return FLASHCARDS.map((f, i) => ({ flashcardId: f.id, remembered: i % 3 !== 0 }))
  }
  const { data } = await http.get<FlashcardStatus[]>('/flashcards/my-status')
  return data
}

export async function reviewFlashcard(id: string, remembered: boolean): Promise<void> {
  if (USE_MOCK) {
    await delay(60)
    return
  }
  await http.post(`/flashcards/${id}/review`, { remembered })
}

// ----- Quản lý flashcards (Admin) -----
export async function createFlashcard(input: FlashcardInput): Promise<void> {
  if (USE_MOCK) { await delay(100); return }
  await http.post('/flashcards', input)
}

export async function updateFlashcard(id: string, input: FlashcardInput): Promise<void> {
  if (USE_MOCK) { await delay(100); return }
  await http.put(`/flashcards/${id}`, input)
}

export async function deleteFlashcard(id: string): Promise<void> {
  if (USE_MOCK) { await delay(100); return }
  await http.delete(`/flashcards/${id}`)
}
