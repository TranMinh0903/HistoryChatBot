import type { Flashcard } from '../types'
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
