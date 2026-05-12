# 📚 Mock Data Examples — Tham khảo cấu trúc dữ liệu

Tài liệu này chứa mẫu dữ liệu để bạn:
1. **Hiểu cấu trúc** từng loại data
2. **Copy template** điền vào Google Sheet / admin
3. **Test giao diện** trước khi có data thật (bật `VITE_SHOW_DEMO_DATA=true`)

> ⚠️ Trên website public (production), **demo data KHÔNG hiển thị**. Chỉ data thật bạn import qua `/admin` mới hiện. File này chỉ để tham khảo.

---

## 🛍 Sản phẩm

**File mẫu**: [frontend/src/data/products.js](frontend/src/data/products.js)

```json
{
  "id": "p001",
  "title": "Nồi chiên không dầu 8L cảm ứng",
  "sourceUrl": "https://shopee.vn/-i.123456.789012",
  "affiliateUrl": "https://s.shopee.vn/aff_xxx",
  "category": "do-bep",
  "price": 1490000,
  "originalPrice": 2490000,
  "description": "Nồi chiên 8L cảm ứng, 12 chương trình tự động.",
  "images": [
    "https://i.imgur.com/airfryer1.jpg",
    "https://i.imgur.com/airfryer2.jpg",
    "https://i.imgur.com/airfryer3.jpg"
  ],
  "video": "https://example.com/video.mp4",
  "rating": 4.8,
  "reviewCount": 2105,
  "sold": 8430,
  "tags": ["Nồi chiên", "8L", "Cảm ứng"],
  "badges": ["reviewed", "hot", "bestseller"],
  "status": "active",
  "source": "manual"
}
```

### Quy tắc field

| Field | Bắt buộc? | Note |
|---|---|---|
| `id` | optional | Để trống = tự generate. Giữ id cũ = upsert. |
| `title` | ✅ | Tên hiển thị |
| `affiliateUrl` | ✅ | Link nút "Mua ngay" |
| `sourceUrl` | optional | Chỉ để scrape ảnh/giá. KHÔNG hiển thị thành link. |
| `category` | optional | Slug từ `data/categories.js` |
| `price` / `originalPrice` | optional | Number VND (49000 — không gõ dấu) |
| `images` | optional | Mảng URL. Ảnh đầu = cover |
| `badges` | optional | Mảng: `reviewed`, `hot`, `bestseller`, `new`, `deal`, `featured` |
| `status` | optional | `active` (hiện) / `hidden` (ẩn). Default `active`. |
| `source` | auto | `manual` (admin) hoặc `sheet` (Google Sheet). Tự set. |

### Thêm sản phẩm

**Cách 1 — Admin manual import** (tab Import):
- Dán Source URL + Affiliate URL → bấm Import → chỉnh sửa → Lưu

**Cách 2 — Google Sheet** (tab Google Sheet):
- Điền sản phẩm vào Sheet theo template
- Menu Apps Script → 🔄 Đồng bộ ngay

---

## 🏷 Categories (Danh mục)

**File mẫu**: [frontend/src/data/categories.js](frontend/src/data/categories.js)

```json
{ "slug": "gia-dung",  "name": "Gia dụng",  "icon": "🏠", "order": 2 }
```

8 categories mặc định:
- `all` ✨ Tất cả
- `deal` 🔥 Deal hot
- `gia-dung` 🏠 Gia dụng
- `lam-dep` 💄 Làm đẹp
- `do-bep` 🍳 Đồ bếp
- `cong-nghe` 📱 Công nghệ
- `me-be` 🍼 Mẹ & Bé
- `an-vat` 🍿 Đồ ăn vặt

> Categories vẫn được giữ làm UI structure (filter tabs) ngay cả khi `VITE_SHOW_DEMO_DATA=false`. Sửa qua `/admin → Danh mục`.

---

## 🎬 Videos

**File mẫu**: [frontend/src/data/videos.js](frontend/src/data/videos.js)

```json
{
  "id": "v1",
  "title": "Review nồi chiên không dầu 8L — có đáng mua?",
  "thumb": "https://i.imgur.com/thumb-airfryer.jpg",
  "videoUrl": "https://www.tiktok.com/@yourname/video/123",
  "views": "128K",
  "duration": "0:48",
  "productSlug": "noi-chien-khong-dau-8l-smart",
  "order": 0,
  "status": "active"
}
```

### Thêm video

