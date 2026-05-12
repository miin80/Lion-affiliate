# Lion Affiliate — Google Apps Script

Code Apps Script đồng bộ **trực tiếp** từ Google Sheet → backend website. Không cần vào /admin, không cần publish Sheet to web.

## 📦 File

- [`Code.gs`](Code.gs) — paste vào Apps Script editor

## 🚀 Cài đặt (5 phút)

### 1. Mở Google Sheet
Tạo Sheet mới hoặc dùng Sheet đã có (đã tạo header cột theo [GOOGLE_SHEET_SETUP.md](../GOOGLE_SHEET_SETUP.md)).

### 2. Mở Apps Script editor
- Menu Sheet → **Extensions** → **Apps Script**
- Một tab mới mở ra với code mẫu

### 3. Paste code
- Xoá hết code mẫu trong file `Code.gs`
- Mở file [Code.gs](Code.gs) trong project này, copy toàn bộ
- Paste vào editor

### 4. Save & cấp quyền
- Bấm **Ctrl + S** → đặt tên project (vd `Lion Affiliate Sync`)
- Lần đầu chạy → Google hỏi cấp quyền:
  - Bấm **Review permissions**
  - Chọn Google account
  - "Google hasn't verified this app" → bấm **Advanced** → **Go to ... (unsafe)**
  - Allow → xong

### 5. Reload Sheet
- Quay lại tab Google Sheet → **F5**
- Menu mới **"🚀 Lion Affiliate"** xuất hiện cạnh **Help**

### 6. Setup tài khoản admin
- Menu **🚀 Lion Affiliate** → **🔐 Cài đặt tài khoản admin**
- Nhập username + password — cùng tài khoản bạn login vào `/admin`
- Apps Script tự login test → báo "✅ Đã lưu credentials"

### 7. Test kết nối
- Menu → **🧪 Test kết nối backend**
- Phải báo: ✅ Kết nối OK + tên user

## 🎯 Sử dụng

### Đồng bộ tất cả sản phẩm
1. Điền/sửa data trong Sheet (chỉ row có `status = active` mới được push)
2. Menu **🚀 Lion Affiliate** → **🔄 Đồng bộ ngay (sync all)**
3. Confirm → đợi vài giây → "✅ Đồng bộ thành công"
4. Mở website → thấy sản phẩm mới ngay

### Đồng bộ 1 vài dòng
1. **Select** range các dòng muốn sync (bôi đen)
2. Menu → **🎯 Đồng bộ dòng đã chọn**

### Sửa sản phẩm cũ
- Sửa cột nào cũng được — chỉ cần giữ nguyên cột `id` → backend upsert (overwrite) sản phẩm cũ
- Bấm **🔄 Đồng bộ ngay** lại

### Ẩn sản phẩm khỏi web
- Đổi cột `status` từ `active` → `hidden`
- Sync — backend cập nhật status (sản phẩm ẩn khỏi public)

## 🔒 Bảo mật

- Username + password lưu trong **PropertiesService.UserProperties**:
  - Mỗi Google account có store riêng
  - Không share với người mở Sheet khác
  - Không sync giữa các máy (mỗi máy phải setup riêng)
- Token JWT cache 6 ngày, sau đó auto re-login
- Tất cả request HTTPS, không log password

## 🛠 Menu đầy đủ

| Menu | Chức năng |
|---|---|
| 🔄 Đồng bộ ngay | Push tất cả row active lên web |
| 🎯 Đồng bộ dòng đã chọn | Push chỉ range bôi đen |
| 🔐 Cài đặt tài khoản admin | Setup username/password (1 lần) |
| 🧪 Test kết nối backend | Verify health + auth |
| 🗑 Xoá credentials đã lưu | Logout / reset |
| 📋 Tạo header cột | Auto generate 16 cột chuẩn |
| ➕ Thêm sample row | Insert 1 dòng mẫu |
| ✅ Validate dữ liệu | Kiểm tra trước khi sync |
| 📊 Thống kê nhanh | Tổng + theo status/category |
| 🌐 Mở admin website | Open `/admin` trong tab mới |

## ⚠️ Troubleshooting

### "Login fail (401)"
- Sai username/password → menu **🗑 Xoá credentials** rồi setup lại
- Verify trên Render: Environment Variables → `ADMIN_USERNAME` và `ADMIN_PASSWORD`

### "Login fail (CORS)"
- Apps Script gọi từ server Google → KHÔNG bị CORS, lỗi này khó xảy ra
- Nếu gặp → backend `CORS_ORIGIN` env có thể sai → đổi về `*` tạm

### "Sync fail (500)"
- Vào Render logs xem error
- Common: `affiliateUrl` rỗng nhưng required → Sheet phải có cột này có giá trị

### "Authorization required"
- Apps Script chưa được Google authorize cấp quyền UrlFetch
- Chạy 1 function thủ công trong editor (vd `testConnection`) → Google sẽ hỏi quyền

### "Backend không phản hồi"
- Render Free **ngủ sau 15p** → request đầu mất 30-50s wake up
- Đợi 1 phút rồi sync lại

## 📋 Workflow đề xuất

```
1. Mở Google Sheet
2. Thêm/sửa rows
3. (Tuỳ chọn) Bấm "✅ Validate" để check trước
4. Bấm "🔄 Đồng bộ ngay"
5. Đợi 5-10s
6. Mở website → check sản phẩm mới
```

**Bonus**: Sau mỗi lần Render redeploy (data wipe), chỉ cần mở Sheet → bấm Sync → khôi phục tức thì.

## 🔗 Liên quan

- [GOOGLE_SHEET_SETUP.md](../GOOGLE_SHEET_SETUP.md) — format cột chi tiết
- [README.md](../README.md) — tài liệu chính
