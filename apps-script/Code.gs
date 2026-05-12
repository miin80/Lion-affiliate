/**
 * ============================================================================
 * Lion Affiliate — Google Apps Script
 * Đồng bộ products từ Google Sheet → backend website (1 cú click).
 *
 * Cài đặt:
 *  1. Mở Google Sheet
 *  2. Extensions → Apps Script → xóa code mẫu → paste TOÀN BỘ file này
 *  3. Ctrl+S → đặt tên project
 *  4. Reload Sheet (F5) → menu "🚀 Lion Affiliate" xuất hiện
 *  5. Bấm "🔐 Cài đặt tài khoản admin" — nhập username + password (1 lần)
 *  6. Bấm "📋 Tạo header cột" — tạo header tiếng Việt
 *  7. Điền sản phẩm → Bấm "🔄 Đồng bộ ngay"
 * ============================================================================
 */

// ============ CONFIG ============
const BACKEND_URL = 'https://lion-affiliate-backend.onrender.com';
const ADMIN_URL = 'https://lion-affiliate.vercel.app/admin';

// Header tiếng Việt — khớp với UI website. Backend cũng nhận các tên này.
// `field` là tên field nội bộ (camelCase) backend dùng.
// `display` là text hiển thị trong Sheet (giống nhãn admin).
const HEADERS = [
  { display: 'ID',                          field: 'id',           width: 90  },
  { display: 'Tên sản phẩm',                field: 'title',        width: 280 },
  { display: 'Link gốc (Shopee/TikTok)',    field: 'sourceUrl',    width: 220 },
  { display: 'Link affiliate (nút Mua)',    field: 'affiliateUrl', width: 240 },
  { display: 'Danh mục',                    field: 'category',     width: 110 },
  { display: 'Giá (VND)',                   field: 'price',        width: 90  },
  { display: 'Giá gốc',                     field: 'oldPrice',     width: 90  },
  { display: 'Mô tả ngắn',                  field: 'description',  width: 250 },
  { display: 'Ảnh chính',                   field: 'image',        width: 200 },
  { display: 'Gallery (ảnh phụ)',           field: 'gallery',      width: 230 },
  { display: 'Video',                       field: 'video',        width: 180 },
  { display: 'Rating',                      field: 'rating',       width: 70  },
  { display: 'Tags',                        field: 'tags',         width: 180 },
  { display: 'Hot',                         field: 'isHot',        width: 65  },
  { display: 'Best Seller',                 field: 'isBestSeller', width: 100 },
  { display: 'Trạng thái',                  field: 'status',       width: 100 },
];

// Lưu credentials trong UserProperties
const PROP_USERNAME = 'lion_admin_username';
const PROP_PASSWORD = 'lion_admin_password';
const PROP_TOKEN = 'lion_jwt_token';
const PROP_TOKEN_EXP = 'lion_jwt_exp';

// ============ MENU ============
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚀 Lion Affiliate')
    .addItem('🔄 Đồng bộ ngay (sync all)', 'syncAll')
    .addItem('🎯 Đồng bộ dòng đã chọn', 'syncSelected')
    .addSeparator()
    .addItem('🔐 Cài đặt tài khoản admin', 'setupCredentials')
    .addItem('🧪 Test kết nối backend', 'testConnection')
    .addItem('🗑 Xoá credentials đã lưu', 'clearCredentials')
    .addSeparator()
    .addItem('📋 Tạo header cột', 'createHeaders')
    .addItem('➕ Thêm sample row', 'insertSampleRow')
    .addItem('✅ Validate dữ liệu', 'validateRows')
    .addItem('📊 Thống kê nhanh', 'showStats')
    .addSeparator()
    .addItem('🌐 Mở admin website', 'openAdmin')
    .addToUi();
}

