# 📘 Admin Guide — Quản trị website Lion Affiliate

Hướng dẫn dành cho người **KHÔNG biết code**. Vào `/admin` là quản lý được mọi thứ.

---

## 1. Đăng nhập admin

1. Mở https://lion-affiliate.vercel.app/admin
2. Tự chuyển sang `/admin/login`
3. Nhập:
   - **Username**: cấu hình trong Render env `ADMIN_USERNAME`
   - **Password**: cấu hình trong `ADMIN_PASSWORD`
4. Bấm **🔓 Đăng nhập** → vào trang **Dashboard**

---

## 2. Giao diện admin — Sidebar bên trái

12 menu chính:

| Menu | Chức năng |
|---|---|
| 📊 **Dashboard** | Tổng quan stats + Quick Actions |
| 📥 **Import sản phẩm** | Dán link Shopee/TikTok → scrape → lưu |
| 🛍 **Sản phẩm** | Quản lý tất cả sản phẩm (active/hidden) |
| 🎬 **Video review** | CRUD video TikTok-style |
| 📚 **Bộ sưu tập** | Curate bundle sản phẩm |
| 🏷 **Danh mục** | Quản lý category filter |
| 📝 **Blog** | Soạn bài review |
| 📊 **Google Sheet** | Bulk import từ Google Sheet |
| ⚙️ **Cài đặt website** | Profile, social, hero, buttons |
| 🗑 **Thùng rác** | Sản phẩm đã xoá (khôi phục được) |

Mobile: bấm icon **☰** góc trái trên để mở/đóng sidebar.

---

## 3. Cách thêm sản phẩm thủ công

1. Sidebar → **📥 Import sản phẩm**
2. Điền 2 ô:
   - **🔗 Product Source URL**: link Shopee/TikTok gốc (chỉ để scrape ảnh/giá)
   - **💰 My Affiliate URL**: link affiliate của bạn (nút Mua bấm vào đây)
3. Bấm **📥 Import dữ liệu sản phẩm** → backend scrape ~5-15s
4. Section preview hiện ra → chỉnh sửa tay nếu cần (tên, giá, ảnh, video, badges...)
5. Bấm **💾 Lưu sản phẩm**
6. → Sản phẩm xuất hiện trên trang chủ ngay

---

## 4. Cách sync Google Sheet (bulk import)

### Cách 1 — Qua Apps Script (khuyến nghị, 1 click)
1. Mở Google Sheet đã setup (xem [GOOGLE_SHEET_SETUP.md](GOOGLE_SHEET_SETUP.md))
2. Menu **🚀 Lion Affiliate** trong Sheet → **🔄 Đồng bộ ngay**
3. Confirm → đợi 5-10s → "✅ Đồng bộ thành công"
4. Mở website → sản phẩm mới hiện

### Cách 2 — Qua tab Google Sheet trong /admin
1. Sidebar → **📊 Google Sheet**
2. Dán URL Sheet → bấm **💾 Lưu link**
3. Bấm **🔄 Đồng bộ từ Sheet** → xem preview table
4. Tick các row muốn import → bấm **📥 Import đã chọn**
5. Hoặc bấm **📤 Import tất cả** để sync hết

> Sheet vào status = `active` → hiện trên web. Status = `hidden` → ẩn. Sheet không tự xoá sản phẩm khỏi web.

---

## 5. Cách ẩn sản phẩm (không xoá)

Sản phẩm bạn muốn tạm thời không bán affiliate:

1. Sidebar → **🛍 Sản phẩm**
2. Tìm sản phẩm cần ẩn
3. Bấm **🙈 Ẩn** (nút màu cam)
4. → Sản phẩm vẫn còn trong admin, nhưng **biến mất khỏi website public**

Muốn hiện lại: filter **"Đã ẩn"** → bấm **👁 Hiện lại**.

---

## 6. Cách đưa sản phẩm vào Thùng rác

1. Sidebar → **🛍 Sản phẩm** → bấm **🗑 Vào thùng rác**
2. Confirm popup → sản phẩm chuyển sang status `trash`
3. → Không hiện trong tab Sản phẩm nữa, không hiện trên web
4. Sản phẩm bây giờ ở **🗑 Thùng rác**

**Khác biệt giữa "Ẩn" và "Thùng rác":**
- **Ẩn**: tạm ẩn, dễ thấy trong tab Sản phẩm → bật lại nhanh
- **Thùng rác**: ý định xoá, đẩy ra khỏi flow chính, có thể xoá vĩnh viễn

