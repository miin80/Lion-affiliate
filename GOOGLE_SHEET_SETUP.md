# 📊 Google Sheet Bulk Import — Hướng dẫn setup

Quản lý hàng trăm sản phẩm affiliate qua 1 Google Sheet. Sửa Sheet → bấm **🔄 Đồng bộ** trong `/admin` → website update.

---

## ⚡ Quick start (5 phút)

### Bước 1 — Copy template Sheet

1. Mở Google Sheets mới: https://sheets.new
2. **Dòng 1** (header) — paste chính xác các tên cột sau (tab phân cách):
   ```
   id	title	sourceUrl	affiliateUrl	category	price	oldPrice	description	image	gallery	video	rating	tags	isHot	isBestSeller	status
   ```
3. Từ **dòng 2** trở đi, mỗi dòng = 1 sản phẩm.

### Bước 2 — Điền dữ liệu mẫu

| id | title | sourceUrl | affiliateUrl | category | price | oldPrice | description | image | gallery | video | rating | tags | isHot | isBestSeller | status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| p001 | Túi giấy lau tay 100 tờ siêu thấm | https://shopee.vn/-i.123.456 | https://s.shopee.vn/aff_xyz | gia-dung | 49000 | 89000 | Giấy lau tay an toàn... | https://i.imgur.com/abc.jpg | https://i.imgur.com/def.jpg, https://i.imgur.com/ghi.jpg | | 4.8 | giấy, lau tay, gia dụng | true | false | active |
| p002 | Nồi chiên không dầu 8L | https://shopee.vn/-i.789.012 | https://s.shopee.vn/aff_abc | do-bep | 1490000 | 2490000 | Nồi chiên 8L cảm ứng | https://i.imgur.com/xyz.jpg | | https://example.com/video.mp4 | 4.9 | nồi, chiên, bếp | true | true | active |

### Bước 3 — Publish Sheet

1. Trong Google Sheet → menu **File** → **Share** → **Publish to web**
2. Chọn:
   - **Link**: chọn sheet/tab muốn share
   - **Format**: **Comma-separated values (.csv)**
3. Bấm **Publish** → confirm
4. **Copy URL** dạng `https://docs.google.com/spreadsheets/d/.../pub?output=csv`

> 💡 Hoặc đơn giản: copy URL từ thanh địa chỉ Sheet (dạng `.../edit?...`) — backend tự convert sang CSV export URL.
>
> ⚠️ Quan trọng: nếu Sheet **private**, backend không fetch được. Phải set Share → "Anyone with the link can view" hoặc Publish to web.

### Bước 4 — Paste vào /admin

1. Vào https://lion-affiliate.vercel.app/admin/login → đăng nhập admin
2. Tab **📊 Google Sheet**
3. Paste URL Sheet vào ô **Google Sheet URL**
4. Bấm **💾 Lưu link** (lưu để lần sau không phải paste lại)
5. Bấm **🔄 Đồng bộ từ Sheet**
6. Hệ thống fetch + parse + hiển thị table preview với:
   - ✅ Số dòng hợp lệ
   - ⚠️ Cảnh báo (thiếu ảnh, thiếu affiliate URL...)
   - ❌ Lỗi (thiếu title — không thể import)

### Bước 5 — Import

- **📥 Import đã chọn**: chỉ import những row đã tick (default: tự tick row hợp lệ + status active)
- **📤 Import tất cả**: import toàn bộ row hợp lệ + status active

Sau khi import xong → vào tab **📦 Sản phẩm** thấy sản phẩm mới ngay ✅.

---

## 📋 Quy tắc & format các cột

| Cột | Bắt buộc? | Format | Note |
|---|---|---|---|
| `id` | Optional | string | Để upsert (cập nhật sản phẩm cũ thay vì tạo mới). Rỗng = tạo mới. |
| `title` | **✅ Bắt buộc** | text | Tên sản phẩm. Thiếu → bỏ qua dòng. |
| `sourceUrl` | Optional | URL | Link gốc để **scrape** (Shopee/TikTok...). KHÔNG render thành link. |
| `affiliateUrl` | **✅ Khuyến nghị** | URL | Link nút Mua. Thiếu → cảnh báo, nút Mua trỏ về sourceUrl. |
| `category` | Optional | slug | `gia-dung`, `do-bep`, `lam-dep`, `cong-nghe`, `me-be`, `an-vat`. Mặc định `gia-dung`. |
| `price` | Optional | number (VND) | `49000` (không gõ "đ" / phẩy / chấm). |
| `oldPrice` | Optional | number | Giá gốc (gạch ngang). |
| `description` | Optional | text | Mô tả ngắn. |
| `image` | Optional | URL | Ảnh cover (1 ảnh duy nhất). |
| `gallery` | Optional | URL,URL,URL | Nhiều ảnh phụ, **cách nhau bằng dấu phẩy**. |
| `video` | Optional | URL | Link MP4. |
| `rating` | Optional | number | 0-5. Default 4.8. |
| `tags` | Optional | tag,tag,tag | Cách nhau bằng phẩy. |
| `isHot` | Optional | `true`/`false` | Hiện badge 🔥 HOT. |
| `isBestSeller` | Optional | `true`/`false` | Hiện badge 👑 BEST SELLER. |
| `status` | Optional | `active`/`hidden` | Chỉ row `active` được import. Default `active`. |

