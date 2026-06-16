# Database Schema — PostgreSQL

> ChatBot AI Lịch sử Đảng Cộng sản Việt Nam (1954–1975)
> Backend dùng EF Core (code-first) hoặc raw SQL đều được. Dưới đây là schema tham chiếu cho cả 2 bên.

## ERD (tóm tắt quan hệ)

```
users 1───* chat_sessions 1───* chat_messages
users 1───* quiz_attempts  1───* quiz_attempt_answers *───1 quiz_questions
users 1───* flashcard_reviews *───1 flashcards
```

## Bảng

### users
Người dùng (sinh viên / admin). Phục vụ tiêu chí 2 (thống kê người dùng).

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| username | varchar(50) UNIQUE NOT NULL | đăng nhập |
| email | varchar(150) UNIQUE | |
| password_hash | varchar(255) NOT NULL | BCrypt |
| display_name | varchar(100) | tên hiển thị |
| role | smallint NOT NULL DEFAULT 1 | 1=User, 2=Admin |
| created_at | timestamptz NOT NULL DEFAULT now() | |
| last_login_at | timestamptz NULL | dùng cho "active users" |

### chat_sessions
Một đoạn chat (tiêu chí 3: xem lại chat cũ / tạo chat mới).

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users(id) ON DELETE CASCADE | |
| title | varchar(200) NOT NULL DEFAULT 'Đoạn chat mới' | tự đặt theo câu hỏi đầu |
| created_at | timestamptz NOT NULL DEFAULT now() | |
| updated_at | timestamptz NOT NULL DEFAULT now() | cập nhật khi có tin nhắn mới |

Index: `(user_id, updated_at DESC)` để liệt kê sidebar nhanh.

### chat_messages
Tin nhắn trong một đoạn chat.

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid PK | |
| session_id | uuid FK → chat_sessions(id) ON DELETE CASCADE | |
| role | varchar(16) NOT NULL | 'user' \| 'assistant' \| 'system' |
| content | text NOT NULL | nội dung |
| token_count | int NULL | token Groq trả về (thống kê) |
| created_at | timestamptz NOT NULL DEFAULT now() | |

Index: `(session_id, created_at ASC)`.

### quiz_questions
Ngân hàng câu hỏi trắc nghiệm (tiêu chí 4 — quiz).

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid PK | |
| question | text NOT NULL | đề bài |
| option_a | text NOT NULL | |
| option_b | text NOT NULL | |
| option_c | text NOT NULL | |
| option_d | text NOT NULL | |
| correct_option | char(1) NOT NULL | 'A'\|'B'\|'C'\|'D' |
| explanation | text NULL | giải thích đáp án |
| difficulty | smallint NOT NULL DEFAULT 1 | 1=Dễ, 2=Trung bình, 3=Khó |
| topic | varchar(100) NULL | vd "Kháng chiến chống Mỹ" |
| period | varchar(50) NULL | vd "1954–1960" |
| created_at | timestamptz NOT NULL DEFAULT now() | |

### quiz_attempts
Lượt làm bài (thống kê + xếp hạng).

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users(id) | |
| total_questions | int NOT NULL | |
| correct_count | int NOT NULL | |
| score | int NOT NULL | điểm (vd correct*10) |
| duration_seconds | int NULL | thời gian làm |
| started_at | timestamptz NOT NULL | |
| finished_at | timestamptz NOT NULL DEFAULT now() | |

### quiz_attempt_answers
Chi tiết từng câu trả lời (tuỳ chọn, để xem lại bài).

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid PK | |
| attempt_id | uuid FK → quiz_attempts(id) ON DELETE CASCADE | |
| question_id | uuid FK → quiz_questions(id) | |
| selected_option | char(1) NULL | đáp án đã chọn (NULL = bỏ qua) |
| is_correct | boolean NOT NULL | |

### flashcards
Thẻ ghi nhớ (tiêu chí 4 — flashcards).

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid PK | |
| front | text NOT NULL | mặt trước (câu hỏi / mốc sự kiện) |
| back | text NOT NULL | mặt sau (đáp án / nội dung) |
| topic | varchar(100) NULL | |
| period | varchar(50) NULL | vd "1968" |
| created_at | timestamptz NOT NULL DEFAULT now() | |

### flashcard_reviews
Lượt ôn flashcard (tuỳ chọn — thống kê tiến độ ôn tập).

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users(id) | |
| flashcard_id | uuid FK → flashcards(id) ON DELETE CASCADE | |
| remembered | boolean NOT NULL | đã nhớ hay chưa |
| reviewed_at | timestamptz NOT NULL DEFAULT now() | |

## Truy vấn thống kê (tiêu chí 2 — dashboard)

```sql
-- Tổng quan
SELECT
  (SELECT count(*) FROM users)                                            AS total_users,
  (SELECT count(*) FROM users WHERE last_login_at > now() - interval '7 day') AS active_users_7d,
  (SELECT count(*) FROM chat_sessions)                                    AS total_sessions,
  (SELECT count(*) FROM chat_messages WHERE role = 'user')                AS total_user_messages,
  (SELECT count(*) FROM quiz_attempts)                                    AS total_quiz_attempts,
  (SELECT coalesce(avg(score),0) FROM quiz_attempts)                      AS avg_quiz_score;

-- Hoạt động theo ngày (30 ngày)
SELECT date_trunc('day', created_at)::date AS day, count(*) AS messages
FROM chat_messages
WHERE created_at > now() - interval '30 day'
GROUP BY 1 ORDER BY 1;

-- Người dùng đăng ký mới theo ngày
SELECT date_trunc('day', created_at)::date AS day, count(*) AS new_users
FROM users
WHERE created_at > now() - interval '30 day'
GROUP BY 1 ORDER BY 1;
```

## Lưu ý
- Bật extension `pgcrypto` nếu dùng `gen_random_uuid()`: `CREATE EXTENSION IF NOT EXISTS pgcrypto;`
- Tất cả timestamp dùng `timestamptz` (UTC).
- Seed sẵn `quiz_questions` và `flashcards` (xem `docs/SEED-DATA.md` — sẽ tạo từ tài liệu VNR202).
