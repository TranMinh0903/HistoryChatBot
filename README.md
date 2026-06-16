# ChatBot AI — Lịch sử Đảng Cộng sản Việt Nam (1954–1975)

Web ChatBot AI hỗ trợ sinh viên ôn tập môn Lịch sử Đảng, giai đoạn 1954–1975.

## Tiêu chí (C1.4)
1. 🎨 **Màu sắc** rõ ràng, phù hợp lịch sử Đảng (tông đỏ – vàng) → frontend theme.
2. 📊 **Bảng thống kê** số liệu người dùng → trang Dashboard (`/stats`).
3. 💬 **Lịch sử chat** — xem lại đoạn chat cũ + tạo đoạn chat mới → trang Chat.
4. 🎮 **Ôn tập** — Quiz (trắc nghiệm) + Flashcards.

## Kiến trúc

```
┌─────────────┐      REST/JSON      ┌──────────────────┐     OpenAI-compat    ┌────────┐
│  Frontend   │  ───────────────►   │  Backend (C#)    │  ────────────────►   │  Groq  │
│ React+Vite  │  ◄───────────────   │  ASP.NET Core    │  ◄────────────────   │  LLM   │
└─────────────┘                     └────────┬─────────┘                      └────────┘
                                             │ EF Core / Npgsql
                                             ▼
                                       ┌──────────┐
                                       │PostgreSQL│ (Docker)
                                       └──────────┘
```

| Thành phần | Công nghệ | Người làm |
|---|---|---|
| Frontend | React 19 + Vite + TypeScript | Claude |
| Backend | ASP.NET Core (.NET) + EF Core | Bạn |
| AI | Groq API (`llama-3.3-70b-versatile`) | — |
| Database | PostgreSQL 16 (Docker) | Bạn |

## Tài liệu chung (cho backend khớp với frontend)
- [`docs/API.md`](docs/API.md) — REST contract đầy đủ.
- [`docs/DATABASE.md`](docs/DATABASE.md) — schema PostgreSQL + truy vấn thống kê.
- [`docs/GROQ.md`](docs/GROQ.md) — tích hợp Groq + system prompt + code C# mẫu.

## Chạy dev

### 1. Database (Docker)
```bash
docker compose up -d db        # PostgreSQL tại localhost:5432, Adminer tại localhost:8080
```

### 2. Backend (ASP.NET Core)
```bash
# (tuỳ chọn) bật trả lời AI:  set GROQ_API_KEY=gsk_xxx   (Windows: $env:GROQ_API_KEY="gsk_xxx")
cd backend
dotnet run --project LichSuDang.Api --urls http://localhost:5000
# API tại http://localhost:5000 · Swagger UI: http://localhost:5000/swagger
# Tự động chạy migration + seed (18 câu quiz, 16 flashcards) khi khởi động.
```
Cấu trúc: `backend/LichSuDang.Api/` (Domain, Data, Dtos, Services, Controllers).
Chuỗi kết nối & Groq cấu hình trong `appsettings.json` (API key nên đặt qua env `GROQ_API_KEY`).

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173
```
Tạo `frontend/.env` (xem `.env.example`):
```
VITE_API_BASE_URL=http://localhost:5000/api
```

## Trạng thái
- [x] Khởi tạo dự án + tài liệu chung
- [x] Frontend: theme, layout, auth
- [x] Frontend: Chat (sidebar lịch sử + cửa sổ chat, markdown)
- [x] Frontend: Quiz (chấm điểm, giải thích, lịch sử làm bài) + Flashcards (lật thẻ, lọc theo giai đoạn)
- [x] Frontend: Dashboard thống kê (biểu đồ recharts)
- [x] Backend (C#): EF Core + PostgreSQL, JWT auth, Groq, controllers, migration + seed — đã build & test
- [ ] Cấu hình `GROQ_API_KEY` thật để bật trả lời AI
- [ ] Nối frontend ↔ backend thật (tạo `frontend/.env` với `VITE_API_BASE_URL`)
- [ ] Seed thêm quiz/flashcards từ tài liệu VNR202 (tuỳ chọn)
