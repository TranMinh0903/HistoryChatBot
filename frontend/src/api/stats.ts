import type { StatsOverview, StatsActivity, StatsQuiz } from '../types'
import { USE_MOCK, http, delay } from './client'
import { MOCK_STATS_OVERVIEW, MOCK_STATS_ACTIVITY, MOCK_STATS_QUIZ } from '../mock/data'

export async function getOverview(): Promise<StatsOverview> {
  if (USE_MOCK) {
    await delay(200)
    return MOCK_STATS_OVERVIEW
  }
  const { data } = await http.get<StatsOverview>('/stats/overview')
  return data
}

export async function getActivity(days = 30): Promise<StatsActivity> {
  if (USE_MOCK) {
    await delay(220)
    return MOCK_STATS_ACTIVITY
  }
  const { data } = await http.get<StatsActivity>(`/stats/activity?days=${days}`)
  return data
}

export async function getQuizStats(): Promise<StatsQuiz> {
  if (USE_MOCK) {
    await delay(220)
    return MOCK_STATS_QUIZ
  }
  const { data } = await http.get<StatsQuiz>('/stats/quiz')
  return data
}
