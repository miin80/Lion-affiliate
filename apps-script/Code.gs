/**
 * ============================================================================
 * Lion Affiliate — Google Apps Script
 * Đồng bộ products từ Google Sheet → backend website (1 cú click).
 *
 * Cài đặt:
 *  1. Mở Google Sheet (đã tạo theo GOOGLE_SHEET_SETUP.md)
 *  2. Extensions → Apps Script → xóa code mẫu → paste TOÀN BỘ file này
 *  3. Ctrl+S để Save → đặt tên project (ví dụ "Lion Affiliate Sync")
 *  4. Reload Sheet (F5) → menu "🚀 Lion Affiliate" xuất hiện
 *  5. Bấm "🔐 Cài đặt tài khoản admin" — paste username + password 1 lần
 *  6. Bấm "🚀 Đồng bộ ngay" — push tất cả lên web
 *
 * Update CONFIG dưới nếu bạn deploy backend ở URL khác.
 * ============================================================================
 */

// ============ CONFIG ============
const BACKEND_URL = 'https://lion-affiliate-backend.onrender.com';
const ADMIN_URL = 'https://lion-affiliate.vercel.app/admin';

const REQUIRED_HEADERS = [
  'id', 'title', 'sourceUrl', 'affiliateUrl', 'category',
  'price', 'oldPrice', 'description', 'image', 'gallery',
  'video', 'rating', 'tags', 'isHot', 'isBestSeller', 'status',
];

// Lưu credentials trong UserProperties (mỗi user trên Sheet có riêng, không share)
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
    ui.alert('❌ Username hoặc password rỗng. Huỷ.');
    return;
  }

  PropertiesService.getUserProperties().setProperties({
    [PROP_USERNAME]: username,
    [PROP_PASSWORD]: password,
  });
  // Test login luôn để xác nhận
  try {
    const token = login_();
    if (token) {
      ui.alert('✅ Đã lưu credentials và login thành công.\nBấm "🔄 Đồng bộ ngay" để push data lên web.');
    }
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
    throw new Error('Chưa setup credentials. Bấm menu "🔐 Cài đặt tài khoản admin" trước.');
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
    [PROP_TOKEN_EXP]: String(Date.now() + 6 * 24 * 3600 * 1000), // 6 ngày
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
    // Health check (public)
    const r1 = UrlFetchApp.fetch(BACKEND_URL + '/api/health', { muteHttpExceptions: true });
    const health = JSON.parse(r1.getContentText());
    if (!health.ok) throw new Error('Health check fail');

    // Auth check
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

// ============ SYNC ============
/** Đọc toàn bộ rows trong sheet hiện tại → array of products (đã filter active). */
function readSheetProducts_(onlySelected) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return [];

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map((h) =>
    String(h || '').trim().toLowerCase()
  );

  // Map header name → column index
  const idx = {};
  REQUIRED_HEADERS.forEach((h) => {
    const i = headers.indexOf(h.toLowerCase());
    if (i >= 0) idx[h] = i;
  });
  if (idx.title === undefined) {
    throw new Error('Sheet thiếu cột "title". Vào menu → "📋 Tạo header cột".');
  }

  // Nếu chỉ lấy dòng đã chọn → đọc activeRange
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

  data.forEach((row, i) => {
    const get = (key) => {
      if (idx[key] === undefined) return '';
      const v = row[idx[key]];
      return v === null || v === undefined ? '' : String(v).trim();
    };
    const rowNum = startRow + i;

    const status = (get('status') || 'active').toLowerCase();
    if (status !== 'active') {
      skipped.push({ rowNum, reason: 'status != active' });
      return;
    }

    const title = get('title');
    if (!title) {
      skipped.push({ rowNum, reason: 'thiếu title' });
      return;
    }

    const image = get('image');
    const gallery = splitList_(get('gallery'));
    const images = image ? [image].concat(gallery.filter((g) => g !== image)) : gallery;

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
      status: 'active',
      _rowNum: rowNum,
    });
  });

  return { products: products, skipped: skipped };
}

