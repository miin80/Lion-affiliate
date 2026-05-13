# AUDIT_FIX — Option B Full Audit Fixes

Ngày: 2026-05-13
Branch: `main` (commits sau `540cffc`)

Đây là báo cáo Option B — fix toàn diện sau audit codebase. Tiếp nối Option A (commit `540cffc`).

---

## ✅ Đã fix trong Option B

### 1. Centralize product schema
**File mới:** [backend/src/shared/productSchema.js](backend/src/shared/productSchema.js)

Trước: schema product định nghĩa rải rác ở 3 chỗ:
- `services/googleSheetService.js` — `COL_ALIASES` cho CSV import
- `store/products.js` — `rowToProduct` mapping
- `routes/products.js` — inline validation (`if (!p.title) throw...`)

Sau: 1 file duy nhất `productSchema.js` export:
- `PRODUCT_FIELDS` — array of `{field, type, required, default, aliases, sheet}`
- `COL_ALIASES` — auto-generated từ PRODUCT_FIELDS
- `SHEET_HEADERS` — auto-generated cho Apps Script
- `REQUIRED_FIELDS` — array tên field bắt buộc
- `validateProduct(product)` — return `{ok, errors[]}`
- `normalizeProduct(input)` — convert type + apply defaults

**Wire vào:**
- `services/googleSheetService.js`: import `COL_ALIASES` thay vì hardcode
- `routes/products.js`: `bulkSaveRoute` + `saveRoute` dùng `validateProduct()`

→ Thêm field mới (vd `weight`, `dimension`) chỉ cần sửa **1 file** `productSchema.js` → mọi nơi tự pick up.

### 2. Cache-Control headers cho public routes
**File:** [backend/src/index.js](backend/src/index.js)

Middleware `publicCacheControl` set header trên GET requests:
```
Cache-Control: public, max-age=60, s-maxage=60, stale-while-revalidate=30
```

Apply cho:
- `/api/products` (list public)
- `/api/site-settings`
- `/api/categories/active-with-products`
- `/api/videos`, `/api/collections`, `/api/blogs`, `/api/categories`

**Lợi ích:**
- Frontend reload không spam backend (browser cache 60s).
- Vercel edge có thể cache server-side với `s-maxage`.
- `stale-while-revalidate=30`: hết hạn vẫn trả cache cũ + refresh background → 0 latency cho user.
- Mutation (POST/PUT/PATCH/DELETE) tự skip cache (middleware check `req.method === 'GET'`).

### 3. README production setup
**File:** [README.md](README.md)

Update section "Deploy backend" với bảng ENV bắt buộc:

| Key | Yêu cầu | Ghi chú |
|---|---|---|
| `NODE_ENV=production` | BẮT BUỘC | Kích hoạt fail-fast |
| `JWT_SECRET` | BẮT BUỘC, ≥ 32 chars | Tạo bằng `openssl rand -hex 32` |
| `CORS_ORIGIN` | BẮT BUỘC | Domain cụ thể, KHÔNG để `*` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | BẮT BUỘC | Login admin |
| `USE_PUPPETEER=false` | Render Free | Chromium không chạy được |
| Supabase ENV | Optional | Khi muốn data persist |

Có cảnh báo rõ về `JWT_SECRET` fail-fast + CORS wildcard risk.

### 4. npm audit
- ✅ Backend: **0 vulnerabilities**
- ⚠️ Frontend: 2 moderate **chỉ dev-only** (esbuild dev server GHSA-67mh-4wv8-2f99)
  - Fix yêu cầu upgrade Vite 5→8 (breaking change) → **defer**
  - Không ảnh hưởng production build (esbuild dev server không deploy)

### 5. Outdated packages
Không update major version để tránh breaking:
| Package | Current | Latest | Quyết định |
|---|---|---|---|
| express | 4.22 | 5.2 | Defer — Express 5 breaking API |
| puppeteer | 23.11 | 24.43 | Defer — USE_PUPPETEER=false, không dùng |
| express-rate-limit | 7.5 | 8.5 | Defer — vừa cài 7, working fine |
| dotenv | 16.6 | 17.4 | Defer — không có lý do urgent |

---

## 🔒 Security review — toàn project

### ✅ ĐANG OK

