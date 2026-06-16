# REST API Contract

> Hợp đồng API giữa **frontend (React)** và **backend (ASP.NET Core)**.
> Base URL (dev): `http://localhost:5000/api`
> Auth: `Authorization: Bearer <JWT>` cho tất cả endpoint trừ `register`/`login`.
> Response bọc theo dạng: `{ "success": bool, "data": ..., "error": string|null }` (gợi ý, backend tự quyết).

## Quy ước chung
- Thời gian: ISO-8601 UTC (`2026-06-17T08:31:00Z`).
- Lỗi: HTTP status phù hợp (400/401/403/404/409/500) + body `{ success:false, error:"..." }`.
- Phân trang (nếu cần): `?page=1&pageSize=20`.

---

## 1. Auth

### POST `/auth/register`
```jsonc
// req
{ "username": "minh", "email": "minh@fpt.edu.vn", "password": "...", "displayName": "Trần Minh" }
// res 200
{ "token": "<jwt>", "user": { "id": "...", "username": "minh", "displayName": "Trần Minh", "role": 1 } }
```

### POST `/auth/login`
```jsonc
// req
{ "username": "minh", "password": "..." }
// res 200
{ "token": "<jwt>", "user": { "id": "...", "username": "minh", "displayName": "Trần Minh", "role": 1 } }
```

### GET `/auth/me`
```jsonc
// res 200
{ "id": "...", "username": "minh", "displayName": "Trần Minh", "email": "...", "role": 1 }
```

---

## 2. Chat (tiêu chí 3)

### GET `/chat/sessions`
Danh sách đoạn chat của user hiện tại, mới nhất trước.
```jsonc
// res 200
[ { "id": "...", "title": "Chiến dịch Điện Biên Phủ", "createdAt": "...", "updatedAt": "..." } ]
```

### POST `/chat/sessions`
Tạo đoạn chat mới (rỗng).
```jsonc
// req (tuỳ chọn)
{ "title": "Đoạn chat mới" }
// res 201
{ "id": "...", "title": "Đoạn chat mới", "createdAt": "...", "updatedAt": "..." }
```

### GET `/chat/sessions/{id}/messages`
```jsonc
// res 200
[
  { "id": "...", "role": "user",      "content": "Chiến dịch Điện Biên Phủ năm nào?", "createdAt": "..." },
  { "id": "...", "role": "assistant", "content": "Chiến dịch Điện Biên Phủ ...",       "createdAt": "..." }
]
```

### POST `/chat/sessions/{id}/messages`
Gửi tin nhắn user → backend gọi **Groq** với toàn bộ lịch sử đoạn chat + system prompt → lưu cả 2 tin nhắn → trả tin nhắn assistant.
```jsonc
// req
{ "content": "Ý nghĩa của Hiệp định Genève 1954?" }
// res 200
{
  "userMessage":      { "id": "...", "role": "user",      "content": "...", "createdAt": "..." },
  "assistantMessage": { "id": "...", "role": "assistant", "content": "...", "createdAt": "...", "tokenCount": 320 }
}
```
> Gợi ý: nếu đây là tin nhắn đầu tiên, backend tự đặt `title` đoạn chat theo nội dung câu hỏi (cắt ~60 ký tự) và cập nhật `updatedAt`.
> Nâng cao (tuỳ chọn): hỗ trợ **streaming** qua `text/event-stream` để chữ hiện dần. MVP có thể trả 1 lần.

### PATCH `/chat/sessions/{id}`  — đổi tên
```jsonc
{ "title": "Tên mới" }   // res 200 session đã cập nhật
```

### DELETE `/chat/sessions/{id}`  — xoá đoạn chat → 204

---

## 3. Quiz (tiêu chí 4)

### GET `/quiz/questions?count=10&difficulty=&topic=`
Trả câu hỏi ngẫu nhiên. **Không** kèm đáp án đúng (chấm ở server).
```jsonc
// res 200
[
  {
    "id": "...", "question": "Hiệp định Genève được ký năm nào?",
    "options": { "A": "1954", "B": "1955", "C": "1956", "D": "1960" },
    "difficulty": 1, "topic": "1954–1960"
  }
]
```

### POST `/quiz/attempts`  — nộp bài, chấm điểm
```jsonc
// req
{
  "startedAt": "2026-06-17T08:20:00Z",
  "answers": [ { "questionId": "...", "selectedOption": "A" }, { "questionId": "...", "selectedOption": "C" } ]
}
// res 200
{
  "attemptId": "...", "totalQuestions": 10, "correctCount": 8, "score": 80, "durationSeconds": 95,
  "results": [
    { "questionId": "...", "selectedOption": "A", "correctOption": "A", "isCorrect": true,  "explanation": "..." },
    { "questionId": "...", "selectedOption": "C", "correctOption": "B", "isCorrect": false, "explanation": "..." }
  ]
}
```

### GET `/quiz/attempts`  — lịch sử làm bài của user
```jsonc
[ { "id":"...", "score":80, "correctCount":8, "totalQuestions":10, "finishedAt":"..." } ]
```

### GET `/quiz/leaderboard?limit=10`  — bảng xếp hạng
```jsonc
[ { "userId":"...", "displayName":"Trần Minh", "bestScore":100, "attempts":5 } ]
```

### POST `/quiz/questions`  *(role=Admin)* — thêm câu hỏi
```jsonc
{ "question":"...", "optionA":"...", "optionB":"...", "optionC":"...", "optionD":"...",
  "correctOption":"A", "explanation":"...", "difficulty":1, "topic":"...", "period":"..." }
```

---

## 4. Flashcards (tiêu chí 4)

### GET `/flashcards?topic=&period=`
```jsonc
[ { "id":"...", "front":"Chiến dịch Hồ Chí Minh kết thúc ngày nào?", "back":"30/4/1975", "topic":"...", "period":"1975" } ]
```

### POST `/flashcards/{id}/review`  — ghi nhận đã ôn
```jsonc
{ "remembered": true }   // res 204
```

### POST `/flashcards`  *(role=Admin)* — thêm thẻ
```jsonc
{ "front":"...", "back":"...", "topic":"...", "period":"..." }
```

---

## 5. Stats / Dashboard (tiêu chí 2)

### GET `/stats/overview`
```jsonc
{
  "totalUsers": 124, "activeUsers7d": 38,
  "totalSessions": 510, "totalUserMessages": 2304,
  "totalQuizAttempts": 187, "avgQuizScore": 72.4,
  "totalFlashcardReviews": 940
}
```

### GET `/stats/activity?days=30`
```jsonc
{
  "messagesPerDay": [ { "day": "2026-06-01", "count": 12 }, ... ],
  "newUsersPerDay": [ { "day": "2026-06-01", "count": 3 }, ... ]
}
```

### GET `/stats/quiz`
```jsonc
{
  "scoreDistribution": [ { "bucket": "0-20", "count": 4 }, { "bucket": "21-40", "count": 9 }, ... ],
  "attemptsPerDay":    [ { "day": "2026-06-01", "count": 6 }, ... ],
  "avgScore": 72.4, "bestScore": 100
}
```

> `/stats/*` nên giới hạn role=Admin (hoặc cho user xem thống kê của chính họ — backend quyết).

---

## CORS
Backend cho phép origin `http://localhost:5173` (Vite dev) và domain deploy. Cho phép header `Authorization`, method `GET,POST,PATCH,DELETE,OPTIONS`.