// ============ AUTH / LOGIN ============
function setupCredentials() {
  const ui = SpreadsheetApp.getUi();
  const userResp = ui.prompt(
    'Cài đặt admin',
    'Tên đăng nhập (ADMIN_USERNAME trên Render):',
    ui.ButtonSet.OK_CANCEL
  );
  if (userResp.getSelectedButton() !== ui.Button.OK) return;
  const username = userResp.getResponseText().trim();

  const pwResp = ui.prompt(
    'Cài đặt admin',
    'Mật khẩu (ADMIN_PASSWORD trên Render):',
    ui.ButtonSet.OK_CANCEL
  );
  if (pwResp.getSelectedButton() !== ui.Button.OK) return;
  const password = pwResp.getResponseText();

  if (!username || !password) {
    ui.alert('❌ Username hoặc password rỗng.');
    return;
  }

  PropertiesService.getUserProperties().setProperties({
    [PROP_USERNAME]: username,
    [PROP_PASSWORD]: password,
  });

  try {
    login_();
    ui.alert('✅ Đã lưu credentials và login thành công.\n\nBấm "🔄 Đồng bộ ngay" để push data lên web.');
  } catch (err) {
    ui.alert('❌ Login thất bại: ' + err.message + '\n\nCredentials đã lưu nhưng có thể sai. Bấm "🧪 Test kết nối" để debug.');
  }
}

function clearCredentials() {
  PropertiesService.getUserProperties().deleteAllProperties();
  SpreadsheetApp.getUi().alert('✅ Đã xoá tất cả credentials + token.');
}

function login_() {
  const props = PropertiesService.getUserProperties();
  const username = props.getProperty(PROP_USERNAME);
  const password = props.getProperty(PROP_PASSWORD);
  if (!username || !password) {
    throw new Error('Chưa setup credentials. Menu → "🔐 Cài đặt tài khoản admin".');
  }
  const res = UrlFetchApp.fetch(BACKEND_URL + '/api/auth/login', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ username, password }),
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  const body = res.getContentText();
  if (code !== 200) {
    throw new Error('Login fail (' + code + '): ' + body);
  }
  const data = JSON.parse(body);
  props.setProperties({
    [PROP_TOKEN]: data.token,
    [PROP_TOKEN_EXP]: String(Date.now() + 6 * 24 * 3600 * 1000),
  });
  return data.token;
}

function getValidToken_() {
  const props = PropertiesService.getUserProperties();
  const token = props.getProperty(PROP_TOKEN);
  const exp = Number(props.getProperty(PROP_TOKEN_EXP) || 0);
  if (token && exp > Date.now()) return token;
  return login_();
}

function testConnection() {
  const ui = SpreadsheetApp.getUi();
  try {
    const r1 = UrlFetchApp.fetch(BACKEND_URL + '/api/health', { muteHttpExceptions: true });
    const health = JSON.parse(r1.getContentText());
    if (!health.ok) throw new Error('Health check fail');

    const token = getValidToken_();
    const r2 = UrlFetchApp.fetch(BACKEND_URL + '/api/auth/me', {
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true,
    });
    if (r2.getResponseCode() !== 200) throw new Error('Auth fail: ' + r2.getContentText());
    const me = JSON.parse(r2.getContentText());

    ui.alert('✅ Kết nối OK\n\nBackend: ' + health.service + '\nĐăng nhập với: ' + me.user.username);
  } catch (err) {
    ui.alert('❌ Lỗi kết nối: ' + err.message);
  }
}