| Khu vực | Trạng thái |
|---|---|
| JWT secret | Fail-fast trong production (commit `540cffc`) |
| Rate limit | 120/auth-20/admin-300 req/phút (`express-rate-limit`) |
| CORS | Configurable qua env, mặc định `*` warn |
| Admin auth | `requireAuth` middleware Bearer JWT |
| Input validation | `validateProduct()` từ schema |
| SQL injection | N/A — dùng Supabase SDK / JSON file |
| XSS | React tự escape, không có `dangerouslySetInnerHTML` từ user input |
| Secrets in code | Không có — đều qua env |
| HTTPS | Vercel + Render đều TLS auto |
| Logout | Client localStorage clear + redirect |
| Token expiry | 7 ngày, gia hạn khi user login lại |
| Service role keys | Chỉ ở Render env, không commit |

### ⚠️ ISSUES CÒN LẠI (chưa fix vì lý do)

#### A — Nên fix khi có thời gian

1. **Brute force login window quá rộng** (`authLimiter`: 20 req/phút).
   - Tốt hơn: thêm `delayMs` exponential backoff, hoặc lockout sau N fail liên tiếp.
   - **Defer**: hiện tại 20/phút đã đủ chống bot script đơn giản. Admin chỉ 1 người, không có vấn đề user-friendly.

2. **JWT không có refresh token / revoke list**.
   - Token cấp 7 ngày, không revoke được nếu lộ. Có thể blacklist trong Supabase nếu cần.
   - **Defer**: project chỉ 1 admin, ít rủi ro chiếm dụng dài hạn.

3. **Admin password lưu plain text trong env**.
   - Nên hash + so sánh bcrypt thay vì so equality.
   - **Defer**: Render env vars đã encrypted at rest. Chỉ admin Render xem được.

4. **No HTTP security headers** (Helmet middleware không có).
   - Headers như `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security` chưa set.
   - Vercel + Render mặc định serve qua TLS với HSTS preload (1 phần).
   - **Defer**: project không xử lý PII, không có form payment → low risk. Có thể thêm `helmet` package sau.

5. **Backup file download không kiểm tra ai download nhiều lần**.
   - Endpoint `/api/backup/export` chỉ require auth, không log access.
   - **Defer**: 1 admin duy nhất, không cần audit log.

#### B — Acceptable (không fix)

6. **CSV from Google Sheet trust hoàn toàn**.
   - Sheet là source admin tự control, nên content được trust.
   - Nếu Sheet bị compromise → backend không validate XSS trong fields như description, title.
   - **Accept**: Sheet là admin-only resource. Nếu admin bị hijack thì web cũng bị.

7. **Frontend esbuild moderate vuln**.
   - Dev-only, không trong production bundle.
   - **Accept**: defer khi update Vite 8.

8. **Rate limiter không phân tán** (in-memory).
   - Nếu scale ra nhiều Render instance, mỗi instance có limit riêng.
   - **Accept**: Render Free chỉ 1 instance. Nếu scale sau dùng Redis store.

9. **Express 4 thay vì 5**.
   - Express 4 vẫn maintained, không EOL.
   - **Accept**: defer khi cần feature Express 5.

---

## 📦 Package nào đã update

Trong Option B này **không update package nào** — chỉ refactor code.

Trước đó (Option A — commit `540cffc`):
- ✅ Thêm `express-rate-limit@^7.4.0`

Trước đó (Supabase migration — commit `e0ca8ec`):
- ✅ Thêm `@supabase/supabase-js@^2.45.4`

---

## 🎯 Tóm tắt

| Mục Option B | Status |
|---|---|
| 1. Centralize product schema | ✅ Done — `shared/productSchema.js` |
| 2. Cache-Control public routes | ✅ Done — 60s + SWR |
| 3. README CORS docs | ✅ Done — bảng ENV chi tiết |
| 4. npm audit | ✅ Done — backend clean, frontend dev-only |
| 5. Security review | ✅ Done — 9 issues còn lại đều có lý do defer |

**Build pass:** `frontend ✓ built in 2.6s` — bundle không tăng.

**Backend syntax check:** all modules import cleanly.

---

## ⚠️ Issues defer rõ ràng

1. Frontend esbuild moderate vuln — dev-only, đợi Vite 8.
2. Express 4 → 5 — defer breaking change.
3. Puppeteer 23 → 24 — defer, USE_PUPPETEER=false.
4. Admin password bcrypt hash — defer, env encrypted.
5. HTTP security headers (Helmet) — defer, low risk.
6. Refresh token / revoke list — defer, 1 admin user.
7. Brute force exponential backoff — defer, basic limit đủ.
8. Audit log access — defer, không required.
9. Rate limit Redis store — defer khi scale.

Tất cả 9 issue trên KHÔNG critical cho launch hiện tại. Có thể fix lần lượt sau.

🤖 Co-Authored-By: Claude Opus 4.7 (1M context)