---

## 🔄 Update sản phẩm sau khi đã import

- **Cách 1 — Sửa Sheet rồi đồng bộ lại**: giữ nguyên `id` của sản phẩm cũ, sửa các cột khác → bấm **🔄 Đồng bộ** + **📥 Import** → backend upsert (overwrite) sản phẩm cùng id.
- **Cách 2 — Sửa trực tiếp trong admin**: tab **📦 Sản phẩm** → chọn sản phẩm → sửa tay.

> ⚠️ Nếu xoá dòng trong Sheet rồi đồng bộ lại, **sản phẩm vẫn còn trên web** (chỉ thêm/sửa, không tự xoá). Muốn xoá phải vào tab **📦 Sản phẩm** → bấm 🗑.

---

## 🛠 BONUS — Google Apps Script (tự động hoá Sheet)

Script này thêm menu **"🚀 Lion Affiliate"** vào Sheet với các chức năng:
- Tạo header cột tự động
- Insert sample row
- Validate trước khi đồng bộ
- Mở trang admin nhanh

### Cài đặt Apps Script

1. Trong Google Sheet → menu **Extensions** → **Apps Script**
2. Xoá hết code mặc định, paste code dưới đây:

```javascript
// ============================================================================
//  Lion Affiliate — Google Apps Script
//  Thêm custom menu giúp quản lý Sheet dễ hơn.
//  Cài: Extensions → Apps Script → paste → Save (Ctrl+S) → reload Sheet.
// ============================================================================

const REQUIRED_HEADERS = [
  'id', 'title', 'sourceUrl', 'affiliateUrl', 'category',
  'price', 'oldPrice', 'description', 'image', 'gallery',
  'video', 'rating', 'tags', 'isHot', 'isBestSeller', 'status',
];

const ADMIN_URL = 'https://lion-affiliate.vercel.app/admin';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚀 Lion Affiliate')
    .addItem('📋 Tạo header cột', 'createHeaders')
    .addItem('➕ Thêm sample row', 'insertSampleRow')
    .addSeparator()
    .addItem('✅ Validate dữ liệu', 'validateRows')
    .addItem('📊 Thống kê nhanh', 'showStats')
    .addSeparator()
    .addItem('🌐 Mở trang admin', 'openAdmin')
    .addToUi();
}

function createHeaders() {
  const sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getLastRow() > 0) {
    const yes = SpreadsheetApp.getUi().alert(
      'Sheet đã có dữ liệu. Tạo header sẽ ghi đè dòng 1. Tiếp tục?',
      SpreadsheetApp.getUi().ButtonSet.YES_NO
    );
    if (yes !== SpreadsheetApp.getUi().Button.YES) return;
  }
  const range = sheet.getRange(1, 1, 1, REQUIRED_HEADERS.length);
  range.setValues([REQUIRED_HEADERS]);
  range.setFontWeight('bold').setBackground('#fff7ed').setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  // Set width hợp lý cho từng cột
  const widths = [80, 250, 200, 200, 100, 80, 80, 200, 150, 200, 150, 60, 150, 70, 100, 80];
  widths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));
  SpreadsheetApp.getUi().alert('✅ Đã tạo 16 cột header. Bắt đầu nhập từ dòng 2.');
}

function insertSampleRow() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const sample = [
    'p_' + Date.now(),                              // id (unique)
    'Túi giấy lau tay siêu thấm 100 tờ',            // title
    'https://shopee.vn/-i.123.456',                 // sourceUrl
    'https://s.shopee.vn/aff_xxx',                  // affiliateUrl
    'gia-dung',                                     // category
    49000,                                          // price
    89000,                                          // oldPrice
    'Giấy lau tay an toàn cho gia đình, siêu thấm.', // description
    'https://i.imgur.com/sample.jpg',               // image
    'https://i.imgur.com/g1.jpg, https://i.imgur.com/g2.jpg', // gallery
    '',                                             // video
    4.8,                                            // rating
    'giấy, lau tay, gia dụng',                      // tags
    'true',                                         // isHot
    'false',                                        // isBestSeller
    'active',                                       // status
  ];
  sheet.appendRow(sample);
  SpreadsheetApp.getUi().alert('✅ Đã thêm 1 sample row. Sửa data tuỳ ý rồi đồng bộ trong /admin.');
}

function validateRows() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('Sheet rỗng, chưa có dòng data nào.');
    return;
  }
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const titleIdx = headers.indexOf('title');
  const affiliateIdx = headers.indexOf('affiliateUrl');
  const statusIdx = headers.indexOf('status');
  const imageIdx = headers.indexOf('image');

  const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  let errors = [];
  let warnings = [];
  let activeCount = 0;

  data.forEach((row, i) => {
    const rowNum = i + 2;
    if (statusIdx >= 0 && String(row[statusIdx]).toLowerCase() !== 'active') return;
    activeCount++;
    if (titleIdx >= 0 && !String(row[titleIdx]).trim()) {
      errors.push(`Dòng ${rowNum}: thiếu title`);
    }
    if (affiliateIdx >= 0 && !String(row[affiliateIdx]).trim()) {
      warnings.push(`Dòng ${rowNum}: thiếu affiliateUrl (nút Mua sẽ fallback)`);
    }
    if (imageIdx >= 0 && !String(row[imageIdx]).trim()) {
      warnings.push(`Dòng ${rowNum}: thiếu image (sẽ hiện "No image")`);
    }
  });

  let msg = `Tổng dòng active: ${activeCount}\n\n`;
  msg += errors.length ? `❌ Lỗi (${errors.length}):\n${errors.slice(0, 10).join('\n')}\n\n` : '✅ Không có lỗi\n\n';
  msg += warnings.length ? `⚠️ Cảnh báo (${warnings.length}):\n${warnings.slice(0, 5).join('\n')}` : '';
  SpreadsheetApp.getUi().alert(msg);
}

function showStats() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const statusIdx = headers.indexOf('status');
  const categoryIdx = headers.indexOf('category');
  const data = sheet.getDataRange().getValues().slice(1);

  const byStatus = {};
  const byCategory = {};
  data.forEach((row) => {
    const s = String(row[statusIdx] || 'active');
    byStatus[s] = (byStatus[s] || 0) + 1;
    const c = String(row[categoryIdx] || '(none)');
    byCategory[c] = (byCategory[c] || 0) + 1;
  });

  let msg = `📊 Thống kê Sheet\n\nTổng: ${data.length} dòng\n\n`;
  msg += 'Theo status:\n';
  Object.entries(byStatus).forEach(([k, v]) => msg += `  ${k}: ${v}\n`);
  msg += '\nTheo category:\n';
  Object.entries(byCategory).forEach(([k, v]) => msg += `  ${k}: ${v}\n`);
  SpreadsheetApp.getUi().alert(msg);
}

function openAdmin() {
  const html = HtmlService.createHtmlOutput(
    `<script>window.open('${ADMIN_URL}/login', '_blank'); google.script.host.close();</script>`
  ).setWidth(10).setHeight(10);
  SpreadsheetApp.getUi().showModalDialog(html, 'Opening...');
}
```