// ============ SHEET HELPERS ============
function createHeaders() {
  const sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getLastRow() > 0) {
    const yes = SpreadsheetApp.getUi().alert(
      'Sheet đã có dữ liệu. Tạo header sẽ ghi đè dòng 1. Tiếp tục?',
      SpreadsheetApp.getUi().ButtonSet.YES_NO
    );
    if (yes !== SpreadsheetApp.getUi().Button.YES) return;
  }
  const displays = HEADERS.map(function (h) { return h.display; });
  const range = sheet.getRange(1, 1, 1, displays.length);
  range.setValues([displays]);
  range
    .setFontWeight('bold')
    .setBackground('#fff7ed')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 36);

  HEADERS.forEach(function (h, i) {
    sheet.setColumnWidth(i + 1, h.width);
  });

  // Note (tooltip) cho từng cột — hover hiện hint
  const notes = [
    'Để trống = tạo mới. Giữ id cũ = update sản phẩm cũ.',
    'BẮT BUỘC. Tên sản phẩm hiển thị trên web.',
    'Link Shopee/TikTok gốc. CHỈ ĐỂ LẤY DATA, không phải link mua.',
    'BẮT BUỘC. Link affiliate của bạn. Khách bấm Mua = đi qua link này = bạn ăn hoa hồng.',
    'Slug: gia-dung / do-bep / lam-dep / cong-nghe / me-be / an-vat',
    'Số VND, không gõ dấu chấm/phẩy. VD: 49000',
    'Giá gốc (gạch ngang). Để trống nếu không giảm giá.',
    'Mô tả ngắn 1-2 câu hiển thị dưới tên.',
    'URL ảnh cover (1 ảnh).',
    'Nhiều URL ảnh phụ, cách nhau dấu phẩy.',
    'URL video .mp4 (tuỳ chọn).',
    'Số 0-5, mặc định 4.8.',
    'Nhiều tag cách nhau dấu phẩy.',
    'true = hiện badge 🔥 HOT. Còn lại false.',
    'true = hiện badge 👑 BEST SELLER. Còn lại false.',
    'active = hiện trên web. hidden = ẩn.',
  ];
  HEADERS.forEach(function (h, i) {
    sheet.getRange(1, i + 1).setNote(notes[i] || '');
  });

  SpreadsheetApp.getUi().alert(
    '✅ Đã tạo ' + HEADERS.length + ' cột header.\n\n' +
    '💡 Hover chuột vào header để xem hint.\n' +
    '👉 Nhập sản phẩm từ dòng 2 trở đi.'
  );
}

function insertSampleRow() {
  const sheet = SpreadsheetApp.getActiveSheet();
  // Match thứ tự HEADERS
  const sample = [
    'p_' + Date.now(),                                  // ID
    'Túi giấy lau tay siêu thấm 100 tờ',                // Tên sản phẩm
    'https://shopee.vn/-i.123.456',                     // Link gốc
    'https://s.shopee.vn/aff_xxx',                      // Link affiliate
    'gia-dung',                                         // Danh mục
    49000,                                              // Giá
    89000,                                              // Giá gốc
    'Giấy lau tay an toàn cho gia đình, siêu thấm.',    // Mô tả ngắn
    'https://i.imgur.com/sample.jpg',                   // Ảnh chính
    'https://i.imgur.com/g1.jpg, https://i.imgur.com/g2.jpg', // Gallery
    '',                                                 // Video
    4.8,                                                // Rating
    'giấy, lau tay, gia dụng',                          // Tags
    'true',                                             // Hot
    'false',                                            // Best Seller
    'active',                                           // Trạng thái
  ];
  sheet.appendRow(sample);
  SpreadsheetApp.getUi().alert('✅ Đã thêm 1 sample row. Sửa data rồi bấm "🔄 Đồng bộ ngay".');
}

// ============ SYNC ============
/**
 * Đọc rows trong sheet → array of products.
 * Support cả header tiếng Việt (display) và tiếng Anh (field) — backward compat.
 */
