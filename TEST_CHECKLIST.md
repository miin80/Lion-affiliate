# TEST CHECKLIST — Trước khi đăng sản phẩm thật

Ngày: 2026-05-13 · Branch: `main`

Đây là checklist test thủ công cuối cùng trước khi bạn import sản phẩm thật và share link cho công chúng. Làm tuần tự, tick từng dòng.

---

## A. PUBLIC — Visitor lần đầu (chưa login admin)

### A1. Home `/`
- [ ] Logout `/admin/login` trước (xoá JWT trong DevTools → Application → Local Storage nếu cần).
- [ ] Mở `/` ở chế độ ẩn danh / cửa sổ Incognito.
- [ ] **Profile header**: avatar + tên KOL hiển thị. Không có số fake (128K/320+/98%) nếu admin chưa điền stats.
- [ ] **Hero**: badge + title + subtitle + ô search hiển thị đẹp, không vỡ layout.
- [ ] **Nút deal** (nếu có): bấm scroll xuống grid được.
- [ ] **Empty state khi 0 sản phẩm**: hiện đúng câu thân thiện:
  > "Các sản phẩm chọn lọc sẽ sớm có mặt tại đây. Hãy follow để không bỏ lỡ deal mới!"
- [ ] KHÔNG thấy nút "🚪 Vào trang quản trị".
- [ ] KHÔNG thấy chữ "Import", "Google Sheet", "admin", "quản trị".
- [ ] KHÔNG thấy dòng "0 sản phẩm" (badge đếm bị ẩn khi rỗng).

### A2. ProductsPage `/products`
- [ ] Mở `/products`.
- [ ] Cùng empty state như Home khi 0 sản phẩm.
- [ ] KHÔNG hiện "0 sản phẩm".
- [ ] HeroSearch + CategoryTabs vẫn hiển thị (navigation taxonomy).

### A3. Blog `/blog`
- [ ] Mở `/blog`.
- [ ] **Empty state khi 0 blog**: hiện đúng:
  > "Các bài review chuyên sâu sắp ra mắt. Hãy follow để là người đầu tiên đọc!"
- [ ] KHÔNG hiện nút "Vào trang quản trị".
- [ ] KHÔNG hiện chữ "Blog", "quản trị" trong empty state.

### A4. BlogPost `/blog/<slug>`
- [ ] Mở 1 slug bất kỳ không tồn tại: vd. `/blog/khong-co`.
- [ ] Hiện trang 404 sạch ("Không tìm thấy bài viết" + nút "Về Blog").
- [ ] Khi đã có blog real từ admin: vào `/blog` → click vào card → render đúng nội dung (KHÔNG bị 404).

### A5. Collection `/collection/<slug>`
- [ ] Slug không tồn tại: hiện 404 sạch.
- [ ] Khi admin đã tạo collection: click từ widget Home → render đúng + grid sản phẩm thật trong collection (không phải mock).

### A6. ProductDetail `/product/<slug>`
- [ ] Slug không tồn tại: hiện 404 sạch ("Không tìm thấy sản phẩm").
- [ ] Slug có thật: ảnh + tên + giá + nút "Mua" → click mở affiliate URL đúng.

### A7. Footer
- [ ] Tên KOL + avatar + tagline.
- [ ] Email "Liên hệ hợp tác" (nếu đã set trong Settings) hoặc ẩn nếu chưa set.
- [ ] Cột "Khám phá": Trang chủ / Tất cả sản phẩm / Blog Review.
  **KHÔNG** có link "Quản trị" cho visitor public.
- [ ] Icon social: chỉ hiện những kênh đã set URL trong Settings.
- [ ] Box "🔔 Tiết lộ liên kết tiếp thị" hiện đúng (affiliate disclosure).
- [ ] Copyright + "Made with ❤️" hiển thị bottom.

### A8. Videos + Collections widget trên Home
- [ ] Khi 0 video: section "🎬 Video review" KHÔNG hiển thị (ẩn hoàn toàn).
- [ ] Khi 0 collection: section "📚 Bộ sưu tập" KHÔNG hiển thị.
- [ ] Khi < 3 sản phẩm: section "🏆 Top bán chạy" KHÔNG hiển thị.

---

## B. ADMIN — sau khi login `/admin/login`

