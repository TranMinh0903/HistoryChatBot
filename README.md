# ChatBot AI — Lịch sử Đảng Cộng sản Việt Nam (1954–1975)

Web ChatBot AI hỗ trợ sinh viên ôn tập môn Lịch sử Đảng, giai đoạn 1954–1975: hỏi đáp với AI, ôn tập bằng trắc nghiệm & thẻ ghi nhớ, theo dõi thống kê học tập.

## Tiêu chí (C1.4)
1. 🎨 **Màu sắc** rõ ràng, phù hợp lịch sử Đảng (tông đỏ – vàng).
2. 📊 **Bảng thống kê** số liệu người dùng → trang Thống kê (`/dashboard`).
3. 💬 **Lịch sử chat** — xem lại đoạn chat cũ + tạo đoạn chat mới → trang Trò chuyện (`/chat`).
4. 🎮 **Ôn tập** — Quiz (trắc nghiệm) + Flashcards (`/quiz`, `/flashcards`).

## 🔑 Tài khoản demo

| Vai trò | Đăng nhập | Quyền |
|---|---|---|
| **Quản trị viên** | `admin` / `admin123` | Xem thống kê **toàn hệ thống** + **Quản lý nội dung** (thêm/sửa/xóa câu hỏi quiz & flashcards) + bảng xếp hạng |
| **Sinh viên** | *tự đăng ký trong app* | Chat, làm quiz, ôn flashcards; thống kê chỉ thấy **của riêng mình** |

> Tài khoản `admin` được seed tự động khi backend khởi động. **Đổi mật khẩu khi lên production.**

## Tính năng

- **Trò chuyện:** chat với AI (Groq) về lịch sử Đảng; sidebar lưu & xem lại các đoạn chat cũ; tạo đoạn chat mới (tự đặt tên theo câu hỏi đầu); đổi tên (double-click) / xóa đoạn chat.
- **Trắc nghiệm:** chọn 5/10/15 câu, đếm giờ, chấm điểm theo thang 100, xem lại đáp án + giải thích, lưu lịch sử làm bài.
- **Thẻ ghi nhớ:** lật thẻ, lọc theo giai đoạn, đánh dấu đã nhớ, xáo trộn.
- **Thống kê:** dashboard biểu đồ (recharts) — admin xem toàn hệ thống + bảng xếp hạng; sinh viên xem hoạt động cá nhân.
- **Quản lý nội dung (admin):** CRUD câu hỏi quiz & flashcards ngay trên web.
- **Auth:** đăng ký/đăng nhập JWT, phân quyền Admin/User.

## Kiến trúc

```
┌─────────────┐      REST/JSON      ┌──────────────────┐     OpenAI-compat    ┌────────┐
│  Frontend   │  ───────────────►   │  Backend         │  ────────────────►   │  Groq  │
│ React+Vite  │  ◄───────────────   │  ASP.NET Core    │  ◄────────────────   │  LLM   │
└─────────────┘                     └────────┬─────────┘                      └────────┘
                                             │ EF Core / Npgsql
                                             ▼
                                       ┌──────────┐
                                       │PostgreSQL│ (Docker)
                                       └──────────┘
```

| Thành phần | Công nghệ |
|---|---|
| Frontend | React 19 + Vite + TypeScript (recharts, react-markdown) |
| Backend | ASP.NET Core (.NET 10) + EF Core + JWT + BCrypt |
| AI | Groq API (`llama-3.3-70b-versatile`, OpenAI-compatible) |
| Database | PostgreSQL 16 (Docker) |

## Tài liệu kỹ thuật
- [`docs/API.md`](docs/API.md) — REST contract đầy đủ.
- [`docs/DATABASE.md`](docs/DATABASE.md) — schema PostgreSQL + truy vấn thống kê.
- [`docs/GROQ.md`](docs/GROQ.md) — tích hợp Groq + system prompt + code C# mẫu.
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — hướng dẫn deploy Railway (BE+DB) + Vercel (FE).

## Chạy dev

### Cách 1 — Docker (database + backend, khuyên dùng)
```bash
# (tuỳ chọn) bật trả lời AI:  $env:GROQ_API_KEY="gsk_xxx"   trước khi up
docker compose up -d --build
```
Dựng 3 container:

| Container | URL | Vai trò |
|---|---|---|
| `lsd_api` | http://localhost:5000 (Swagger: `/swagger`) | Backend — tự migrate + seed (admin + 18 quiz + 16 flashcard) |
| `lsd_postgres` | localhost:5432 | PostgreSQL |
| `lsd_adminer` | http://localhost:8081 | GUI xem DB (Hệ thống: **PostgreSQL**, Server `db`, user/pass `postgres`, DB `lichsudang`) |

> Swagger có nút **Authorize**: gọi `POST /api/auth/login` lấy `token` → dán vào (không cần gõ "Bearer ").
> Port API cấu hình ở `docker-compose.yml` (`ports: "5000:8080"`) + `backend/Dockerfile`.

### Cách 2 — Backend chạy thủ công (không Docker)
```bash
docker compose up -d db        # cần Postgres
cd backend
dotnet run --project LichSuDang.Api --urls http://localhost:5000
```
> Không có `--urls` thì mặc định chạy **http://localhost:5205** (cấu hình ở `backend/LichSuDang.Api/Properties/launchSettings.json`).

### Frontend
```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173
```
Tạo `frontend/.env` (xem `.env.example`):
```
VITE_API_BASE_URL=http://localhost:5000/api
```
> Bỏ trống `VITE_API_BASE_URL` → frontend chạy **chế độ demo (mock)** với dữ liệu mẫu, không cần backend.

## Cấu hình quan trọng (env)

| Biến | Mô tả |
|---|---|
| `GROQ_API_KEY` | API key Groq để bật trả lời AI (lấy ở console.groq.com). Chưa set → bot trả lời fallback. |
| `ConnectionStrings__Default` | Chuỗi kết nối Postgres (hoặc `DATABASE_URL` cho Railway/Render). |
| `Jwt__Key` | Khóa ký JWT (≥ 32 ký tự). |
| `Cors__Origins` | Origin frontend được phép (vd domain Vercel), phân tách bằng dấu phẩy. |

## Trạng thái
- [x] Frontend: theme đỏ–vàng, layout, auth
- [x] Frontend: Chat (lịch sử + chat mới, markdown, đổi tên/xóa)
- [x] Frontend: Quiz (chấm điểm, giải thích, lịch sử) + Flashcards (lật thẻ, lọc giai đoạn)
- [x] Frontend: Dashboard thống kê phân quyền (recharts)
- [x] Frontend: Quản lý nội dung (admin CRUD quiz + flashcards)
- [x] Backend: EF Core + PostgreSQL, JWT, Groq, controllers, migration + seed
- [x] Backend: phân quyền Admin/User, Swagger Authorize
- [x] Docker hóa (compose: api + postgres + adminer)
- [ ] Deploy Railway + Vercel (xem `docs/DEPLOY.md`)
- [ ] Seed thêm quiz/flashcards từ tài liệu VNR202 (tuỳ chọn)