function readSheetProducts_(onlySelected) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return { products: [], skipped: [] };

  const rawHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(function (h) { return String(h || '').trim().toLowerCase(); });

  // Map field name → column index. Hỗ trợ cả tiếng Việt (display) và tiếng Anh (field).
  const idx = {};
  HEADERS.forEach(function (h) {
    let i = rawHeaders.indexOf(h.display.toLowerCase());
    if (i < 0) i = rawHeaders.indexOf(h.field.toLowerCase());
    if (i >= 0) idx[h.field] = i;
  });

  if (idx.title === undefined) {
    throw new Error('Sheet thiếu cột "Tên sản phẩm" (hoặc "title"). Bấm "📋 Tạo header cột" trước.');
  }

  let startRow = 2;
  let numRows = lastRow - 1;
  if (onlySelected) {
    const range = sheet.getActiveRange();
    startRow = Math.max(2, range.getRow());
    numRows = range.getNumRows();
    if (startRow + numRows - 1 > lastRow) numRows = lastRow - startRow + 1;
  }

  const data = sheet.getRange(startRow, 1, numRows, lastCol).getValues();
  const products = [];
  const skipped = [];

  data.forEach(function (row, i) {
    const get = function (key) {
      if (idx[key] === undefined) return '';
      const v = row[idx[key]];
      return v === null || v === undefined ? '' : String(v).trim();
    };
    const rowNum = startRow + i;

    // Sync CẢ active + hidden — Sheet là source of truth cho status.
    // Chỉ skip nếu thiếu title hoặc status không hợp lệ.
    const status = (get('status') || 'active').toLowerCase();
    const finalStatus = ['active', 'hidden'].indexOf(status) >= 0 ? status : 'active';

    const title = get('title');
    if (!title) {
      skipped.push({ rowNum: rowNum, reason: 'thiếu Tên sản phẩm' });
      return;
    }

    const image = get('image');
    const gallery = splitList_(get('gallery'));
    const images = image
      ? [image].concat(gallery.filter(function (g) { return g !== image; }))
      : gallery;

    const badges = ['reviewed'];
    if (parseBool_(get('isHot'))) badges.push('hot');
    if (parseBool_(get('isBestSeller'))) badges.push('bestseller');

    const sourceUrl = get('sourceUrl');
    const affiliateUrl = get('affiliateUrl');

    products.push({
      id: get('id') || undefined,
      slug: slugify_(title || get('id')),
      title: title,
      sourceUrl: sourceUrl,
      affiliateUrl: affiliateUrl,
      category: get('category') || 'gia-dung',
      price: parseNum_(get('price')),
      originalPrice: parseNum_(get('oldPrice')),
      description: get('description'),
      images: images,
      image: images[0] || null,
      gallery: images.slice(1),
      video: get('video'),
      videos: get('video') ? [get('video')] : [],
      rating: parseNum_(get('rating')) || 4.8,
      reviewCount: 0,
      sold: 0,
      tags: splitList_(get('tags')),
      badges: badges,
      isHot: parseBool_(get('isHot')),
      isBestSeller: parseBool_(get('isBestSeller')),
      platform: detectPlatform_(sourceUrl || affiliateUrl),
      status: finalStatus,
      source: 'sheet',
      _rowNum: rowNum,
    });
  });

  return { products: products, skipped: skipped };
}

function syncAll() { doSync_(false); }
function syncSelected() { doSync_(true); }

function doSync_(onlySelected) {
  const ui = SpreadsheetApp.getUi();
  let result;
  try {
    result = readSheetProducts_(onlySelected);
  } catch (err) {
    ui.alert('❌ Lỗi đọc sheet: ' + err.message);
    return;
  }
  if (!result.products.length) {
    ui.alert('⚠️ Không có dòng nào để sync.\n\nSkip:\n' +
      (result.skipped.slice(0, 10).map(function (s) {
        return 'Dòng ' + s.rowNum + ': ' + s.reason;
      }).join('\n') || '(none)')
    );
    return;
  }

  const activeCount = result.products.filter(function (p) { return p.status === 'active'; }).length;
  const hiddenCount = result.products.length - activeCount;
  const confirm = ui.alert(
    'Xác nhận đồng bộ',
    'Sẽ push ' + result.products.length + ' sản phẩm lên website:\n' +
      '  • Active (hiện): ' + activeCount + '\n' +
      '  • Hidden (ẩn): ' + hiddenCount + '\n' +
      (result.skipped.length ? '\nBỏ qua ' + result.skipped.length + ' dòng thiếu Tên sản phẩm.\n' : '') +
      '\nTiếp tục?',
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  let token;
  try {
    token = getValidToken_();
  } catch (err) {
    ui.alert('❌ Login fail: ' + err.message);
    return;
  }

  const payload = result.products.map(function (p) {
    const copy = {};
    Object.keys(p).forEach(function (k) { if (k !== '_rowNum') copy[k] = p[k]; });
    return copy;
  });

  const res = UrlFetchApp.fetch(BACKEND_URL + '/api/products/bulk', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ products: payload }),
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  const body = res.getContentText();
  if (code !== 200) {
    ui.alert('❌ Sync fail (' + code + '): ' + body);
    return;
  }
  const data = JSON.parse(body);
  let msg = '✅ Đồng bộ thành công\n\n' +
    'Tổng: ' + data.total + '\n' +
    'Đã import: ' + data.imported + '\n' +
    'Lỗi: ' + data.errors;
  if (data.errors > 0 && data.details && data.details.errors) {
    msg += '\n\nChi tiết lỗi:\n' + data.details.errors.slice(0, 10).map(function (e) {
      return '• ' + (e.title || '(no title)') + ': ' + e.error;
    }).join('\n');
  }
  ui.alert(msg);
}