---

## 7. Cách khôi phục từ Thùng rác

1. Sidebar → **🗑 Thùng rác**
2. Tìm sản phẩm muốn khôi phục
3. Bấm **♻️ Khôi phục**
4. → Sản phẩm về status `hidden` (còn ẩn — chưa hiện trên web)
5. Vào tab **🛍 Sản phẩm** → filter **"Đã ẩn"** → bấm **👁 Hiện lại** nếu muốn lên web

---

## 8. Cách xoá VĨNH VIỄN

⚠️ Chỉ xoá được từ **🗑 Thùng rác**. Đây là bước cuối, KHÔNG khôi phục được.

1. Sản phẩm phải ở Thùng rác trước
2. Tab **🗑 Thùng rác** → bấm **💥 Xoá vĩnh viễn**
3. Confirm 2 lần (popup hỏi xác nhận)
4. → Sản phẩm bị xoá khỏi `products.json`. Mất luôn.

**Xoá hàng loạt**: bấm **💥 Dọn thùng rác** ở góc phải trên → xoá tất cả sản phẩm trong trash.

---

## 9. Upload ảnh

### Cách hiện tại (đang dùng)
- Sản phẩm: paste URL ảnh trong ô "Ảnh sản phẩm" (mỗi URL Enter một lần)
- Avatar: click vào avatar trong **⚙️ Cài đặt** → file picker → tự upload base64 inline
- Nguồn URL ảnh:
  - **Imgur** (free, nhanh): https://imgur.com → kéo thả → copy direct link
  - **Cloudinary** (free 25GB): https://cloudinary.com
  - **FB CDN**: chuột phải ảnh → "Copy image address"

### Cloudinary (chưa cấu hình — coming soon)

Khi tôi push Cloudinary integration, bạn cần:
1. Đăng ký https://cloudinary.com (free)
2. Lấy `Cloud Name`, `API Key`, `API Secret`
3. Trên Render → Environment → thêm 3 env vars:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. Khi đó nút **📤 Upload từ máy** sẽ xuất hiện trong form sản phẩm/video.

---

## 10. Cách thêm video review

1. Sidebar → **🎬 Video review** → **➕ Thêm video mới**
2. Điền:
   - Tiêu đề video
   - Thumbnail URL (ảnh tỉ lệ 9:16)
   - Video URL (link TikTok/YouTube)
   - Lượt xem hiển thị (vd `128K`)
   - Thời lượng (vd `0:48`)
   - **Sản phẩm liên quan**: select từ dropdown
   - Affiliate URL (override, có thể để trống)
   - Thứ tự (số nhỏ = lên đầu)
3. Bấm **💾 Lưu**
4. → Hiện trên trang chủ section "🎬 Video review mới nhất"

---

## 11. Cách tạo bộ sưu tập

1. Sidebar → **📚 Bộ sưu tập** → **➕ Thêm bộ sưu tập**
2. Điền slug (tiếng Việt không dấu), tiêu đề, emoji, cover URL, mô tả
3. **Tick các sản phẩm** muốn đưa vào bộ
4. Set thứ tự
5. Bấm **💾 Lưu**
6. → Trang chủ section "📚 Bộ sưu tập của mình" hiển thị

Khách bấm bộ → vào `/collection/<slug>` xem chỉ sản phẩm trong bộ đó.

---

## 12. Cách xem analytics (click)

1. Sidebar → **📊 Dashboard**
2. Card **"👆 Tổng click"** ở section Nội dung → số click tổng / hôm nay / 7 ngày
3. Phía dưới: **Top 5 sản phẩm click nhiều** + **Top 5 video click nhiều**

Mỗi khi khách bấm **"Mua ngay"** trên website, frontend gửi 1 beacon → backend tăng counter. Data lưu trong `analytics.json`.

**Lưu ý**: Như `products.json`, `analytics.json` cũng bị wipe khi Render Free redeploy. Để giữ vĩnh viễn cần upgrade Render hoặc migrate sang database.

---

## 13. Cách bật/tắt demo mode

Khi chưa có sản phẩm thật, website công khai sẽ trống (empty state). Để **demo UI cho team**, bật demo mode:

### Local dev
File `frontend/.env`:
```env
VITE_SHOW_DEMO_DATA=true
```

