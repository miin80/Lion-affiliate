# FINAL CHANGELOG — Production-ready polish batch

Ngày: 2026-05-13
Branch: `main`

Đây là changelog của **đợt polish cuối** trước khi gắn nhãn production-ready. Mục tiêu: chỉ patch các phần còn thiếu, **không rewrite**, **không phá UI public**, **không phá dữ liệu cũ**.

---

## 1. Auto-save draft (tránh mất công khi tab bị đóng / mất mạng)

Hook mới: `frontend/src/hooks/useFormDraft.js`
Banner UI: `frontend/src/components/admin/DraftBanner.jsx`

Cơ chế:
- Lưu draft vào `localStorage` với prefix `lion_affiliate_draft_<resource>_<id>` (debounce 500 ms).
- Mount form → tự check có draft chưa lưu → hiện banner amber `📝 Khôi phục nội dung chưa lưu?` kèm thời điểm savedAt.
- Khôi phục: nạp lại đúng object draft → bấm Save sẽ ghi đè và clear draft.
- Bấm Save thành công → `clearDraft()` tự xoá khỏi localStorage.
- Bấm Discard → xoá ngay, ẩn banner.

Đã plug vào toàn bộ form CRUD:
- `EditProductModal.jsx` (key: `product_<id>` hoặc `product_new`)
- `VideoManager.jsx` (key: `video_<id>` / `video_new`)
- `CollectionsManager.jsx` (key: `collection_<id>` / `collection_new`)
- `BlogsManager.jsx` (key: `blog_<id>` / `blog_new`)

> **Lý do làm:** tránh mất trắng nội dung dài (mô tả blog, danh sách productSlugs trong collection) khi vô tình reload trang hoặc mất mạng.

---

## 2. Trash UI hoàn chỉnh cho TẤT CẢ resource (3-state: active / hidden / trash)

Resources có Trash tab:
- 🗑 **Sản phẩm** — `TrashManager.jsx` (đã có từ batch trước)
- 🗑 **Video** — `VideoTrash.jsx`
- 🗑 **Bộ sưu tập** — `CollectionTrash.jsx`
- 🗑 **Blog** — `BlogTrash.jsx`
- 🗑 **Danh mục** — `CategoryTrash.jsx` (**mới trong batch này**)

Component dùng chung: `ResourceTrash.jsx` (đã refactor lại trong batch này).

Nâng cấp ResourceTrash:
- **`itemNameField` prop** — cho phép resource dùng field khác `title` (vd. category dùng `name`).
- **Bulk actions** — checkbox chọn từng item + "Chọn tất cả" → có nút:
  - `♻️ Khôi phục đã chọn` → đổi status về `hidden`
  - `💥 Xoá vĩnh viễn đã chọn` (có confirm) → DELETE thực sự
  - `✕ Bỏ chọn` → reset selection
- **Empty state đẹp hơn** — icon ✨ + dòng "Thùng rác trống".
- **Restore single + delete single** vẫn giữ y nguyên ở từng card.

CategoriesManager:
- Nút 🗑 đổi từ "hard delete" sang **moveToTrash** (status = 'trash').
- List manager đã filter bỏ item có `status === 'trash'`.

> **Lý do làm:** trước đây xoá category là xoá thẳng, không khôi phục được. Bây giờ đồng nhất 3-state với video/collection/blog/product. Bulk action để dọn nhanh khi có nhiều rác.

---

## 3. Cloudinary production flow (đã có sẵn, chỉ ghi chú cách bật)

Module: `frontend/src/services/cloudinary.js` + `MediaListEditor.jsx`

Khi nhập biến môi trường:
```
VITE_CLOUDINARY_CLOUD_NAME=<cloud_name>
VITE_CLOUDINARY_UPLOAD_PRESET=<unsigned_preset>
```
→ MediaListEditor tự kích hoạt nút "📤 Upload file" (compress browser-side trước khi upload, max 1600px JPG ~0.8 quality).

Khi **không nhập** biến môi trường → chỉ hiển thị input URL như cũ (graceful fallback, **không vỡ UI**).