// ============ VALIDATE / STATS ============
function validateRows() {
  let result;
  try {
    result = readSheetProducts_(false);
  } catch (err) {
    SpreadsheetApp.getUi().alert('❌ ' + err.message);
    return;
  }
  const valid = result.products.length;
  const skipped = result.skipped.length;
  const activeCount = result.products.filter(function (p) { return p.status === 'active'; }).length;
  const hiddenCount = valid - activeCount;
  let msg = '✅ Hợp lệ: ' + valid + ' dòng\n';
  msg += '  • Active: ' + activeCount + '\n';
  msg += '  • Hidden: ' + hiddenCount + '\n';
  msg += '⏭ Skip (thiếu title): ' + skipped + ' dòng\n';
  if (skipped > 0) {
    msg += '\nChi tiết:\n' + result.skipped.slice(0, 10).map(function (s) {
      return 'Dòng ' + s.rowNum + ': ' + s.reason;
    }).join('\n');
  }

  const warnings = [];
  result.products.forEach(function (p) {
    if (!p.affiliateUrl) warnings.push('Dòng ' + p._rowNum + ': thiếu Link affiliate');
    if (!p.images.length) warnings.push('Dòng ' + p._rowNum + ': thiếu Ảnh chính');
  });
  if (warnings.length) {
    msg += '\n\n⚠️ Cảnh báo:\n' + warnings.slice(0, 10).join('\n');
  }
  SpreadsheetApp.getUi().alert(msg);
}

function showStats() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('Sheet rỗng.');
    return;
  }
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(function (h) { return String(h || '').toLowerCase(); });

  // Tìm cột status + category (tiếng Việt hoặc Anh)
  let statusIdx = headers.indexOf('trạng thái');
  if (statusIdx < 0) statusIdx = headers.indexOf('status');
  let catIdx = headers.indexOf('danh mục');
  if (catIdx < 0) catIdx = headers.indexOf('category');

  const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const byStatus = {};
  const byCategory = {};
  data.forEach(function (row) {
    const s = String((statusIdx >= 0 ? row[statusIdx] : 'active') || 'active');
    byStatus[s] = (byStatus[s] || 0) + 1;
    const c = String((catIdx >= 0 ? row[catIdx] : '(none)') || '(none)');
    byCategory[c] = (byCategory[c] || 0) + 1;
  });
  let msg = '📊 Thống kê\n\nTổng: ' + data.length + ' dòng\n\nTheo trạng thái:\n';
  Object.keys(byStatus).forEach(function (k) {
    msg += '  ' + k + ': ' + byStatus[k] + '\n';
  });
  msg += '\nTheo danh mục:\n';
  Object.keys(byCategory).forEach(function (k) {
    msg += '  ' + k + ': ' + byCategory[k] + '\n';
  });
  SpreadsheetApp.getUi().alert(msg);
}

function openAdmin() {
  const html = HtmlService.createHtmlOutput(
    '<script>window.open(\'' + ADMIN_URL + '/login\', \'_blank\'); google.script.host.close();</script>'
  ).setWidth(10).setHeight(10);
  SpreadsheetApp.getUi().showModalDialog(html, 'Opening admin...');
}

// ============ UTILS ============
function parseBool_(v) {
  if (typeof v === 'boolean') return v;
  const s = String(v || '').trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'có' || s === 'x';
}

function parseNum_(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(String(v).replace(/[^\d.-]/g, ''));
  return isNaN(n) ? null : n;
}

function splitList_(v) {
  if (!v) return [];
  return String(v).split(/[,;\n]/).map(function (s) { return s.trim(); }).filter(Boolean);
}

function slugify_(text) {
  return String(text || 'san-pham')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'san-pham';
}

function detectPlatform_(url) {
  if (!url) return 'other';
  if (/shopee\./i.test(url)) return 'shopee';
  if (/tiktok\.com|shop\.tiktok/i.test(url)) return 'tiktok';
  if (/lazada\./i.test(url)) return 'lazada';
  if (/tiki\.vn/i.test(url)) return 'tiki';
  return 'other';
}
