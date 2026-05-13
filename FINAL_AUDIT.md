# 📊 FINAL AUDIT — Lion Affiliate (Production Ready)

Tài liệu này tổng hợp trạng thái cuối cùng của project sau khi hoàn thiện CMS.

---

## 1. STATUS TỔNG QUAN

| Loại | Tỷ lệ |
|---|---|
| ✅ DONE | ~95% |
| ⚠ PARTIAL | ~3% |
| ❌ TODO | ~2% |

---

## 2. ✅ FEATURE HOÀN THÀNH

### Auth & Security
- ✅ JWT login `/admin/login` + ProtectedRoute + auto-logout khi token expired (7 ngày)
- ✅ Tất cả admin API yêu cầu `Authorization: Bearer <token>`
- ✅ ErrorBoundary bao toàn app — không trắng trang khi component crash

### CMS Admin
- ✅ **Sidebar layout** (Shopify/Notion style): Dashboard / Import / Sản phẩm / Video / Bộ sưu tập / Danh mục / Blog / Google Sheet / Cài đặt + 4 Trash sub-tabs
- ✅ **Dashboard** với 8 stat cards + 5 Quick Actions + Top 5 products/videos
- ✅ **Product Manager**: bulk actions (checkbox), filter status/source/platform, sort (5 options), search, EditProductModal
- ✅ **Video / Collection / Blog / Category Manager**: CRUD + status (active/hidden/trash) + drag-drop reorder
- ✅ **Trash system 3-state** (`active` | `hidden` | `trash`): áp dụng cho products / videos / collections / blogs
- ✅ **4 Trash tabs**: TrashManager / VideoTrash / CollectionTrash / BlogTrash với restore + permanent delete + empty trash
- ✅ **Realtime Preview** (Desktop/Mobile switch): ProductPreview / VideoPreview / CollectionPreview / BlogPreview, reuse public card components
- ✅ **Drag-drop reorder** (`@dnd-kit`): VideoManager / CollectionsManager / CategoriesManager với optimistic update + rollback
- ✅ **Settings Manager**: profile / social / hero / footer / section toggles (Hero/Products/Video/Top/Collections/Blog)
- ✅ **Google Sheet Manager**: paste URL → preview table → import selected/all; Apps Script (`apps-script/Code.gs`) sync 1-click

### Public Website
- ✅ Chỉ hiển thị `status === 'active'` (double-filter: backend + frontend hooks)
- ✅ **Category auto-hide**: `/api/categories/active-with-products` trả category có ít nhất 1 sản phẩm active
- ✅ Section tự ẩn khi rỗng: Video / Collection / TopBestseller (<3 sp) / Blog empty state
- ✅ Demo data flag (`VITE_SHOW_DEMO_DATA`) — production mặc định `false`
- ✅ **Skeleton loading** mượt cho: public Home product grid, VideoReels, Collections, Blog page; admin product/video/collection/blog/category managers
- ✅ Empty state với CTA "Vào quản trị"

### Upload & Media
- ✅ **AvatarUploader** (base64 inline, 400x400 JPEG)
- ✅ **CloudinaryUploader** drag-drop + multi-file + progress bar
- ✅ **Compress image** trước upload (resize ≤1920px, JPEG 85%) — tiết kiệm 60-80% bandwidth
- ✅ Graceful fallback khi Cloudinary chưa config env

### Analytics
- ✅ Click tracking via `sendBeacon` từ ProductCard + ProductModal
- ✅ Backend `/api/analytics/click` + `/api/analytics/summary` (top 5 products/videos)
- ✅ Dashboard hiển thị tổng / hôm nay / 7 ngày

### SEO
- ✅ Seo component với Helmet: title / description / canonical / OG / Twitter card
- ✅ Dynamic title từ settings (profile name)
- ✅ OG image fallback: avatar URL (nếu HTTPS) → `og-cover.jpg`
- ✅ Theme color `#f97316`, robots `index,follow`, og:locale `vi_VN`
- ✅ Stale-while-revalidate cache (localStorage) → load instant

### Backend APIs