`/admin → Video → ➕ Thêm video mới`:
- Tiêu đề
- Thumbnail URL (ảnh tỉ lệ 9:16 đẹp nhất)
- Video URL (link TikTok/YouTube)
- Lượt xem (text vd "128K")
- Thời lượng (vd "0:48")
- Gắn sản phẩm liên quan
- Thứ tự (số nhỏ = lên đầu)

> Section "🎬 Video review mới nhất" **tự ẩn** nếu chưa có video nào.

---

## 📚 Collections (Bộ sưu tập)

**File mẫu**: [frontend/src/data/collections.js](frontend/src/data/collections.js)

```json
{
  "slug": "do-hot-tiktok",
  "title": "Đồ hot trên TikTok",
  "emoji": "🎵",
  "cover": "https://i.imgur.com/cover.jpg",
  "desc": "Những món gây bão TikTok gần đây — mình đã test.",
  "productSlugs": ["noi-chien", "kem-chong-nang", "tai-nghe-anc"],
  "order": 0,
  "status": "active"
}
```

### Thêm collection

`/admin → Bộ sưu tập → ➕ Thêm bộ sưu tập`:
- Slug (kebab-case)
- Tiêu đề
- Emoji
- Cover URL
- Mô tả ngắn
- Tick các sản phẩm trong bộ
- Thứ tự

> Section "📚 Bộ sưu tập của mình" **tự ẩn** nếu chưa có collection nào.

---

## 🏆 Top bán chạy

Không cần data riêng — section này tự chọn top 3 từ sản phẩm thật theo:
1. Có badge `bestseller` (nếu ≥3 sản phẩm) → ưu tiên
2. Hoặc top 3 theo `sold` cao nhất

### Cách "đẩy" sản phẩm lên top

`/admin → Sản phẩm → Chỉnh sửa` → tick badge **👑 Best seller** → Lưu

> Section **chỉ hiện khi có ≥3 sản phẩm thật** (cần đủ podium 🥇🥈🥉).

---

## 📝 Blog

**File mẫu**: [frontend/src/data/blogPosts.js](frontend/src/data/blogPosts.js)

```json
{
  "slug": "top-do-bep-tien-ich-nen-mua",
  "title": "Top đồ bếp tiện ích nên mua 2026",
  "excerpt": "Tổng hợp 5 món bếp tiện lợi, đáng mua nhất.",
  "cover": "https://i.imgur.com/blog-cover.jpg",
  "author": "Minh Quang",
  "publishedAt": "2026-05-08T08:00:00Z",
  "readTime": 6,
  "tag": "Top sản phẩm",
  "productSlugs": ["noi-chien", "may-xay-mini"],
  "content": "## Heading\n\nNội dung markdown đơn giản...",
  "status": "active"
}
```

### Thêm bài viết

`/admin → Blog → ➕ Viết bài mới`:
- Slug, tiêu đề, tag, tác giả
- Cover URL
- Tóm tắt + nội dung (markdown đơn giản: `##`, `-`, `**bold**`)
- Tick các sản phẩm liên quan

> Trang `/blog` **tự empty state** nếu chưa có bài nào.

---

## ⚙️ Bật demo data để test UI

Trong `.env` (local) hoặc Vercel Environment Variables:

```env
VITE_SHOW_DEMO_DATA=true
```

→ Khi backend chưa có data, frontend fallback về mock (12 sản phẩm, 6 video, 5 collection) để bạn thấy UI đầy đủ.

**Production**: luôn đặt `VITE_SHOW_DEMO_DATA=false` để khách chỉ thấy data thật.

---

## 🔄 Workflow đề xuất

1. **Lần đầu deploy**: bật `VITE_SHOW_DEMO_DATA=true` → website có demo để team review UI
2. **Bắt đầu chuẩn bị production**: tạo Google Sheet với data thật
3. **Trước khi public**: đặt `VITE_SHOW_DEMO_DATA=false` trên Vercel → Redeploy
4. **Bấm Đồng bộ Sheet** trong /admin → sản phẩm thật xuất hiện
5. **Test xem**: vào trang chủ, demo đã biến mất, chỉ thấy data của bạn ✅

---

## 🔗 Liên kết

- [README.md](README.md) — tài liệu chính
- [GOOGLE_SHEET_SETUP.md](GOOGLE_SHEET_SETUP.md) — setup Google Sheet
- [apps-script/README.md](apps-script/README.md) — Google Apps Script sync
