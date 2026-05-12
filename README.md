# 🌟 ReviewHub — KOL Affiliate Link-in-Bio

Website affiliate phong cách **link-in-bio của TikToker/KOL**: tổng hợp sản phẩm đã review, có ảnh, video, deal, giá, link affiliate. Người xem từ video TikTok/Facebook bấm bio → vào đây → bấm mua → bạn nhận hoa hồng.

```
TikTok / Facebook video
     ↓ (link bio)
   ReviewHub  ←  bạn đang ở đây
     ↓ (CTA Mua ngay)
 Shopee / TikTok Shop / Lazada / Tiki
     ↓
   💰 Hoa hồng affiliate
```

## ✨ Tính năng

- **Profile header** kiểu KOL: avatar, bio, social icons, nút Theo dõi.
- **Hero + Search**: tìm sản phẩm nhanh.
- **Category tabs** dạng pill (cuộn ngang trên mobile).
- **Product card**: nhãn "Đã review", "HOT", "% giảm", giá, rating, 2 nút (Xem deal / Mua ngay).
- **Modal chi tiết** dạng bottom-sheet trên mobile.
- **Video reels** TikTok-style.
- **Top bán chạy** podium 🥇🥈🥉.
- **Bộ sưu tập** curated bundle.
- **Bottom nav** mobile.
- **Sticky CTA** mobile (Theo dõi mình trên TikTok).
- **Admin** (`/admin`): dán link sản phẩm → backend tự fetch ảnh / video / giá / tên.
- **Affiliate config** tập trung — đổi mã affiliate 1 chỗ.
- **SEO**: react-helmet, OG tags, canonical, sitemap-friendly URLs.
- **Lazy load** ảnh + code-splitting routes.
- **Mobile-first** 100% responsive.

## 📁 Cấu trúc thư mục

```
WEB SP AFFILATE/
├── frontend/                 React + Vite + Tailwind
│   ├── src/
│   │   ├── config/
│   │   │   ├── site.js       👈 Profile KOL (avatar, bio, socials)
│   │   │   └── affiliate.js  👈 Mã affiliate, wrap URL
│   │   ├── data/
│   │   │   ├── products.js   👈 12 sản phẩm mẫu (sửa/thêm tại đây)
│   │   │   ├── categories.js
│   │   │   ├── collections.js
│   │   │   ├── videos.js
│   │   │   └── blogPosts.js
│   │   ├── components/       Reusable UI
│   │   ├── pages/            Home, Products, ProductDetail, Admin, Blog...
│   │   └── services/api.js   Gọi backend scrape
│   └── package.json
│
└── backend/                  Express + Puppeteer
    ├── src/
    │   ├── index.js          Entry server
    │   ├── routes/scrape.js  POST /api/scrape
    │   └── scrapers/
    │       ├── index.js      Dispatcher theo platform
    │       ├── shopee.js     (API JSON + Puppeteer fallback)
    │       ├── tiktok.js     (Puppeteer)
    │       ├── lazada.js     (Puppeteer + window state)
    │       ├── tiki.js       (API JSON)
    │       └── generic.js    (axios + cheerio + Open Graph)
    └── package.json
```

---

## 🚀 Cách chạy local

### Yêu cầu
- Node.js 18+
- npm hoặc pnpm/yarn

### 1. Cài đặt frontend

```bash
cd frontend
npm install
cp .env.example .env       # hoặc copy thủ công trên Windows
npm run dev
```

→ Mở http://localhost:5173

### 2. Cài đặt backend (cho chức năng auto-fetch link)

Mở terminal thứ 2:

```bash
cd backend
npm install                # sẽ tải Chromium ~170MB cho Puppeteer
cp .env.example .env
npm run dev
```

→ Backend chạy tại http://localhost:4000
→ Health check: http://localhost:4000/api/health

> **Lưu ý**: Vite dev server đã proxy `/api/*` sang `http://localhost:4000`, nên frontend gọi `/api/scrape` tự động hoạt động.

> **Nếu không muốn dùng backend** (chỉ demo UI): cứ chạy frontend là đủ. Trang `/admin` sẽ báo "không kết nối backend" và dùng fallback tối thiểu.

---

## 🔑 Nguyên tắc Source URL vs Affiliate URL

Đây là **điểm quan trọng nhất** của hệ thống:

| | Source URL | Affiliate URL |
|---|---|---|
| **Mục đích** | Chỉ để scraper backend lấy ảnh/video/tên/giá | Link khách bấm để mua hàng |
| **Hiển thị?** | KHÔNG. Không bao giờ render thành link click | CÓ. Gắn vào tất cả nút "Mua ngay" |
| **Có affiliate ID?** | KHÔNG (link gốc) | CÓ (đã có mã của bạn) |
| **Khi nào dùng** | 1 lần lúc admin import | Mỗi lần khách bấm mua |

Code đảm bảo nguyên tắc này tại [components/ProductCard.jsx](frontend/src/components/ProductCard.jsx):
```jsx
// Quy tắc: nút Mua dùng affiliateUrl. KHÔNG bao giờ link tới sourceUrl trần.
const buyUrl = product.affiliateUrl?.trim()
  || (product.sourceUrl ? getAffiliateUrl(product.sourceUrl) : '#');
```

---

## ➕ Cách import sản phẩm mới

### Quy trình chuẩn (qua Admin)

1. Chạy đồng thời **frontend** + **backend** (xem mục Cách chạy local).
2. Mở http://localhost:5173/admin
3. Điền form:
   - **🔗 Product Source URL**: dán link gốc Shopee/TikTok Shop/Lazada (chỉ dùng để scrape)
   - **💰 My Affiliate URL**: dán link affiliate của bạn (đã chứa mã affiliate)
4. Bấm **📥 Import dữ liệu sản phẩm** → backend dùng Puppeteer fetch ảnh/video/tên/giá.
5. Section **📝 Chỉnh sửa & xem trước** hiện ra:
   - Sửa lại tên/giá/mô tả nếu cần
   - Chọn **Danh mục** + thêm **Tags**
   - Thêm/xoá/sắp xếp ảnh và video (paste URL bất kỳ)
   - Toggle các badge: Đã review, Hot, Best seller, Mới...
   - Xem **Live preview** card hiển thị y hệt trên web
6. Bấm **💾 Lưu sản phẩm** → lưu vào `backend/data/products.json`.
7. Khách truy cập website thấy ngay sản phẩm — **không scrape lại** mỗi lần.

### Trường hợp scrape fail (Shopee/TikTok chặn bot)

Backend sẽ trả về warning **"Không tự lấy đủ dữ liệu"**. Bạn vẫn có thể:

1. Nhập tay **tên sản phẩm**, **giá**, **mô tả**.
2. Paste URL ảnh thủ công vào ô MediaListEditor (mỗi URL Enter một lần).
   - Tips: upload ảnh lên [imgur.com](https://imgur.com) / [cloudinary.com](https://cloudinary.com) → copy direct link → paste.
   - Hoặc dùng URL ảnh từ trang sản phẩm gốc (click chuột phải → Copy image address).
3. Paste URL video MP4 nếu có.
4. Bấm **💾 Lưu** — website vẫn hoạt động bình thường.

### Cấu trúc dữ liệu sản phẩm đã lưu

File: `backend/data/products.json` (tự tạo khi lưu sản phẩm đầu tiên).
```json
{
  "id": "p_1715600000_abc12",
  "slug": "tui-giay-lau-tay",
  "title": "Túi giấy lau tay 100 tờ",
  "sourceUrl": "https://shopee.vn/...",
  "affiliateUrl": "https://s.shopee.vn/aff_xxx",
  "images": ["https://...", "https://..."],
  "videos": ["https://...mp4"],
  "price": 49000,
  "originalPrice": 89000,
  "description": "Mô tả ngắn...",
  "category": "gia-dung",
  "tags": ["Giấy lau", "Tiện ích"],
  "rating": 4.8,
  "badges": ["reviewed", "hot"],
  "platform": "shopee",
  "createdAt": "2026-05-12T10:00:00Z",
  "updatedAt": "2026-05-12T10:00:00Z"
}
```

### Cách 2 — Sửa tay file `products.js` (data demo)

Mở [frontend/src/data/products.js](frontend/src/data/products.js), copy 1 object trong mảng `PRODUCTS`, thay các field:

```js
{
  id: 'p13',                      // id duy nhất
  slug: 'ten-san-pham-co-dau-gach',
  title: 'Tên sản phẩm',
  shortDesc: 'Mô tả 1 câu',
  fullDesc: 'Review chi tiết của bạn...',
  pros: ['Ưu điểm 1', 'Ưu điểm 2'],
  forWho: 'Phù hợp với ai',
  price: 199000,
  originalPrice: 299000,
  rating: 4.8,
  reviewCount: 1200,
  sold: 5000,
  images: ['url1', 'url2'],
  video: 'https://...mp4',        // null nếu không có
  affiliateUrl: 'https://shopee.vn/product/...',
  platform: 'shopee',             // shopee | tiktok | lazada | tiki | other
  category: 'do-bep',             // slug trong categories.js
  tags: ['Tag1', 'Tag2'],
  badges: ['hot', 'deal', 'reviewed'], // hot | new | deal | featured | reviewed
  createdAt: '2026-05-15T10:00:00Z',
}
```

Save → Vite hot-reload, sản phẩm hiện ngay.

### Thêm video review

Mở [frontend/src/data/videos.js](frontend/src/data/videos.js), copy 1 object, thay `thumb` (ảnh thumbnail) + `videoUrl` (link TikTok) + `productSlug` (slug sản phẩm liên quan).

### Thêm "Bộ sưu tập"

Mở [frontend/src/data/collections.js](frontend/src/data/collections.js), thêm 1 object với `productSlugs: [...]` là slug của các sản phẩm trong bộ sưu tập.

### Thêm danh mục mới

Mở [frontend/src/data/categories.js](frontend/src/data/categories.js), thêm 1 object:

```js
{ slug: 'thu-cung', name: 'Thú cưng', icon: '🐾' }
```

---

## 🔗 Cách thay affiliate link / mã affiliate

### Cách A — Sản phẩm đã import qua Admin
Vào `/admin`, tìm sản phẩm trong danh sách **📦 Sản phẩm đã lưu** → xoá → re-import với affiliate URL mới.
Hoặc edit thẳng file `backend/data/products.json` (tìm `affiliateUrl` và sửa, rồi restart backend hoặc bấm "↻ Reload" trong admin).

### Cách B — Đổi mặc định auto-wrap (dùng cho mock products)
Mở [frontend/src/config/affiliate.js](frontend/src/config/affiliate.js):

```js
shopee: {
  ...
  affiliateId: 'YOUR_SHOPEE_AFF_ID',   // 👈 đổi thành ID của bạn
  paramKey: 'af_sub_siteid',
  ...
},
tiktok: {
  affiliateId: 'YOUR_TIKTOK_AFF_ID',   // 👈
  paramKey: 'aff_id',
},
lazada: {
  affiliateId: 'YOUR_LAZADA_AFF_ID',   // 👈
  paramKey: 'sub_aff_id',
},
```

> Mỗi khi user bấm "Mua ngay", URL gốc sẽ được wrap qua `getAffiliateUrl()` để chèn mã của bạn.

> Tuỳ chương trình affiliate (Shopee Affiliate, TikTok Affiliate, Lazada Affiliate, ECOMOBI, Accesstrade…), tham số có thể khác. Đổi `paramKey` cho phù hợp, hoặc viết lại hàm `wrap(url, cfg)` để tạo deeplink riêng.

---

## 👤 Cách thay profile (avatar, tên, bio, social)

Mở [frontend/src/config/site.js](frontend/src/config/site.js):

```js
export const SITE = {
  name: 'Tên của bạn',
  tagline: '...',
  shortBio: 'Mô tả ngắn (xuất hiện dưới avatar)',
  avatar: 'https://i.pravatar.cc/300?img=47',  // 👈 đổi URL ảnh
  stats: { followers: '128K', reviewed: '320+', happy: '98%' },
  socials: {
    tiktok: 'https://tiktok.com/@yourname',
    facebook: 'https://facebook.com/yourname',
    instagram: 'https://instagram.com/yourname',
    youtube: '',     // để rỗng để ẩn icon
  },
  followUrl: 'https://tiktok.com/@yourname',
};
```

**Cách dùng avatar local:** bỏ ảnh vào `frontend/public/avatar.jpg` rồi đặt `avatar: '/avatar.jpg'`.

---

## 📤 Cách upload lên GitHub

### Bước 1 — Tạo repo trên GitHub

1. Đăng nhập [github.com](https://github.com).
2. Bấm dấu **+** góc phải trên → **New repository**.
3. Đặt tên (vd `mira-reviews-affiliate`).
4. Chọn **Private** (nếu muốn ẩn) hoặc **Public**.
5. **KHÔNG** check "Add a README", "Add .gitignore" — vì project đã có sẵn.
6. Bấm **Create repository**.

### Bước 2 — Kiểm tra Git đã cài chưa

Mở PowerShell trong thư mục project:

```powershell
git --version
```

Nếu chưa cài → tải tại [git-scm.com](https://git-scm.com/download/win) → cài đặt mặc định.

Lần đầu dùng git cần config tên + email:

```powershell
git config --global user.name "Tên của bạn"
git config --global user.email "email@example.com"
```

### Bước 3 — Push code lên GitHub

Trong thư mục `WEB SP AFFILATE`:

```powershell
git init
git add .
git commit -m "init: KOL affiliate link-in-bio"
git branch -M main
git remote add origin https://github.com/yourname/mira-reviews-affiliate.git
git push -u origin main
```

> Lần đầu push, GitHub sẽ yêu cầu login. Nếu hỏi mật khẩu thì cần **Personal Access Token** (GitHub đã bỏ password thường): vào GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic) → tick `repo` → copy token → dán làm password.

### Bước 4 — Sau này muốn cập nhật code

```powershell
git add .
git commit -m "update: thêm sản phẩm mới"
git push
```

---

## ☁️ Cách deploy lên Vercel

### Bước 1 — Push code lên GitHub

Làm theo phần **"Cách upload lên GitHub"** ở trên.

### Bước 2 — Deploy frontend trên Vercel

1. Đăng nhập [vercel.com](https://vercel.com).
2. **New Project** → import repo GitHub.
3. **Root directory**: `frontend`
4. **Framework Preset**: Vite (Vercel tự detect).
5. **Environment Variables**:
   - `VITE_API_URL` = URL backend của bạn (ví dụ `https://your-scraper.onrender.com`)
   - Để rỗng nếu chưa deploy backend (trang Admin sẽ không fetch được, nhưng phần còn lại vẫn hoạt động).
6. Bấm **Deploy**.

Sau ~1 phút bạn có URL: `https://your-project.vercel.app`

### Bước 3 — Deploy backend (Puppeteer)

Vercel serverless **không chạy được Puppeteer** ổn định. Khuyến nghị deploy backend ở dịch vụ khác:

**Option A — Render.com (free tier, dễ nhất):**
1. Tạo Web Service mới, connect GitHub repo.
2. **Root Directory**: `backend`
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. Environment: `CORS_ORIGIN=https://your-project.vercel.app`

**Option B — Railway / Fly.io / VPS riêng**: tương tự, miễn là Node 18+ và đủ RAM cho Chromium (~500MB).

Sau khi backend chạy, copy URL public của nó (vd `https://scraper.onrender.com`) và update biến `VITE_API_URL` trên Vercel → redeploy frontend.

### Bước 4 — Kết nối domain riêng

1. Mua domain (Namecheap, GoDaddy, INET, Tenten...).
2. Vào Vercel project → **Settings** → **Domains** → **Add**.
3. Nhập domain (vd `mira-reviews.com`).
4. Vercel sẽ hiển thị bản ghi DNS cần thêm:
   - Loại **A**: `76.76.21.21`
   - Loại **CNAME** cho `www`: `cname.vercel-dns.com`
5. Vào trang quản lý DNS của nhà cung cấp domain → thêm 2 bản ghi trên.
6. Đợi DNS propagate (5-30 phút). Vercel tự cấp SSL.
7. Update `SITE.url` trong `frontend/src/config/site.js` thành domain mới (cho SEO canonical).

---

## 🎬 Funnel hoạt động thế nào

1. Bạn làm video TikTok/Facebook review sản phẩm.
2. Trong bio TikTok dán link website (vd `https://mira-reviews.com`).
3. Người xem bấm bio → vào website.
4. Họ thấy bạn, các sản phẩm bạn review, deal hot.
5. Họ bấm **Mua ngay** → mở Shopee/TikTok Shop kèm mã affiliate của bạn.
6. Họ mua → bạn nhận hoa hồng.

**Cách hệ thống lưu data** (không scrape lại mỗi visit):

1. Admin bấm "Import" → backend Puppeteer chạy 1 lần → trả metadata.
2. Admin sửa/duyệt → bấm "Lưu" → ghi vào `backend/data/products.json`.
3. Khách vào web → frontend gọi `GET /api/products` → nhận data đã lưu.
4. Sản phẩm hiển thị ngay, không trigger scrape. Card có nút Mua → link **affiliate** của bạn.

**Tips tối ưu conversion** (đã build sẵn):
- Sticky CTA "Theo dõi" để giữ traffic.
- Bottom nav để dễ điều hướng trên mobile.
- Badge "Đã review" tạo niềm tin.
- Modal mở nhanh, không phải load page mới.
- Ảnh lazy load, page < 100KB initial.

---

## 🛠️ Tech stack

- **Frontend**: React 18 · Vite 5 · TailwindCSS 3 · React Router 6 · Framer Motion · react-helmet-async
- **Backend**: Node 18+ · Express · Puppeteer · Cheerio · Axios

## 📜 License

MIT — dùng tự do cho mục đích thương mại của bạn.