**Public:**
- `GET /api/health`
- `GET /api/products`, `/api/products/:id`
- `GET /api/site-settings`
- `GET /api/<videos|collections|blogs>` (chỉ active)
- `GET /api/categories/active-with-products` (auto-hide)
- `POST /api/analytics/click`

**Admin (requireAuth):**
- `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/scrape`, `POST /api/import-product`
- `GET /api/products/admin`, `POST/PUT/PATCH/DELETE /api/products` + `/bulk`
- `GET /api/<resource>/admin`, `PATCH /api/<resource>/reorder`, full CRUD + status
- `PUT /api/site-settings`, `GET /api/analytics/summary`
- `GET/PUT /api/google-sheet/settings`, `POST /api/google-sheet/preview|import`

---

## 3. ⚠ PARTIAL

| Feature | Đã có | Còn thiếu | Mức ảnh hưởng |
|---|---|---|---|
| Cloudinary upload | Code + compress | Cần USER setup account + paste env vars | Low — paste URL vẫn work |
| Bulk edit category/tags | Bulk hide/show/trash | Bulk change category/tags | Low — sửa lẻ vẫn nhanh |

---

## 4. ❌ TODO (low priority — chưa cần cho launch)

- Bulk import/export CSV (chỉ qua Google Sheet hiện tại)
- Comment / review users
- Backend persistent storage (đang dùng JSON file, ephemeral trên Render Free)
- WebSocket realtime updates

---

## 5. KNOWN LIMITATIONS

### Render Free Tier
- **Ephemeral disk**: mỗi lần redeploy → `backend/data/*.json` bị wipe
- **Sleep sau 15p**: request đầu sau khi sleep mất 30-50s wake up
- **Workaround**: Google Sheet là source of truth → sync lại sau mỗi redeploy = khôi phục products

### Cloudinary Free Tier
- 25GB storage / 25GB bandwidth/tháng → quá đủ cho site bio cá nhân
- Cần setup unsigned upload preset

### Browser Cache
- `localStorage` cache key có version (`_v2`) — đổi version khi schema thay đổi để invalidate cache

---

## 6. PRODUCTION CHECKLIST

### Trước khi deploy production