### Production (Vercel)
1. Vercel Dashboard → project `lion-affiliate` → **Settings → Environment Variables**
2. Edit `VITE_SHOW_DEMO_DATA` → `true` (hoặc `false` cho production thật)
3. **Save** → tab **Deployments** → **Redeploy** (bỏ tick build cache)

| Giá trị | Hành vi |
|---|---|
| `true` | Backend trống → fallback 12 mock products, 6 video, 5 collection để demo UI |
| `false` (mặc định) | Không demo. Section trống = empty state hoặc ẩn |

---

## 14. Cách deploy lại

### Frontend (Vercel) — auto
Mỗi lần `git push` lên `main` → Vercel auto-build + deploy ~2 phút. Bạn không cần làm gì.

### Backend (Render) — auto
Cũng auto-deploy mỗi `git push` ~5-10 phút (Puppeteer install lâu).

**Force redeploy** (khi cần):
- Vercel: **Deployments** → deploy mới nhất → `…` → **Redeploy**
- Render: project → **Manual Deploy** → **Deploy latest commit**

### Xem trạng thái deploy
- Vercel: https://vercel.com/dashboard → `lion-affiliate` → Deployments
- Render: https://dashboard.render.com → `lion-affiliate-backend` → Events

---

## 15. Cấu hình quan trọng

### Backend (Render Environment Variables)
| Key | Mục đích | Ví dụ |
|---|---|---|
| `ADMIN_USERNAME` | Username login | `admin` |
| `ADMIN_PASSWORD` | Password login | `StrongPass!2026` |
| `JWT_SECRET` | Random secret JWT | (chuỗi 48+ ký tự random) |
| `CORS_ORIGIN` | URL Vercel cho phép | `https://lion-affiliate.vercel.app` |
| `USE_PUPPETEER` | Bật Puppeteer scrape | `false` (Render Free) |
| `PUPPETEER_SKIP_DOWNLOAD` | Skip Chromium install | `true` (Render Free) |

### Frontend (Vercel Environment Variables)
| Key | Mục đích | Ví dụ |
|---|---|---|
| `VITE_API_URL` | URL backend | `https://lion-affiliate-backend.onrender.com` |
| `VITE_SHOW_DEMO_DATA` | Bật demo data | `false` (production) |

---

## 16. Troubleshooting

### "Failed to fetch" khi login
- Backend đang ngủ (Render Free) → đợi 30-50s rồi thử lại
- Hoặc CORS sai → check `CORS_ORIGIN` env

### Sản phẩm không hiện trên web
- Status có phải `active`?
- Hard refresh: **Ctrl + Shift + R**
- Backend đã deploy thành công?

### Render redeploy mất data
- Đây là hạn chế Render Free (ephemeral disk)
- Workaround: Google Sheet là source of truth → bấm Sync khi cần khôi phục
- Hoặc upgrade Render Paid ($7/mo) có persistent disk

### Quên password admin
- Vào Render → Environment → **ADMIN_PASSWORD** → bấm con mắt 👁 để xem
- Hoặc đổi password mới (Save → backend tự redeploy)

---

## 17. Limit & Best Practices

- **Sản phẩm**: không có limit cứng, nhưng > 200 sản phẩm thì products.json sẽ chậm. Lúc đó migrate sang database (Supabase).
- **Ảnh sản phẩm**: max 8 ảnh/sản phẩm là vừa đẹp.
- **Backup**: định kỳ bấm "Sync Sheet" → Sheet là backup. Hoặc tải `products.json` về máy qua API.
- **Đặt id sản phẩm thủ công** (p001, p002...) → dễ upsert, dễ tracking analytics.

---

## 🔗 Liên kết

- [README.md](README.md) — tài liệu chính
- [GOOGLE_SHEET_SETUP.md](GOOGLE_SHEET_SETUP.md) — setup Google Sheet
- [apps-script/README.md](apps-script/README.md) — Apps Script sync
- [MOCK_DATA_EXAMPLES.md](MOCK_DATA_EXAMPLES.md) — cấu trúc data mẫu

## 🆘 Cần thêm chức năng?

Còn các phần đang được phát triển tiếp:
- Cloudinary upload (drag-drop ảnh từ máy)
- Drag & drop reorder video/collection
- Live preview mobile/desktop trong form
- Bulk edit category/tags
- Export sản phẩm về CSV

Báo nhu cầu cụ thể, tôi sẽ ưu tiên build.
