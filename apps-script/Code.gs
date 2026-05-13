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
    .addItem('🪄 Auto-fill từ URL + Đồng bộ (rows đã chọn)', 'autoFillSelected')
    .addItem('🪄 Auto-fill từ URL + Đồng bộ (TẤT CẢ)', 'autoFillAll')
    .addSeparator()
    .addItem('🔄 Đồng bộ ngay (sync all)', 'syncAll')
    .addItem('🎯 Đồng bộ dòng đã chọn', 'syncSelected')
    .addItem('🔁 Kéo từ Web về Sheet (reverse sync)', 'pullFromWeb')
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

// ============================================================================
// AUTO-FILL TỪ URL  (Forward sync 2-chiều)
// User chỉ cần paste sourceUrl + affiliateUrl trong Sheet.
// Apps Script gửi rows tới /api/products/sheet-sync → backend tự scrape +
// lưu DB → trả về enriched data → Sheet tự writeback các ô trống.
// ============================================================================
function autoFillAll() { autoFill_(false); }
function autoFillSelected() { autoFill_(true); }

function autoFill_(onlySelected) {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) {
    ui.alert('Sheet rỗng. Tạo header trước rồi paste link sản phẩm.');
    return;
  }

  // Build column index map
  const rawHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(function (h) { return String(h || '').trim().toLowerCase(); });
  const idx = {};
  HEADERS.forEach(function (h) {
    var i = rawHeaders.indexOf(h.display.toLowerCase());
    if (i < 0) i = rawHeaders.indexOf(h.field.toLowerCase());
    if (i >= 0) idx[h.field] = i;
  });
  if (idx.sourceUrl === undefined && idx.affiliateUrl === undefined) {
    ui.alert('Sheet phải có cột "Link gốc" hoặc "Link affiliate". Bấm "📋 Tạo header cột" trước.');
    return;
  }

  // Xác định range row
  var startRow = 2;
  var numRows = lastRow - 1;
  if (onlySelected) {
    const range = sheet.getActiveRange();
    startRow = Math.max(2, range.getRow());
    numRows = range.getNumRows();
    if (startRow + numRows - 1 > lastRow) numRows = lastRow - startRow + 1;
  }

  const data = sheet.getRange(startRow, 1, numRows, lastCol).getValues();
  const rows = [];
  data.forEach(function (row, i) {
    const get = function (key) {
      if (idx[key] === undefined) return '';
      const v = row[idx[key]];
      return v === null || v === undefined ? '' : String(v).trim();
    };
    const sourceUrl = get('sourceUrl');
    const affiliateUrl = get('affiliateUrl');
    if (!sourceUrl && !affiliateUrl) return; // bỏ qua row trống URL
    const rowNum = startRow + i;
    rows.push({
      rowNum: rowNum,
      id: get('id') || undefined,
      sourceUrl: sourceUrl,
      affiliateUrl: affiliateUrl,
      title: get('title'),
      category: get('category'),
      description: get('description'),
      price: parseNum_(get('price')),
      originalPrice: parseNum_(get('oldPrice')),
      rating: parseNum_(get('rating')),
      images: get('image')
        ? [get('image')].concat(splitList_(get('gallery')).filter(function (g) { return g !== get('image'); }))
        : splitList_(get('gallery')),
      videos: get('video') ? [get('video')] : [],
      tags: splitList_(get('tags')),
      status: get('status') || 'active',
    });
  });

  if (!rows.length) {
    ui.alert('Không có dòng nào có URL để xử lý.');
    return;
  }

  const confirm = ui.alert(
    'Xác nhận Auto-fill',
    'Sẽ gọi backend scrape ' + rows.length + ' dòng và tự fill ô trống.\n\n' +
    'Mỗi dòng mất 1-3 giây để scrape Shopee.\n' +
    'Tiếp tục?',
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  var token;
  try { token = getValidToken_(); }
  catch (err) { ui.alert('❌ Login fail: ' + err.message); return; }

  const res = UrlFetchApp.fetch(BACKEND_URL + '/api/products/sheet-sync', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ rows: rows }),
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  const body = res.getContentText();
  if (code !== 200) {
    ui.alert('❌ Sheet-sync fail (' + code + '): ' + body.slice(0, 500));
    return;
  }
  const data2 = JSON.parse(body);

  // Writeback: với mỗi result, fill các ô trống trong Sheet
  var written = 0;
  var scrapedCount = 0;
  (data2.results || []).forEach(function (r) {
    if (!r.ok || !r.product) return;
    const rowNum = r.rowNum;
    const p = r.product;
    // Helper: chỉ ghi đè nếu ô hiện tại RỖNG (để không phá data user đã nhập)
    const setIfEmpty = function (field, val) {
      if (idx[field] === undefined) return;
      const cell = sheet.getRange(rowNum, idx[field] + 1);
      const current = String(cell.getValue() || '').trim();
      if (!current && val !== null && val !== undefined && String(val) !== '') {
        cell.setValue(val);
      }
    };
    // ID luôn ghi (vì backend sinh id mới)
    if (idx.id !== undefined) sheet.getRange(rowNum, idx.id + 1).setValue(p.id || '');
    setIfEmpty('title', p.title);
    setIfEmpty('description', p.description);
    setIfEmpty('image', p.image);
    setIfEmpty('gallery', (p.gallery || []).join(', '));
    setIfEmpty('video', p.video);
    setIfEmpty('price', p.priceMin || p.price || '');
    setIfEmpty('oldPrice', p.oldPriceMin || p.originalPrice || '');
    setIfEmpty('rating', p.rating);
    setIfEmpty('category', p.category);
    setIfEmpty('status', p.status);
    written++;
    if (r.scrapeOk) scrapedCount++;
  });

  const errMsgs = (data2.results || []).filter(function (r) { return !r.ok; }).slice(0, 8)
    .map(function (r) { return '• Dòng ' + r.rowNum + ': ' + (r.error || 'lỗi không rõ'); });

  ui.alert(
    '✅ Auto-fill hoàn tất\n\n' +
    'Tổng: ' + data2.total + '\n' +
    'Đã lưu lên web + writeback Sheet: ' + written + '\n' +
    'Scrape OK: ' + scrapedCount + '\n' +
    'Lỗi: ' + data2.errors +
    (errMsgs.length ? '\n\nChi tiết lỗi:\n' + errMsgs.join('\n') : '')
  );
}