function syncAll() {
  doSync_(false);
}
function syncSelected() {
  doSync_(true);
}

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
    ui.alert('⚠️ Không có dòng nào để sync.\n\nSkip:\n' + (result.skipped.slice(0, 10).map((s) => 'Dòng ' + s.rowNum + ': ' + s.reason).join('\n') || '(none)'));
    return;
  }

  // Confirm
  const confirm = ui.alert(
    'Xác nhận đồng bộ',
    'Sẽ push ' + result.products.length + ' sản phẩm lên website.\n' +
      (result.skipped.length ? 'Bỏ qua ' + result.skipped.length + ' dòng (status != active hoặc thiếu title).\n' : '') +
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

  // Strip _rowNum trước khi gửi
  const payload = result.products.map((p) => {
    const copy = Object.assign({}, p);
    delete copy._rowNum;
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
    msg += '\n\nChi tiết lỗi:\n' + data.details.errors.slice(0, 10).map((e) =>
      '• ' + (e.title || '(no title)') + ': ' + e.error
    ).join('\n');
  }
  ui.alert(msg);
}

// ============ HELPER (Sheet utility) ============
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
  const widths = [80, 250, 200, 200, 100, 80, 80, 200, 150, 200, 150, 60, 150, 70, 100, 80];
  widths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));
  SpreadsheetApp.getUi().alert('✅ Đã tạo 16 cột header. Nhập sản phẩm từ dòng 2.');
}

function insertSampleRow() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const sample = [
    'p_' + Date.now(),
    'Túi giấy lau tay siêu thấm 100 tờ',
    'https://shopee.vn/-i.123.456',
    'https://s.shopee.vn/aff_xxx',
    'gia-dung',
    49000,
    89000,
    'Giấy lau tay an toàn, siêu thấm.',
    'https://i.imgur.com/sample.jpg',
    'https://i.imgur.com/g1.jpg, https://i.imgur.com/g2.jpg',
    '',
    4.8,
    'giấy, lau tay, gia dụng',
    'true',
    'false',
    'active',
  ];
  sheet.appendRow(sample);
  SpreadsheetApp.getUi().alert('✅ Đã thêm 1 sample row. Sửa data rồi bấm "🔄 Đồng bộ ngay".');
}

function validateRows() {
  const result = readSheetProducts_(false);
  const valid = result.products.length;
  const skipped = result.skipped.length;
  let msg = '✅ Hợp lệ (active + có title): ' + valid + ' dòng\n';
  msg += '⏭ Skip: ' + skipped + ' dòng\n';
  if (skipped > 0) {
    msg += '\nChi tiết:\n' + result.skipped.slice(0, 10).map((s) => 'Dòng ' + s.rowNum + ': ' + s.reason).join('\n');
  }

  const warnings = [];
  result.products.forEach((p) => {
    if (!p.affiliateUrl) warnings.push('Dòng ' + p._rowNum + ': thiếu affiliateUrl');
    if (!p.images.length) warnings.push('Dòng ' + p._rowNum + ': thiếu image');
  });
  if (warnings.length) {
    msg += '\n\n⚠️ Cảnh báo:\n' + warnings.slice(0, 10).join('\n');
  }
  SpreadsheetApp.getUi().alert(msg);
}

function showStats() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map((h) => String(h || '').toLowerCase());
  const statusIdx = headers.indexOf('status');
  const catIdx = headers.indexOf('category');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('Sheet rỗng.');
    return;
  }
  const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  const byStatus = {};
  const byCategory = {};
  data.forEach((row) => {
    const s = String((statusIdx >= 0 ? row[statusIdx] : 'active') || 'active');
    byStatus[s] = (byStatus[s] || 0) + 1;
    const c = String((catIdx >= 0 ? row[catIdx] : '(none)') || '(none)');
    byCategory[c] = (byCategory[c] || 0) + 1;
  });
  let msg = '📊 Thống kê\n\nTổng: ' + data.length + ' dòng\n\nTheo status:\n';
  Object.keys(byStatus).forEach((k) => msg += '  ' + k + ': ' + byStatus[k] + '\n');
  msg += '\nTheo category:\n';
  Object.keys(byCategory).forEach((k) => msg += '  ' + k + ': ' + byCategory[k] + '\n');
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
