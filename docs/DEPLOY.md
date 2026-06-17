# Hướng dẫn Deploy — Railway (Backend + DB) + Vercel (Frontend)

> Mục tiêu: đưa app lên internet để demo/nộp bài. Tổng thời gian ~20–30 phút.
> Code đã chuẩn bị sẵn: backend đọc `DATABASE_URL` & `PORT` từ env, CORS đọc từ `Cors__Origins`.

## 0. Chuẩn bị
- Tài khoản: **GitHub**, **Railway** (railway.app), **Vercel** (vercel.com) — đăng nhập bằng GitHub cho nhanh.
- ⚠️ Railway: có **$5 credit dùng thử**; đủ cho demo. Hết credit cần gói Hobby ($5/tháng).
  Muốn **free vĩnh viễn**: dùng **Render** (backend, ngủ khi rảnh) + **Neon** (Postgres free) — xem mục cuối.

## 1. Push code lên GitHub
```bash
cd D:\FPTStudy\HistoryChatBot
# Tạo repo trống trên github.com (KHÔNG thêm README), rồi:
git remote add origin https://github.com/<username>/lichsudang-chatbot.git
git push -u origin main
```

## 2. Backend + PostgreSQL trên Railway
1. Railway → **New Project** → **Deploy from GitHub repo** → chọn repo vừa push.
2. Vào service vừa tạo → **Settings**:
   - **Root Directory**: `backend`  (để Railway tìm thấy `Dockerfile`)
   - Railway tự nhận `Dockerfile` và build.
3. Thêm database: **New** → **Database** → **PostgreSQL**.
4. Vào service backend → tab **Variables**, thêm:
   | Biến | Giá trị |
   |---|---|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (chọn reference tới Postgres) |
   | `GROQ_API_KEY` | key Groq của bạn |
   | `Jwt__Key` | chuỗi bí mật dài ≥ 32 ký tự |
   | `ASPNETCORE_ENVIRONMENT` | `Development` (để bật Swagger) hoặc `Production` |
   | `Cors__Origins` | (điền sau khi có URL Vercel ở bước 3) |
   > `PORT` Railway tự cấp — code đã tự lắng nghe đúng cổng.
5. **Settings → Networking → Generate Domain** → copy URL backend, ví dụ `https://lichsudang-be.up.railway.app`.
   - App tự chạy migration + seed (admin/admin123, 18 quiz, 16 flashcard) khi khởi động.
   - Kiểm tra: mở `https://<backend>/swagger`.

## 3. Frontend trên Vercel
1. Vercel → **Add New → Project** → import repo.
2. Cấu hình:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (tự nhận)
   - Build: `npm run build` · Output: `dist`
3. **Environment Variables**:
   | Biến | Giá trị |
   |---|---|
   | `VITE_API_BASE_URL` | `https://<backend-railway>/api` |
4. **Deploy** → copy URL Vercel, ví dụ `https://lichsudang.vercel.app`.

## 4. Nối CORS (quan trọng)
Quay lại **Railway → backend → Variables**, đặt:
```
Cors__Origins = https://lichsudang.vercel.app
```
(nhiều domain thì ngăn cách bằng dấu phẩy). Railway sẽ tự redeploy. Xong! Mở URL Vercel để dùng.

## 5. Kiểm tra sau deploy
- Mở app Vercel → đăng ký tài khoản → chat thử (AI trả lời) → làm quiz → xem flashcards.
- Đăng nhập `admin` / `admin123` → trang Thống kê hiện **bản quản trị** (toàn hệ thống).
- ⚠️ Đổi mật khẩu admin / `Jwt__Key` cho production.

---

## (Tuỳ chọn) Free vĩnh viễn: Render + Neon
- **Neon** (neon.tech): tạo Postgres free → copy connection string → đặt `DATABASE_URL` trên Render.
- **Render** (render.com): New → **Web Service** → from repo → **Root Directory** `backend`, Runtime **Docker**.
  - Env: `DATABASE_URL` (từ Neon), `GROQ_API_KEY`, `Jwt__Key`, `Cors__Origins`.
  - Render tự cấp `PORT`. ⚠️ Free tier **ngủ sau 15' không dùng** → request đầu chậm ~50s.
- Frontend vẫn trên Vercel như mục 3.
