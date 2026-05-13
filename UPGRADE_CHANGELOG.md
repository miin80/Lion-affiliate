# UPGRADE CHANGELOG — Production-ready polish (Phase 13-section)

Ngày: 2026-05-13
2 commit chính trên `main`:
- `a342dda` — Settings expansion + tracking pixels + 4 legal pages + SEO enhance
- `f05e4ab` — Backup/Restore + ConfirmModal + Copy link + Deal start/end date + 404 polish

⚠️ **KHÔNG bao gồm**:
- Supabase migration (giữ JSON file storage cũ).
- Custom domain (giữ `lion-affiliate.vercel.app`).

---

## ✅ TÍNH NĂNG ĐÃ THÊM

### 1. Backup / Export / Import (mục #1)
- Tab admin mới: **💾 Backup dữ liệu** trong sidebar.
- Export **JSON tổng hợp**: products / videos / categories / collections / blogs / siteSettings / googleSheetSettings.
- Export **CSV** danh sách sản phẩm (UTF-8 BOM → Excel mở đúng tiếng Việt).
- Import file JSON với **ConfirmModal** xác nhận + báo cáo success/lỗi từng item.
- File: [backend/src/routes/backup.js](backend/src/routes/backup.js), [frontend/src/components/admin/BackupManager.jsx](frontend/src/components/admin/BackupManager.jsx).

### 2. Favicon + Logo + OG image settings (mục #2)
- Thêm `branding: { favicon, logo, ogImage }` trong settings.
- Admin chỉnh trong **Cài đặt website → 🎨 Branding**.
- Seo.jsx ưu tiên `branding.ogImage` → fallback avatar → fallback default.
- Favicon dynamic qua `<link rel="icon">` khi admin set.

### 3. SEO basic nâng cao (mục #3)
- [Seo.jsx](frontend/src/components/Seo.jsx) đã có: title, description, og:*, twitter:card, canonical, theme-color.
- Áp dụng cho Homepage / ProductDetail / Collection / BlogPost / LegalPage.
- `robots.txt` + `sitemap.xml` đã có sẵn từ batch trước trong `frontend/public/`.

### 4. Tracking pixels (mục #4)
- `settings.tracking` = { googleAnalyticsId, clarityId, facebookPixelId, tiktokPixelId }.
- File mới: [frontend/src/components/TrackingScripts.jsx](frontend/src/components/TrackingScripts.jsx).
- Mount trong AppShell → tự inject script khi admin nhập ID. Empty = không inject (sạch, không hard-code).
- Admin chỉnh ở **Cài đặt website → 📈 Tracking & Analytics**.

### 5. Trang chính sách / pháp lý (mục #5)
- File mới: [frontend/src/pages/LegalPage.jsx](frontend/src/pages/LegalPage.jsx) — generic component dùng cho 4 route.
- 4 route public:
  - `/privacy-policy` → settings.legal.privacyPolicy
  - `/terms` → settings.legal.terms
  - `/affiliate-disclosure` → settings.legal.affiliateDisclosure hoặc settings.disclosure
  - `/contact` → build từ settings.contact + settings.socials
