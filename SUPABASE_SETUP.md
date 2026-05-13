# SUPABASE_SETUP — Chuyển dữ liệu từ JSON sang Supabase

Mục tiêu: lưu sản phẩm / video / blog / settings vào Supabase database để **không bị mất khi deploy lại Render**.

---

## Bước 1 — Tạo Supabase project

1. Vào [supabase.com](https://supabase.com) → "Start your project" → Sign up bằng GitHub.
2. Tạo project mới:
   - **Name:** `lion-affiliate` (hoặc bất kỳ)
   - **Database password:** chọn 1 password mạnh → **lưu ngay** (sẽ cần)
   - **Region:** `Southeast Asia (Singapore)` ← gần Việt Nam nhất
   - **Pricing plan:** Free (đủ dùng cho project ~1000 sản phẩm)
3. Đợi ~2 phút project boot xong.

---

## Bước 2 — Chạy SQL schema

1. Vào project → menu trái → **SQL Editor** → **New query**.
2. Mở file [backend/supabase/schema.sql](backend/supabase/schema.sql) trong repo → copy toàn bộ nội dung.
3. Paste vào SQL Editor → bấm **Run** (hoặc Ctrl+Enter).
4. Verify: menu **Table Editor** → thấy 8 bảng:
   - `products`, `videos`, `categories`, `collections`, `blogs`
   - `site_settings`, `google_sheet_settings`, `analytics_state`
5. Bảng `categories` đã có sẵn 8 row seed (Tất cả / Deal hot / Gia dụng / ...).

---

## Bước 3 — Lấy URL + Service Role Key

1. Vào **Settings** (góc trái dưới) → **API**.
2. Copy 2 giá trị:
   - **Project URL** → `SUPABASE_URL` (vd `https://xxxxxx.supabase.co`)
   - **Service role key** (mục "Project API keys", nhìn lên trên header — đừng nhầm với `anon` key) → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Service role key có quyền full** — chỉ dùng ở backend (Render env), KHÔNG bao giờ commit vào git hoặc expose trên frontend.

---

## Bước 4 — Migrate dữ liệu cũ từ JSON

**Trên máy local của bạn:**

```bash
cd backend
# Cài @supabase/supabase-js (đã có trong package.json)
npm install

# Tạo file .env (nếu chưa có) hoặc thêm:
echo "SUPABASE_URL=https://xxxxxx.supabase.co" >> .env
echo "SUPABASE_SERVICE_ROLE_KEY=eyJhbGc..." >> .env

# Chạy migration script
npm run migrate:supabase
```

Script sẽ:
- Đọc `backend/data/*.json` (products, videos, categories, ...)
- Upsert vào Supabase tables tương ứng
- KHÔNG xoá data hiện có — chỉ update theo `id`
- Log số rows mỗi bảng

Output ví dụ:
```
✅ products: migrated 12 rows
✅ videos: migrated 5 rows
✅ categories: migrated 8 rows
...
🎉 Migration hoàn tất.
```

Nếu Render Free đã xoá `data/*.json` rồi → không sao, Supabase sẽ rỗng → bạn thêm sản phẩm mới qua admin web hoặc Sheet sync.

---

## Bước 5 — Set env trên Render

1. Vào [dashboard.render.com](https://dashboard.render.com) → service `lion-affiliate-backend`.
2. **Environment** → **Add Environment Variable**:
   - Key: `SUPABASE_URL` → Value: `https://xxxxxx.supabase.co`
   - Key: `SUPABASE_SERVICE_ROLE_KEY` → Value: `eyJhbGc...`
3. Save → Render auto restart.
4. Logs nên thấy:
   ```
   ✅ [supabase] Client initialized: https://xxxxxx.supabase.co
   ```
   Thay vì:
   ```
   ℹ️ [supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — using JSON file fallback (dev mode).
   ```

---

## Bước 6 — Verify

1. Mở `/admin` web → thêm 1 sản phẩm thử.
2. Vào Supabase → **Table Editor** → `products` → thấy row mới xuất hiện.
3. **Redeploy Render** (chỉ cần push commit nhỏ hoặc bấm "Manual deploy"):
   - Backend restart → đọc data từ Supabase → sản phẩm vẫn còn.
   - Trước kia data sẽ mất vì Render Free xoá `data/*.json` mỗi lần deploy.

---

## Behavior dual-mode

Code backend được thiết kế **dual-impl**:
- Có ENV Supabase → dùng Supabase (production).
- Không có ENV → tự fallback về JSON file (dev local).

Có nghĩa là:
- Dev local trên máy bạn: chạy `npm run dev` không cần Supabase, vẫn work.
- Production Render: bắt buộc set ENV → dữ liệu lưu Supabase persistent.

---

## Cấu trúc tables

| Table | Mục đích | Schema |
|---|---|---|
| `products` | Sản phẩm affiliate | `id, data jsonb, status, slug, category, source, timestamps` |
| `videos` | Video review | `id, data jsonb, status, order, timestamps` |
| `categories` | Danh mục | `id, data jsonb, status, order, timestamps` |
| `collections` | Bộ sưu tập | `id, data jsonb, status, order, timestamps` |
| `blogs` | Bài viết | `id, data jsonb, status, order, timestamps` |
| `site_settings` | Cấu hình web (1 row) | `id='singleton', data jsonb` |
| `google_sheet_settings` | Cấu hình sync Sheet | `id='singleton', data jsonb` |
| `analytics_state` | Click stats | `id='singleton', data jsonb` |

→ Mọi field detail nằm trong cột `data` (jsonb). Cột top-level chỉ dùng cho filter/index (status, slug, category, order). Linh hoạt — không cần ALTER TABLE khi thêm field mới.

---

## Rollback (nếu cần)

Xoá 2 ENV `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` trên Render → backend tự revert về JSON file mode. Dữ liệu cũ trên JSON (nếu còn) sẽ hoạt động lại.

Supabase Free Plan giới hạn: **500MB database + 1GB storage + 50K monthly active users** — quá đủ cho project này (~50KB/sản phẩm × 1000 sản phẩm = 50MB).

---

## FAQ

**Q: Migration chạy nhiều lần có sao không?**
A: Idempotent — `upsert(onConflict: 'id')` chỉ update theo id, không tạo duplicate.

**Q: Tôi có nên xoá file `data/*.json` sau khi migrate không?**
A: KHÔNG. Giữ lại làm backup cứng. Code đã được thiết kế ưu tiên Supabase khi có ENV; JSON chỉ là fallback.

**Q: Service role key có an toàn không nếu set trên Render?**
A: An toàn. Render env vars được encrypted, chỉ container backend đọc được, không expose ra ngoài.

**Q: Có thể dùng `anon` key thay vì `service_role`?**
A: Không. `anon` key bị giới hạn bởi RLS (Row Level Security). Backend cần bypass RLS để CRUD đầy đủ → phải dùng `service_role`.
