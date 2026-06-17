import type { Flashcard, FlashcardInput } from '../types'
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
