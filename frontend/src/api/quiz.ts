import type {
  QuizQuestion, QuizAnswer, QuizResult, QuizAttemptSummary, LeaderboardEntry,
  QuizQuestionAdmin, QuizQuestionInput,
} from '../types'
import { USE_MOCK, http, delay, uid, lsGet, lsSet } from './client'
import { QUIZ_QUESTIONS } from '../mock/data'

const ATTEMPTS_KEY = 'lsd_attempts'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function getQuestions(count = 10): Promise<QuizQuestion[]> {
  if (USE_MOCK) {
    await delay(200)
    return shuffle(QUIZ_QUESTIONS).slice(0, count).map((q) => ({
      id: q.id, question: q.question, options: q.options,
      difficulty: q.difficulty, topic: q.topic, period: q.period,
    }))
  }
  const { data } = await http.get<QuizQuestion[]>(`/quiz/questions?count=${count}`)
  return data
}

export async function submitAttempt(
  answers: QuizAnswer[], startedAt: string,
): Promise<QuizResult> {
  if (USE_MOCK) {
    await delay(300)
    const results = answers.map((a) => {
      const q = QUIZ_QUESTIONS.find((x) => x.id === a.questionId)!
      const isCorrect = a.selectedOption === q.correctOption
      return {
        questionId: a.questionId, selectedOption: a.selectedOption,
        correctOption: q.correctOption, isCorrect, explanation: q.explanation,
      }
    })
    const correctCount = results.filter((r) => r.isCorrect).length
    const total = answers.length
    const score = Math.round((correctCount / Math.max(1, total)) * 100)
    const durationSeconds = Math.max(1, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000))
    const attempt: QuizResult = {
      attemptId: uid(), totalQuestions: total, correctCount, score, durationSeconds, results,
    }
    // lưu lịch sử
    const summary: QuizAttemptSummary = {
      id: attempt.attemptId, score, correctCount, totalQuestions: total,
      finishedAt: new Date().toISOString(),
    }
    lsSet(ATTEMPTS_KEY, [summary, ...lsGet<QuizAttemptSummary[]>(ATTEMPTS_KEY, [])])
    return attempt
  }
  const { data } = await http.post<QuizResult>('/quiz/attempts', { answers, startedAt })
  return data
}

export async function getAttempts(): Promise<QuizAttemptSummary[]> {
  if (USE_MOCK) {
    await delay(120)
    return lsGet<QuizAttemptSummary[]>(ATTEMPTS_KEY, [])
  }
  const { data } = await http.get<QuizAttemptSummary[]>('/quiz/attempts')
  return data
}

export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  if (USE_MOCK) {
    await delay(120)
    const mine = lsGet<QuizAttemptSummary[]>(ATTEMPTS_KEY, [])
    const myBest = mine.reduce((m, a) => Math.max(m, a.score), 0)
    const demo: LeaderboardEntry[] = [
      { userId: '1', displayName: 'Nguyễn Văn An', bestScore: 100, attempts: 7 },
      { userId: '2', displayName: 'Trần Thị Bình', bestScore: 90, attempts: 5 },
      { userId: '3', displayName: 'Lê Hoàng Cường', bestScore: 80, attempts: 4 },
    ]
    if (mine.length) demo.push({ userId: 'me', displayName: 'Bạn', bestScore: myBest, attempts: mine.length })
    return demo.sort((a, b) => b.bestScore - a.bestScore).slice(0, limit)
  }
  const { data } = await http.get<LeaderboardEntry[]>(`/quiz/leaderboard?limit=${limit}`)
  return data
}

// Lượt làm quiz gần đây của toàn hệ thống (Admin) — cho dashboard Get All.
export async function getAllAttempts(limit = 20): Promise<QuizAttemptSummary[]> {
  if (USE_MOCK) {
    await delay(120)
    return lsGet<QuizAttemptSummary[]>(ATTEMPTS_KEY, [])
  }
  const { data } = await http.get<QuizAttemptSummary[]>(`/quiz/attempts/all?limit=${limit}`)
  return data
}

// ----- Quản lý câu hỏi (Admin) -----
export async function getQuestionsAdmin(): Promise<QuizQuestionAdmin[]> {
  if (USE_MOCK) {
    await delay(150)
    return QUIZ_QUESTIONS.map((q) => ({
      id: q.id, question: q.question,
      optionA: q.options.A, optionB: q.options.B, optionC: q.options.C, optionD: q.options.D,
      correctOption: q.correctOption, explanation: q.explanation,
      difficulty: q.difficulty, topic: q.topic, period: q.period,
    }))
  }
  const { data } = await http.get<QuizQuestionAdmin[]>('/quiz/questions/manage')
  return data
}

export async function createQuestion(input: QuizQuestionInput): Promise<void> {
  if (USE_MOCK) { await delay(100); return }
  await http.post('/quiz/questions', input)
}

export async function updateQuestion(id: string, input: QuizQuestionInput): Promise<void> {
  if (USE_MOCK) { await delay(100); return }
  await http.put(`/quiz/questions/${id}`, input)
}

export async function deleteQuestion(id: string): Promise<void> {
  if (USE_MOCK) { await delay(100); return }
  await http.delete(`/quiz/questions/${id}`)
}

// AI tự sinh câu hỏi theo chủ đề → trả về các câu vừa tạo.
export async function generateQuestions(topic: string, count: number, difficulty: number): Promise<QuizQuestionAdmin[]> {
  if (USE_MOCK) { await delay(600); return [] }
  const { data } = await http.post<QuizQuestionAdmin[]>('/quiz/questions/generate', { topic, count, difficulty })
  return data
}