**Cách setup nhanh:**
1. cloudinary.com → tạo tài khoản free (25 GB / 25k transformations/tháng).
2. Settings → Upload → Add upload preset → mode = **Unsigned**.
3. Lấy `Cloud name` + `Preset name`, dán vào Vercel → Environment variables → redeploy.

---

## 4. Skeleton loading (smooth, không nhảy layout)

Module: `frontend/src/components/Skeletons.jsx`

Skeleton đã apply:
- `ProductManager.jsx` — `ManagerCardListSkeleton`
- `VideoManager.jsx` — `ManagerCardListSkeleton`
- `CollectionsManager.jsx` — `ManagerCardListSkeleton`
- `CategoriesManager.jsx` — `ManagerCardListSkeleton`
- `BlogsManager.jsx` — `ManagerCardListSkeleton`
- `Home.jsx` — `ProductGridSkeleton` (public)
- `ProductsPage.jsx` — **`ProductGridSkeleton`** (mới plug trong batch này — trước đây chỉ hiện text "Đang tải...")

> **Lý do làm:** ProductsPage là route /products — KOL share trực tiếp link này nhiều nhất. Khi mạng chậm, hiện skeleton thay vì "Đang tải..." sẽ chuyên nghiệp hơn.

---

## 5. SEO basic + sitemap + robots.txt

File mới:
- `frontend/public/robots.txt` — Allow tất cả, Disallow `/admin` & `/api`, link sitemap.
- `frontend/public/sitemap.xml` — Liệt kê 5 route public chính (/, /products, /videos, /blog, /collections).

> **Lưu ý cần chỉnh tay khi đổi domain:** thay `https://lion-affiliate.vercel.app` trong cả 2 file thành domain production. Vite tự copy `public/*` vào `dist/` khi build, không cần cấu hình thêm.

Meta tags động: `Seo.jsx` (react-helmet-async) đã có sẵn — mỗi page (Product detail, Blog detail, Category) đều set `<title>` + `<meta description>` + Open Graph riêng.

---

## 6. Public empty state (không hiển thị demo trên production)

Đã có sẵn từ batch trước (commit `a3a450d`):
- Flag `VITE_SHOW_DEMO_DATA=true` → hiện mock products mẫu để xem layout.
- Bỏ flag hoặc `=false` → list rỗng → hiện empty state với CTA "🚪 Vào trang quản trị" (component `ProductGrid.jsx`).
- Auto-detect: chỉ cần admin upload sản phẩm đầu tiên → mock tự ẩn hoàn toàn.

---

## 7. Error handling

Toast pattern đã chuẩn hoá ở mọi manager:
- `toast = { type: 'success' | 'error', msg: '...' }`, auto clear sau 2.5s.
- Save failed → flash error với chi tiết `err.message` (vd: "Cần slug + tiêu đề").
- API call wrap try/catch khắp nơi, không có unhandled rejection.
- 401 redirect về `/admin/login` (đã có trong `services/auth.js`).

---

## 8. Trash routing + sidebar

`frontend/src/components/admin/AdminLayout.jsx`:
- Thêm menu item `cat-trash` → "Danh mục đã xoá" (icon 🗑) trong divider "Thùng rác".

`frontend/src/pages/Admin.jsx`:
- Import `CategoryTrash` + render khi `tab === 'cat-trash'`.

Toàn bộ tab Trash:
- `trash` → sản phẩm
- `video-trash` → video
- `coll-trash` → bộ sưu tập
- `blog-trash` → blog
- `cat-trash` → danh mục ⭐ MỚI

---

## File mới trong batch này

```
frontend/src/hooks/useFormDraft.js
frontend/src/components/admin/DraftBanner.jsx
frontend/src/components/admin/CategoryTrash.jsx
frontend/public/robots.txt
frontend/public/sitemap.xml
FINAL_CHANGELOG.md
```

## File đã sửa trong batch này