// ============================================================================
// PULL FROM WEB  (Reverse sync — Web → Sheet)
// Khi admin sửa data trên web, gọi lệnh này để kéo về Sheet.
// Chỉ fill các ô đang TRỐNG trong Sheet (không ghi đè data user đã nhập tay).
// Match theo cột "id".
// ============================================================================
function pullFromWeb() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) {
    ui.alert('Sheet rỗng — không có gì để pull.');
    return;
  }

  // Build column index map
  const rawHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(function (h) { return String(h || '').trim().toLowerCase(); });
  const idx = {};
  HEADERS.forEach(function (h) {
    var i = rawHeaders.indexOf(h.display.toLowerCase());
    if (i < 0) i = rawHeaders.indexOf(h.field.toLowerCase());
    if (i >= 0) idx[h.field] = i;
  });
  if (idx.id === undefined) {
    ui.alert('Sheet phải có cột "ID" để match với sản phẩm trên web. Bấm "📋 Tạo header cột" trước.');
    return;
  }

  var token;
  try { token = getValidToken_(); }
  catch (err) { ui.alert('❌ Login fail: ' + err.message); return; }

  // Fetch tất cả products từ web (admin endpoint — bao gồm cả hidden)
  const res = UrlFetchApp.fetch(BACKEND_URL + '/api/products/admin', {
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) {
    ui.alert('❌ Không lấy được data web: ' + res.getContentText().slice(0, 300));
    return;
  }
  const all = JSON.parse(res.getContentText()).products || [];
  if (!all.length) {
    ui.alert('Web chưa có sản phẩm nào.');
    return;
  }
  const byId = {};
  all.forEach(function (p) { if (p.id) byId[p.id] = p; });

  const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var updated = 0;
  var skipped = 0;
  var addedNew = 0;
  const seenIds = {};

  data.forEach(function (row, i) {
    const id = String(row[idx.id] || '').trim();
    if (!id) { skipped++; return; }
    seenIds[id] = true;
    const p = byId[id];
    if (!p) { skipped++; return; }
    const rowNum = i + 2;

    const setIfEmpty = function (field, val) {
      if (idx[field] === undefined) return;
      const cell = sheet.getRange(rowNum, idx[field] + 1);
      const current = String(cell.getValue() || '').trim();
      if (!current && val !== null && val !== undefined && String(val) !== '') {
        cell.setValue(val);
      }
    };

    setIfEmpty('title', p.title);
    setIfEmpty('sourceUrl', p.sourceUrl);
    setIfEmpty('affiliateUrl', p.affiliateUrl);
    setIfEmpty('category', p.category);
    setIfEmpty('description', p.description);
    setIfEmpty('image', p.images && p.images[0]);
    setIfEmpty('gallery', p.images && p.images.slice(1).join(', '));
    setIfEmpty('video', p.video || (p.videos && p.videos[0]));
    setIfEmpty('price', p.priceMin || p.price);
    setIfEmpty('oldPrice', p.oldPriceMin || p.originalPrice);
    setIfEmpty('rating', p.rating);
    setIfEmpty('tags', (p.tags || []).join(', '));
    setIfEmpty('isHot', (p.badges || []).indexOf('hot') >= 0 ? 'true' : '');
    setIfEmpty('isBestSeller', (p.badges || []).indexOf('bestseller') >= 0 ? 'true' : '');
    setIfEmpty('status', p.status);
    updated++;
  });

  // Optional: append các product có trên web nhưng KHÔNG có trong Sheet
  const missing = all.filter(function (p) { return p.id && !seenIds[p.id]; });
  if (missing.length) {
    const yes = ui.alert(
      'Append products thiếu?',
      'Có ' + missing.length + ' sản phẩm tồn tại trên web nhưng KHÔNG có trong Sheet.\n' +
      'Append vào cuối Sheet?',
      ui.ButtonSet.YES_NO
    );
    if (yes === ui.Button.YES) {
      missing.forEach(function (p) {
        const row = new Array(lastCol).fill('');
        const put = function (field, val) {
          if (idx[field] !== undefined) row[idx[field]] = val == null ? '' : val;
        };
        put('id', p.id);
        put('title', p.title);
        put('sourceUrl', p.sourceUrl);
        put('affiliateUrl', p.affiliateUrl);
        put('category', p.category);
        put('description', p.description);
        put('image', p.images && p.images[0]);
        put('gallery', p.images && p.images.slice(1).join(', '));
        put('video', p.video || (p.videos && p.videos[0]));
        put('price', p.priceMin || p.price);
        put('oldPrice', p.oldPriceMin || p.originalPrice);
        put('rating', p.rating);
        put('tags', (p.tags || []).join(', '));
        put('isHot', (p.badges || []).indexOf('hot') >= 0 ? 'true' : 'false');
        put('isBestSeller', (p.badges || []).indexOf('bestseller') >= 0 ? 'true' : 'false');
        put('status', p.status);
        sheet.appendRow(row);
        addedNew++;
      });
    }
  }

  ui.alert(
    '✅ Kéo từ Web hoàn tất\n\n' +
    'Cập nhật rows đã match: ' + updated + '\n' +
    'Append rows mới: ' + addedNew + '\n' +
    'Bỏ qua (không có id / không match): ' + skipped + '\n\n' +
    '💡 Lưu ý: chỉ fill các ô TRỐNG trong Sheet. Ô đã có data sẽ không bị ghi đè.'
  );
}