3. **Ctrl + S** để Save → đặt tên project (vd `lion-affiliate-script`)
4. **Reload Google Sheet** (F5)
5. Menu mới **"🚀 Lion Affiliate"** xuất hiện ngay cạnh **Help**

### Cách dùng menu

- **📋 Tạo header cột** — auto generate 16 cột chuẩn
- **➕ Thêm sample row** — chèn 1 dòng mẫu (id sinh tự động bằng timestamp)
- **✅ Validate dữ liệu** — kiểm tra trước khi đồng bộ, báo lỗi từng dòng
- **📊 Thống kê nhanh** — tổng số dòng, phân loại theo status/category
- **🌐 Mở trang admin** — quick open `/admin` trong tab mới

---

## 🚨 Troubleshooting

### "Không fetch được Sheet"
- ✅ Đã Publish to web hoặc Share → "Anyone with the link"?
- ✅ URL đúng format (`spreadsheets/d/.../pub?output=csv` hoặc `.../edit`)?
- ✅ Sheet không bị Google rate-limit (đợi 1-2 phút thử lại)?

### "Không tìm thấy cột title"
- ✅ Dòng 1 phải là header, các cột tên đúng (case-insensitive nhưng phải có cột `title`)?

### Import xong mà không thấy sản phẩm trên web
- ✅ Hard refresh (`Ctrl + Shift + R`) — frontend có cache localStorage 30s
- ✅ Status row đã set `active`?
- ✅ Vào tab **📦 Sản phẩm** trong /admin → sản phẩm có hiện trong list không?

### Sản phẩm cũ vẫn còn sau khi xoá khỏi Sheet
- Sheet import chỉ thêm/cập nhật, KHÔNG tự xoá.
- Vào tab **📦 Sản phẩm** → bấm 🗑 thủ công.

---

## 💡 Best practices

1. **Backup Sheet** — File → Download → Excel/CSV trước mỗi lần edit lớn
2. **Đặt id cố định** cho từng sản phẩm (vd `p001`, `p002`) → dễ upsert sau này
3. **Image upload**:
   - Upload lên [Imgur.com](https://imgur.com) (kéo thả) → click ảnh → copy direct link
   - Hoặc dùng [Cloudinary free tier](https://cloudinary.com) (chuyên nghiệp hơn)
   - **KHÔNG dùng** link từ Facebook (CDN không cho hotlink)
4. **Test 1-2 row** trước khi import hàng loạt
5. **Khi Render Free restart** → data trên web mất → bấm **🔄 Đồng bộ** + **📤 Import tất cả** = khôi phục tức thì ✅

---

## 🔗 Liên kết

- Admin: https://lion-affiliate.vercel.app/admin
- GitHub: https://github.com/miin80/Lion-affiliate
- README: [README.md](README.md)