### B1. Đăng nhập + Dashboard
- [ ] Login với credentials trong `.env` của backend.
- [ ] Landing tab "📊 Dashboard": stats card hiển thị (sản phẩm / video / blog / collection / category).

### B2. Empty state admin (khi chưa có data)
- [ ] Home (mở `/` trong tab khác, vẫn còn login): empty state hiện text ADMIN với hint "Vào trang quản trị → Import hoặc Google Sheet" + nút.
- [ ] Footer: link "Quản trị" XUẤT HIỆN cho admin.
- [ ] Blog `/blog`: empty state admin hiện hint thêm Blog + nút.

### B3. Import sản phẩm
- [ ] Tab "📥 Import sản phẩm": dán Source URL (Shopee/TikTok/Lazada) + Affiliate URL → bấm Import.
- [ ] Backend scrape: tên + ảnh + giá tự lấy được (hoặc cảnh báo "thiếu trường" — đúng spec).
- [ ] Sửa tay các trường thiếu → Save → toast "✓ Đã lưu".
- [ ] Sang tab "🛍 Sản phẩm" → thấy item vừa save.

### B4. Google Sheet sync
- [ ] Tab "📊 Google Sheet": dán URL Sheet → Lưu → bấm "Đồng bộ ngay".
- [ ] Số rows hiển thị đúng số dòng trong Sheet.
- [ ] Mở `/` (public) → thấy sản phẩm từ Sheet.

### B5. Cloudinary upload (nếu đã set ENV)
- [ ] Vào Edit Product → nút "📤 Upload file" trong MediaListEditor.
- [ ] Upload ảnh local → tự compress + lên Cloudinary → URL tự dán vào.
- [ ] Nếu CHƯA set ENV: chỉ thấy input URL (graceful fallback, không vỡ UI).

### B6. CRUD đầy đủ — Video / Collection / Blog / Category
- [ ] Tạo mới 1 item mỗi loại → save → hiện trong list.
- [ ] Sửa → save → cập nhật đúng.
- [ ] Auto-save draft: gõ vào form → reload tab → mở lại form → banner "📝 Khôi phục nội dung chưa lưu?" → bấm khôi phục.
- [ ] Reorder drag-drop: kéo handle `⋮⋮` để sắp xếp lại thứ tự.
- [ ] Bấm 🙈 → ẩn (status='hidden') → public không thấy.
- [ ] Bấm 🗑 → đưa vào trash → public không thấy.
- [ ] Vào tab Thùng rác tương ứng → ♻️ Khôi phục → về 'hidden' → 👁 → 'active' lại.
- [ ] Bulk actions: chọn nhiều → Khôi phục đã chọn / Xoá vĩnh viễn đã chọn.

### B7. Settings
- [ ] Tab "⚙️ Cài đặt": đổi tên KOL + tagline + bio + avatar → save.
- [ ] Đổi stats (followers/reviewed/happy) → mở `/` → đúng số mới.
- [ ] Đổi social URLs → footer cập nhật icon hiển thị.
- [ ] Đổi disclosure → footer cập nhật text.

### B8. Analytics
- [ ] Tab "📊 Dashboard" hiển thị stats counters tổng + các action card.

---

## C. RESPONSIVE — Test trên thiết bị thật / DevTools

### C1. Mobile (iPhone / Android — width 375-414px)
- [ ] Home `/`: profile header ổn, hero không bị cắt chữ.
- [ ] CategoryTabs scroll ngang được, không bị tràn.
- [ ] ProductGrid: 2 cột, ảnh vuông, không vỡ.
- [ ] Footer: layout dọc, social icons không tràn.
- [ ] `/admin`: hamburger ☰ ở header, click mở drawer sidebar trượt từ trái.

### C2. Tablet (iPad — width 768-1024px)
- [ ] ProductGrid: 3 cột.
- [ ] BlogList: 2 cột.
- [ ] CollectionsGrid: 4 cột nhỏ gọn.
- [ ] `/admin`: sidebar fixed 240px bên trái, main content scroll.

### C3. Desktop (≥ 1280px)
- [ ] ProductGrid: 4 cột.
- [ ] BlogList: 3 cột.
- [ ] Hero rộng, ảnh không bị méo.
- [ ] Modal product: max-width 2xl (768px), center.