- Mỗi route có default text Vietnamese chuẩn, admin override qua **Cài đặt → 📜 Trang chính sách** và **📞 Thông tin liên hệ**.
- Markdown parser nhẹ (## heading, **bold**, [text](url), - list).
- Footer thêm cột "Pháp lý" + link "Liên hệ".

### 6. Tối ưu ảnh (mục #6)
- LazyImage component đã có sẵn (đã có lazy loading + alt + fallback từ trước).
- Cloudinary upload đã có (qua CloudinaryUploader + MediaListEditor) — không can thiệp.
- Public + admin đã có graceful fallback `onError` cho `<img>`.
- **Không over-engineer** thêm WebP conversion (Cloudinary đã tự deliver WebP qua `f_auto`).

### 7. Error UI / Loading skeletons (mục #7)
- Đã có sẵn từ batch trước: `Skeletons.jsx`, `ErrorBoundary.jsx`, toast pattern trong các Manager.
- Bổ sung [ConfirmModal.jsx](frontend/src/components/admin/ConfirmModal.jsx) dùng chung — đã apply vào BackupManager.

### 8. Chống bấm nhầm (mục #8)
- [ConfirmModal.jsx](frontend/src/components/admin/ConfirmModal.jsx) — props rõ ràng (title/message/danger/busy).
- Đã apply: BackupManager (import backup).
- Trash/restore đã có `window.confirm()` sẵn từ trước (sufficient cho launch).

### 9. Copy link sản phẩm (mục #9)
- Nút **"🔗 Copy link"** mỗi product row trong ProductManager.
- Copy URL public `/product/<slug>` qua `navigator.clipboard`.
- Toast "🔗 Đã copy link sản phẩm: …" sau khi copy.
- Fallback `window.prompt` nếu clipboard API bị chặn.

### 10. Deal hết hạn / tự ẩn (mục #10)
- EditProductModal section "⏰ Deal hết hạn" với 3 field:
  - `startDate` — chưa tới → SP không xuất hiện public.
  - `endDate` — sau ngày này:
    - Nếu `autoHideExpired === true` (default) → tự ẩn khỏi public.
    - Nếu `false` → vẫn hiện (frontend có thể show badge "Hết hạn" — chưa wire visual).
- Backend `listActiveProducts()` đã filter `isWithinSchedule(p)`.
- **Không xoá**, chỉ ẩn khỏi public. Admin vẫn thấy sản phẩm trong list.

### 11. Trang 404 (mục #11)
- [pages/NotFound.jsx](frontend/src/pages/NotFound.jsx) refactor:
  - 3 CTA: Về trang chủ / Xem sản phẩm / Đọc blog.
  - Link liên hệ footer.
  - Centered design min-h-[70vh].

### 12. Admin UX (mục #12)
- Đã polished từ trước:
  - Mobile admin KHÔNG render public bottom nav (AppShell logic).
  - Logout chỉ trong sidebar.
  - EditProductModal layout flex-col chuẩn → footer luôn nhìn thấy.
  - Toolbar Sản phẩm 2-row (đã polish ở batch trước).
  - Empty state admin rõ ràng vs public.
- Không cần thêm trong batch này.

### 13. Final
- ✅ Build production pass (`✓ built in 2.54s`).
- Bundle: react 53.7 KB / motion 38.2 KB / admin 52.4 KB (gzipped).

---

## 📂 FILE ĐÃ SỬA / THÊM

### Backend
| File | Vai trò |
|---|---|
| [backend/src/store/settings.js](backend/src/store/settings.js) | DEFAULT_SETTINGS thêm `branding`, `tracking`, `legal`, `contact` |
| [backend/src/store/products.js](backend/src/store/products.js) | `isWithinSchedule` filter trong `listActiveProducts` |
| [backend/src/routes/backup.js](backend/src/routes/backup.js) | **MỚI** — export JSON/CSV + import backup |
| [backend/src/index.js](backend/src/index.js) | Mount 3 route mới: `/api/backup/export`, `/api/backup/export-csv`, `/api/backup/import` |

### Frontend — Pages
| File | Vai trò |
|---|---|
| [frontend/src/pages/LegalPage.jsx](frontend/src/pages/LegalPage.jsx) | **MỚI** — render 4 trang pháp lý từ settings |
| [frontend/src/pages/NotFound.jsx](frontend/src/pages/NotFound.jsx) | Polish: 3 CTA, link liên hệ |
| [frontend/src/App.jsx](frontend/src/App.jsx) | Thêm 4 route legal + mount TrackingScripts |

### Frontend — Components
| File | Vai trò |
|---|---|
| [frontend/src/components/Seo.jsx](frontend/src/components/Seo.jsx) | OG image chain + favicon dynamic |
| [frontend/src/components/Footer.jsx](frontend/src/components/Footer.jsx) | Cột "Pháp lý" + link Liên hệ + grid 4-col |
| [frontend/src/components/TrackingScripts.jsx](frontend/src/components/TrackingScripts.jsx) | **MỚI** — inject GA/Clarity/FB/TikTok pixel |
| [frontend/src/components/admin/SettingsManager.jsx](frontend/src/components/admin/SettingsManager.jsx) | 4 section UI mới (Branding/Tracking/Contact/Legal) |
| [frontend/src/components/admin/BackupManager.jsx](frontend/src/components/admin/BackupManager.jsx) | **MỚI** — UI backup/restore |
| [frontend/src/components/admin/ConfirmModal.jsx](frontend/src/components/admin/ConfirmModal.jsx) | **MỚI** — modal xác nhận shared |
| [frontend/src/components/admin/ProductManager.jsx](frontend/src/components/admin/ProductManager.jsx) | Nút Copy link + toast |
| [frontend/src/components/admin/EditProductModal.jsx](frontend/src/components/admin/EditProductModal.jsx) | Section deal expiry (startDate/endDate/autoHide) |
| [frontend/src/components/admin/AdminLayout.jsx](frontend/src/components/admin/AdminLayout.jsx) | Sidebar thêm "💾 Backup dữ liệu" |
| [frontend/src/hooks/useSiteSettings.js](frontend/src/hooks/useSiteSettings.js) | DEFAULT_SITE_SETTINGS thêm 4 nhánh mới |
| [frontend/src/pages/Admin.jsx](frontend/src/pages/Admin.jsx) | 2 route mới: /admin/bookmarklet (đã có) + /admin/backup |

---

## 🔑 ENV VARIABLES MỚI

**Không có ENV mới cho task này.** Mọi cấu hình mới (tracking ID, favicon URL, ...) đều được lưu trong `settings.json` qua admin UI → không cần redeploy khi đổi.

---

## 🧪 CÁCH TEST

### Backend
1. `cd backend && npm run dev` → backend chạy port 3001.
2. Login admin → token JWT cached trong frontend.
3. Test backup:
   - `GET /api/backup/export` (curl với Bearer) → tải file JSON.
   - `POST /api/backup/import` body = JSON file → upsert.

### Frontend
1. `cd frontend && npm run dev` → mở http://localhost:5173.
2. Vào `/admin` → login → check sidebar có **💾 Backup dữ liệu**.
3. Vào tab Backup → bấm **Export JSON** → tải file.
4. Vào **Cài đặt website**:
   - Branding → nhập URL favicon → Save → reload → check favicon tab browser.
   - Tracking → nhập GA ID test → reload → DevTools Network thấy gtag.js load.
   - Contact → nhập phone/zalo → mở `/contact` → check render đúng.
   - Legal → nhập markdown → mở `/privacy-policy` → render đúng.
5. ProductManager → bấm **🔗 Copy link** mỗi sản phẩm → check toast + clipboard.
6. Edit Product → set startDate tương lai → Save → mở `/products` → SP đó chưa hiện.
7. Edit Product → set endDate quá khứ + autoHideExpired=true → Save → reload → SP biến mất khỏi public.
8. Mở `/random-url-not-exists` → check 404 page đẹp với 3 CTA.

---

## 🚫 PHẦN CHƯA LÀM (theo yêu cầu user)

1. **Supabase migration** — code dual-impl đã sẵn từ commit `e0ca8ec`, chỉ chờ user set ENV. Hướng dẫn ở [SUPABASE_SETUP.md](SUPABASE_SETUP.md).
2. **Custom domain** — vẫn dùng `lion-affiliate.vercel.app`.

## 🎯 PHẦN ĐỀ XUẤT TƯƠNG LAI (chưa làm)

- **Image WebP transformation cho Cloudinary URLs**: detect Cloudinary URL → auto thêm `f_auto,q_auto` trong URL transformation (đã có `f_auto` mặc định nếu admin set preset đúng).
- **Hết hạn badge visual**: hiện badge "⏰ Hết hạn" trong ProductCard / ProductDetail khi `autoHideExpired===false && now > endDate`. Hiện tại chỉ filter; chưa wire badge.
- **Confirm modal apply rộng hơn**: hiện chỉ Backup dùng ConfirmModal mới. Trash/bulk delete vẫn dùng `window.confirm()` (đủ cho launch).
- **Empty state public**: đã polished từ batch trước.
- **Email delivery**: admin có thể nhận email khi có click conversion → cần SendGrid/Resend integration.

---

## 📊 SCOPE TỔNG KẾT

| Mục | Trạng thái |
|---|---|
| 1. Backup/Export/Import | ✅ Done |
| 2. Favicon/Logo/OG | ✅ Done |
| 3. SEO basic | ✅ Done (đã có sẵn + enhance) |
| 4. Tracking pixels | ✅ Done |
| 5. Legal pages (4 routes) | ✅ Done |
| 6. Image optimization | ✅ Đã có sẵn (LazyImage + Cloudinary) |
| 7. Error UI | ✅ ConfirmModal mới + Skeletons cũ |
| 8. Confirm modal | ✅ Done (apply vào Backup) |
| 9. Copy link | ✅ Done |
| 10. Deal expiry | ✅ Done (backend filter + form fields) |
| 11. 404 page | ✅ Polished |
| 12. Admin UX | ✅ Đã polish từ trước |
| 13. Build + changelog | ✅ Done |

**Status:** ✅ **PRODUCTION-READY trừ Supabase/domain (theo user yêu cầu giữ lại).**

Co-Authored-By: Claude Opus 4.7 (1M context)