```
frontend/src/components/admin/EditProductModal.jsx   + useFormDraft + DraftBanner
frontend/src/components/admin/VideoManager.jsx       + useFormDraft + DraftBanner
frontend/src/components/admin/CollectionsManager.jsx + useFormDraft + DraftBanner
frontend/src/components/admin/BlogsManager.jsx       + useFormDraft + DraftBanner
frontend/src/components/admin/CategoriesManager.jsx  + remove() → moveToTrash() (status='trash'), filter trash
frontend/src/components/admin/ResourceTrash.jsx      + itemNameField prop + bulk select/restore/delete
frontend/src/components/admin/AdminLayout.jsx        + menu item cat-trash
frontend/src/pages/Admin.jsx                          + import + route CategoryTrash
frontend/src/pages/ProductsPage.jsx                   + ProductGridSkeleton khi loading
```

---

## Known limitations

1. **Render Free ephemeral disk** — file JSON store trong `backend/data/*.json` **không persist giữa các lần restart**.
   - **Source of truth:** Google Sheet (xem `GOOGLE_SHEET_SETUP.md`). Apps Script đẩy sản phẩm về `/api/import` mỗi 5 phút.
   - **Backup data:** `Cài đặt → Export JSON` để tải về định kỳ.

2. **Cloudinary chưa bắt buộc** — nếu chưa set ENV thì admin vẫn phải dán URL ảnh tay (Imgur / Shopee CDN). Setup ~3 phút khi cần.

3. **Sitemap tĩnh** — chưa generate động theo product slugs / blog slugs. Bot vẫn crawl được qua internal link từ Home → category → product detail (rel canonical đã có).

4. **Apps Script auto-sync chỉ 1 chiều** — Sheet → Web. Sửa trên Web sẽ không ngược về Sheet. Để sửa hàng loạt: edit Sheet → Apps Script tự đẩy lại.

5. **Puppeteer scraper tắt mặc định trên Render Free** — set `USE_PUPPETEER=false` + `PUPPETEER_SKIP_DOWNLOAD=true`. Shopee scrape vẫn chạy được vì dùng internal API (`/api/v4/item/get`), không cần headless browser.

---

## Production checklist nhanh

- [x] Build pass (`cd frontend && npm run build`)
- [x] Auto-save draft test (mở form → gõ → reload → khôi phục được)
- [x] Trash 3-state cho cả 4 resource + bulk action
- [x] Empty state public (không hiện mock khi production)
- [x] robots.txt + sitemap.xml ở `/public/`
- [x] Toast error pattern thống nhất
- [x] Skeleton loading cho tất cả list lớn
- [ ] (tuỳ chọn) Set Cloudinary ENV trên Vercel
- [ ] (tuỳ chọn) Đổi domain trong sitemap.xml + robots.txt khi mua domain riêng
- [ ] Backup `backend/data/*.json` định kỳ (Settings → Export)

---

## Hướng dẫn vận hành hằng ngày

**Khi cần thêm sản phẩm:**
- *Cách 1 — nhanh nhất:* paste link Shopee vào Google Sheet → 5 phút sau Apps Script tự đẩy lên web.
- *Cách 2 — thủ công:* `/admin → Import → dán Source URL + Affiliate URL → Import → sửa nhanh → Save`.

**Khi cần ẩn / khôi phục / xoá:**
- Ẩn nhẹ: `🙈` trong tab manager → status='hidden' (vẫn truy cập được URL trực tiếp).
- Vào thùng rác: 🗑 → status='trash' (biến mất hoàn toàn khỏi public).
- Khôi phục: vào tab Thùng rác tương ứng → `♻️ Khôi phục` (về status='hidden') → vào tab manager → 👁 → 'active'.
- Xoá vĩnh viễn: thùng rác → `💥 Xoá vĩnh viễn` (không khôi phục được).

**Khi đóng tab giữa chừng:**
- Form sẽ tự lưu draft local mỗi 500ms. Mở lại → banner `📝 Khôi phục nội dung chưa lưu?` → bấm `♻️ Khôi phục`.

**Khi sản phẩm sai data:**
- Bấm ✏️ trên card → sửa trực tiếp trong modal → Save (giữ nguyên ID, slug và affiliate URL nếu không đổi).

---

🤖 Co-Authored-By: Claude Opus 4.7 (1M context)