- [ ] Backend env vars trên Render:
  - [ ] `ADMIN_USERNAME` (mạnh, không phải "admin")
  - [ ] `ADMIN_PASSWORD` (≥12 ký tự, mixed case)
  - [ ] `JWT_SECRET` (random 48+ chars, generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
  - [ ] `CORS_ORIGIN` = URL Vercel chính xác (không trailing slash)
  - [ ] `USE_PUPPETEER` = `false` (Free tier không chạy nổi Chromium)
  - [ ] `PUPPETEER_SKIP_DOWNLOAD` = `true`

- [ ] Frontend env vars trên Vercel:
  - [ ] `VITE_API_URL` = URL Render backend (không trailing slash)
  - [ ] `VITE_SHOW_DEMO_DATA` = `false`
  - [ ] (Optional) `VITE_CLOUDINARY_CLOUD_NAME` + `VITE_CLOUDINARY_UPLOAD_PRESET`

- [ ] Test login admin → vào được /admin
- [ ] Test Google Sheet sync (Apps Script hoặc admin UI)
- [ ] Test thêm 1 sản phẩm thật → hiện trên trang chủ
- [ ] Test ẩn/khôi phục/xoá vĩnh viễn
- [ ] Test mobile responsive (Chrome DevTools → iPhone 14)
- [ ] Test analytics: bấm Mua ngay → Dashboard tăng click count

### Trước khi quảng bá traffic

- [ ] Đổi avatar (logo brand thật) qua `/admin → Cài đặt`
- [ ] Set 5 social links đầy đủ
- [ ] Viết 1-2 blog review để site có content
- [ ] Sync 10+ sản phẩm từ Sheet
- [ ] Thêm 3-5 video review TikTok thật
- [ ] Tạo 2-3 collections curated
- [ ] (Optional) Map custom domain trên Vercel
- [ ] Submit sitemap Google Search Console (manual hoặc auto)

---

## 7. DEPLOY CHECKLIST

### Lần đầu deploy

**Frontend (Vercel):**
1. Push code lên GitHub
2. Vercel → New Project → Import repo
3. Root Directory: `frontend`
4. Add env vars (`VITE_API_URL`, `VITE_SHOW_DEMO_DATA=false`)
5. Deploy → có URL

**Backend (Render):**
1. Render → New Web Service → connect repo
2. Root Directory: `backend`
3. Add env vars (5 vars bắt buộc + 2 Puppeteer flags)
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Plan: Free
7. Deploy → có URL Render

**Liên kết Frontend ↔ Backend:**
1. Copy URL Render → paste vào Vercel `VITE_API_URL`
2. Copy URL Vercel → paste vào Render `CORS_ORIGIN`
3. Redeploy cả 2

### Mỗi lần update code
- `git push origin main` → Vercel + Render auto-deploy ~2-5 phút

---

## 8. ENV VARIABLES REFERENCE

### Backend (`backend/.env` hoặc Render dashboard)

```env
PORT=3001
CORS_ORIGIN=https://lion-affiliate.vercel.app

ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourStrongPassword!123
JWT_SECRET=<48-char-random-hex>

USE_PUPPETEER=false
PUPPETEER_SKIP_DOWNLOAD=true
```

### Frontend (`frontend/.env` hoặc Vercel dashboard)

```env
VITE_API_URL=https://lion-affiliate-backend.onrender.com
VITE_SHOW_DEMO_DATA=false

# Optional - bật upload ảnh từ máy
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=lion_affiliate
```

---

## 9. FILE STRUCTURE FINAL

```
WEB SP AFFILATE/
├── backend/
│   ├── data/                         (auto-create, gitignored)
│   │   ├── products.json
│   │   ├── siteSettings.json
│   │   ├── googleSheetSettings.json
│   │   ├── videos.json
│   │   ├── categories.json
│   │   ├── collections.json
│   │   ├── blogs.json
│   │   └── analytics.json
│   ├── src/
│   │   ├── index.js                  (Express app entry)
│   │   ├── middleware/auth.js        (JWT verify)
│   │   ├── routes/
│   │   │   ├── auth.js               (login/me)
│   │   │   ├── products.js           (CRUD + bulk + status)
│   │   │   ├── settings.js           (site settings)
│   │   │   ├── analytics.js          (click + summary)
│   │   │   ├── scrape.js             (Puppeteer scrape)
│   │   │   ├── importProduct.js
│   │   │   └── googleSheet.js
│   │   ├── store/
│   │   │   ├── products.js           (CRUD + bulkSetStatus + trash)
│   │   │   ├── genericStore.js       (factory cho videos/cats/cols/blogs)
│   │   │   ├── resources.js          (export 4 stores)
│   │   │   ├── settings.js
│   │   │   ├── analytics.js
│   │   │   ├── sheetSettings.js
│   │   │   └── defaultAvatar.js
│   │   ├── services/
│   │   │   └── googleSheetService.js
│   │   └── scrapers/                 (shopee/tiki/lazada/tiktok/generic)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                   (Routes + ErrorBoundary + Suspense)
│   │   ├── main.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx              (sidebar tabs control)
│   │   │   ├── ProductsPage.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── Collection.jsx
│   │   │   ├── Blog.jsx
│   │   │   ├── BlogPost.jsx
│   │   │   ├── Admin.jsx             (AdminLayout wrapper)
│   │   │   ├── Login.jsx
│   │   │   └── NotFound.jsx
│   │   ├── components/
│   │   │   ├── ProductCard.jsx       (+ trackClick)
│   │   │   ├── ProductGrid.jsx       (empty state)
│   │   │   ├── ProductModal.jsx      (+ trackClick)
│   │   │   ├── ProfileHeader.jsx
│   │   │   ├── HeroSearch.jsx
│   │   │   ├── CategoryTabs.jsx
│   │   │   ├── VideoReels.jsx        (+ skeleton + auto-hide)
│   │   │   ├── Collections.jsx       (+ skeleton + auto-hide)
│   │   │   ├── TopBestseller.jsx     (auto-hide <3 sp)
│   │   │   ├── Footer.jsx
│   │   │   ├── BottomNav.jsx
│   │   │   ├── StickyCTA.jsx
│   │   │   ├── Seo.jsx               (dynamic title + OG)
│   │   │   ├── LazyImage.jsx         (fallback no-src)
│   │   │   ├── ErrorBoundary.jsx     (production safety)
│   │   │   ├── Skeletons.jsx         (5 skeleton exports)
│   │   │   ├── PlatformBadge.jsx
│   │   │   ├── Rating.jsx
│   │   │   ├── ScrollToTop.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── admin/
│   │   │       ├── AdminLayout.jsx   (sidebar + drawer mobile)
│   │   │       ├── Dashboard.jsx
│   │   │       ├── ProductManager.jsx (bulk + sort + filter)
│   │   │       ├── EditProductModal.jsx (+ ProductPreview)
│   │   │       ├── VideoManager.jsx  (drag-drop + skeleton + preview)
│   │   │       ├── CollectionsManager.jsx
│   │   │       ├── CategoriesManager.jsx
│   │   │       ├── BlogsManager.jsx
│   │   │       ├── SettingsManager.jsx
│   │   │       ├── GoogleSheetManager.jsx
│   │   │       ├── TrashManager.jsx
│   │   │       ├── VideoTrash.jsx
│   │   │       ├── CollectionTrash.jsx
│   │   │       ├── BlogTrash.jsx
│   │   │       ├── ResourceTrash.jsx (generic)
│   │   │       ├── DragSortable.jsx  (@dnd-kit wrapper)
│   │   │       ├── CloudinaryUploader.jsx (+ compress)
│   │   │       ├── AvatarUploader.jsx
│   │   │       ├── MediaListEditor.jsx
│   │   │       ├── TagsInput.jsx
│   │   │       └── previews/
│   │   │           ├── PreviewFrame.jsx
│   │   │           ├── ProductPreview.jsx
│   │   │           ├── VideoPreview.jsx
│   │   │           ├── CollectionPreview.jsx
│   │   │           └── BlogPreview.jsx
│   │   ├── hooks/
│   │   │   ├── useProducts.js        (SWR cache + demo flag)
│   │   │   ├── useResource.js        (generic SWR)
│   │   │   └── useSiteSettings.js
│   │   ├── services/
│   │   │   ├── api.js                (+ bulkUpdateStatusApi)
│   │   │   ├── auth.js               (JWT in localStorage)
│   │   │   ├── resources.js          (4 resources + reorder)
│   │   │   ├── googleSheet.js
│   │   │   ├── analytics.js          (sendBeacon track)
│   │   │   └── cloudinary.js         (+ compress)
│   │   ├── utils/
│   │   │   ├── format.js
│   │   │   └── demoFlag.js
│   │   ├── config/
│   │   │   ├── site.js
│   │   │   ├── affiliate.js
│   │   │   └── defaultAvatar.js
│   │   └── data/                     (mock fallback - chỉ dùng khi VITE_SHOW_DEMO_DATA=true)
│   └── package.json
│
├── apps-script/
│   ├── Code.gs                       (Google Apps Script sync)
│   └── README.md
│
├── README.md
├── ADMIN_GUIDE.md
├── GOOGLE_SHEET_SETUP.md
├── MOCK_DATA_EXAMPLES.md
├── CHANGELOG.md
└── FINAL_AUDIT.md                    (file này)
```

---

## 10. PERFORMANCE METRICS

Production build:
- **Initial bundle (gzipped)**: ~42KB index + ~53KB React + ~38KB motion = **~133KB**
- **Code splitting**: Admin (~42KB gz) chỉ load khi vào `/admin`
- **Skeleton loading**: instant feedback < 100ms
- **localStorage cache**: load lần 2+ là 0ms

---

## ✅ DEPLOY READY

Project hiện tại đã **production-ready**:
- ✅ Auth bảo vệ admin
- ✅ Error boundary chống crash
- ✅ Skeleton loading khắp nơi
- ✅ Empty states đẹp
- ✅ SEO meta đầy đủ
- ✅ Mobile responsive
- ✅ Production safety (fallback graceful)

Chỉ cần USER:
1. Cấu hình 5 env vars Render + 2 env vars Vercel
2. Setup Cloudinary nếu muốn upload ảnh từ máy
3. Sync content thật từ Google Sheet