### C4. Khoảng cách + alignment
- [ ] Hero: padding đều mobile & desktop.
- [ ] Profile header: avatar overlap với gradient cover đúng vị trí.
- [ ] Footer: spacing trên/dưới phù hợp, không bị sát chân trang.

---

## D. PRODUCTION CLEANUP

- [ ] Set `VITE_SHOW_DEMO_DATA=false` trên Vercel (Environment Variables) → redeploy.
- [ ] Verify: visit `/` ở Incognito → KHÔNG thấy 12 sản phẩm mock (nồi chiên, tai nghe...).
- [ ] Verify: `/blog` không hiện 2 mock blog (top đồ bếp / tai nghe ANC) trừ khi admin đã save real.
- [ ] Verify console (F12): không có lỗi đỏ, không có `console.log` debug leak.
- [ ] Verify Network tab: API calls đi đến `lion-affiliate-backend.onrender.com`, status 200.
- [ ] Verify Source: `view-source:/` → không có comment "TODO", "FIXME", "DEBUG".

---

## E. SEO + Social share

- [ ] `view-source:https://lion-affiliate.vercel.app/` → có `<title>`, `<meta description>`, `<meta property="og:*">`.
- [ ] Open `/robots.txt`: hiện đúng Allow + Disallow `/admin` + link sitemap.
- [ ] Open `/sitemap.xml`: hiện 5 route public.
- [ ] Test share lên Facebook/Zalo: preview hiện đẹp với og:image.

---

## F. PERFORMANCE

- [ ] Lighthouse mobile: Performance ≥ 70, Accessibility ≥ 90.
- [ ] LCP < 2.5s, FID < 100ms.
- [ ] Build bundle size: ~470 KB gzipped tổng (đã đo `motion: 38.2 KB`, `react: 53.5 KB`).
- [ ] Image lazy loading hoạt động (Network: scroll xuống mới fetch ảnh).
- [ ] Skeleton hiện trong khi loading (không trắng).

---

## G. SMOKE TEST CUỐI

Chạy trên prod URL `https://lion-affiliate.vercel.app`:

1. [ ] Cold load `/` (Incognito mới): không trắng, không lỗi, render trong < 3s.
2. [ ] Click 1 ProductCard → modal mở, ảnh + giá + nút Mua hoạt động.
3. [ ] Click "Mua" → mở affiliate URL ở tab mới, có rel="nofollow sponsored".
4. [ ] Search "kem" trong HeroSearch → filter sản phẩm.
5. [ ] Click category "Đồ bếp" → filter đúng.
6. [ ] Mở ProductDetail → quay lại → state filter giữ nguyên (back button không reset hard).
7. [ ] `/admin/login` → login → CRUD 1 sản phẩm → reload `/` → thấy sản phẩm mới.

---

## H. RỦI RO ĐÃ BIẾT (chấp nhận)

| Rủi ro | Mức độ | Workaround |
|---|---|---|
| Render Free ngủ 15 phút inactive → cold start 30-60s | Medium | Cache localStorage giữ data ngay, user không bị trắng. Setup Uptime Robot ping mỗi 10 phút nếu muốn warm. |
| `backend/data/*.json` không persist trên Render Free | Critical | Google Sheet là source of truth — Apps Script tự đẩy lại. Backup JSON định kỳ qua Settings → Export. |
| Cloudinary không setup ENV → upload ảnh chỉ qua URL | Low | OK, admin paste URL từ Imgur/Shopee CDN. Set ENV bất kỳ lúc nào (3 phút). |
| Sitemap tĩnh (không sinh tự động theo slugs) | Low | Bot vẫn crawl qua internal link. Update tay khi đổi domain. |
| `data/blogPosts.js` + `data/collections.js` còn chứa mock data | Low | Production mode bỏ qua mock; chỉ kích hoạt khi `VITE_SHOW_DEMO_DATA=true`. |

---

✅ **Sau khi tick xong toàn bộ A → G**, bạn có thể yên tâm import sản phẩm thật và share link cho công chúng.

🚀 Chúc bạn thành công với Lion Affiliate!

🤖 Co-Authored-By: Claude Opus 4.7 (1M context)
