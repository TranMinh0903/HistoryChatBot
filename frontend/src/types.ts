// ===== Domain types khớp với docs/API.md =====

export type Role = 1 | 2 // 1=User, 2=Admin

export interface User {
  id: string
  username: string
  displayName: string
  email?: string
  role: Role
}

export interface AuthResponse {
  token: string
  user: User
}

// ----- Chat -----
export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
  tokenCount?: number
}

export interface SendMessageResponse {
  userMessage: ChatMessage
  assistantMessage: ChatMessage
}

// ----- Quiz -----
export type Option = 'A' | 'B' | 'C' | 'D'

export interface QuizQuestion {
  id: string
  question: string
  options: Record<Option, string>
  difficulty: number // 1=Dễ 2=TB 3=Khó
  topic?: string
  period?: string
}

export interface QuizAnswer {
  questionId: string
  selectedOption: Option | null
}

export interface QuizResultItem {
  questionId: string
  selectedOption: Option | null
  correctOption: Option
  isCorrect: boolean
  explanation?: string
}

export interface QuizResult {
  attemptId: string
  totalQuestions: number
  correctCount: number
  score: number
  durationSeconds: number
  results: QuizResultItem[]
}

export interface QuizAttemptSummary {
  id: string
  score: number
  correctCount: number
  totalQuestions: number
  finishedAt: string
}

export interface LeaderboardEntry {
  userId: string
  displayName: string
  bestScore: number
  attempts: number
}

// ----- Quiz admin (quản lý nội dung) -----
export interface QuizQuestionAdmin {
  id: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: Option
  explanation?: string
  difficulty: number
  topic?: string
  period?: string
}

export interface QuizQuestionInput {
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: Option
  explanation?: string
  difficulty: number
  topic?: string
  period?: string
}

// ----- Flashcards -----
export interface Flashcard {
  id: string
  front: string
  back: string
  topic?: string
  period?: string
}

export interface FlashcardInput {
  front: string
  back: string
  topic?: string
  period?: string
}

// ----- Stats -----
export interface StatsOverview {
  totalUsers: number
  activeUsers7d: number
  totalSessions: number
  totalUserMessages: number
  totalQuizAttempts: number
  avgQuizScore: number
  totalFlashcardReviews: number
}

export interface DayCount { day: string; count: number }

export interface StatsActivity {
  messagesPerDay: DayCount[]
  newUsersPerDay: DayCount[]
}

export interface StatsQuiz {
  scoreDistribution: { bucket: string; count: number }[]
  attemptsPerDay: DayCount[]
  avgScore: number
  bestScore: number
}
