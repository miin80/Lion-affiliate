// ============================================================================
//  Google Sheet Service
//  Fetch CSV từ Google Sheet (publish to web), parse, validate, map sang schema
//  sản phẩm của hệ thống.
// ============================================================================
import axios from 'axios';
import Papa from 'papaparse';

const TIMEOUT = 20000;

import { COL_ALIASES as SCHEMA_ALIASES } from '../shared/productSchema.js';

// Aliases load từ shared schema — single source of truth.
// Backward compat: thêm alias cũ 'oldPrice' → field 'originalPrice'.
const COL_ALIASES = {
  ...SCHEMA_ALIASES,
  // Alias cũ: cột "oldPrice" trong sheet cũ map về originalPrice (schema giờ dùng tên này)
  oldPrice: SCHEMA_ALIASES.originalPrice,
};

/** Build map từ tên cột thực tế của Sheet → field chuẩn. */
function buildColumnMap(headers) {
  const map = {};
  const normalized = headers.map((h) => (h || '').trim().toLowerCase());
  for (const [field, aliases] of Object.entries(COL_ALIASES)) {
    for (const alias of aliases) {
      const idx = normalized.indexOf(alias.toLowerCase());
      if (idx >= 0) {
        map[field] = headers[idx];
        break;
      }
    }
  }
  return map;
}

function parseBool(v) {
  if (typeof v === 'boolean') return v;
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'có' || s === 'co' || s === 'x';
}

function parseNumber(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(String(v).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function splitList(v) {
  if (!v) return [];
  return String(v)
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function slugify(text) {
  return String(text || 'san-pham')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'san-pham';
}

/**
 * Convert URL người dùng paste (có thể là Google Sheet edit URL) sang CSV export URL.
 * Hỗ trợ:
 *  - .../pub?output=csv  (publish to web)
 *  - .../export?format=csv&gid=0  (file export)
 *  - .../edit?usp=sharing  → convert sang export
 */
export function normalizeCsvUrl(url) {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  // Pattern 1: published CSV
  if (/\/pub\?.*output=csv/i.test(trimmed)) return trimmed;
  // Pattern 2: export CSV
  if (/\/export\?.*format=csv/i.test(trimmed)) return trimmed;
  // Pattern 3: docs.google.com/spreadsheets/d/SHEETID/edit... → convert
  const m = trimmed.match(/spreadsheets\/d\/([\w-]+)/);
  if (m) {
    const sheetId = m[1];
    // gid extract nếu có
    const gidMatch = trimmed.match(/[?#&]gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }
  return trimmed;
}

/** Fetch CSV string từ Google Sheet URL. */
export async function fetchCsv(url) {
  const finalUrl = normalizeCsvUrl(url);
  if (!finalUrl) throw new Error('CSV URL không hợp lệ.');
  const { data } = await axios.get(finalUrl, {
    timeout: TIMEOUT,
    responseType: 'text',
    transformResponse: [(d) => d], // không tự parse
    headers: {
      Accept: 'text/csv,text/plain,*/*',
      'User-Agent': 'Mozilla/5.0 (compatible; LionAffiliateBot/1.0)',
    },
    maxRedirects: 5,
  });
  if (typeof data !== 'string') throw new Error('Response không phải CSV.');
  return data;
}

/** Parse CSV string → mảng rows (object key:value theo header gốc). */
export function parseCsv(csvText) {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  if (result.errors?.length) {
    console.warn('[sheet] Papa parse warnings:', result.errors.slice(0, 3));
  }
  return result.data || [];
}

/**
 * Map 1 row CSV → product object theo schema hệ thống.
 * Trả về { product, warnings: [], errors: [] }.
 *  - errors: row không thể import (thiếu required fields)
 *  - warnings: row vẫn import nhưng có cảnh báo
 */
export function mapRow(row, colMap, index) {
  const get = (field) => {
    const csvCol = colMap[field];
    if (!csvCol) return '';
    return (row[csvCol] || '').toString().trim();
  };

  const warnings = [];
  const errors = [];

  const id = get('id');
  const title = get('title');
  const affiliateUrl = get('affiliateUrl');
  const status = (get('status') || 'active').toLowerCase();

  if (!title) errors.push('Thiếu title');
  if (!affiliateUrl) {
    warnings.push('Thiếu affiliateUrl — nút Mua sẽ trỏ về sourceUrl (không có tracking)');
  }

  const image = get('image');
  const gallery = splitList(get('gallery'));
  const images = image ? [image, ...gallery.filter((g) => g !== image)] : gallery;
  if (!images.length) warnings.push('Không có ảnh');

  const tags = splitList(get('tags'));
  const badges = ['reviewed'];
  if (parseBool(get('isHot'))) badges.push('hot');
  if (parseBool(get('isBestSeller'))) badges.push('bestseller');

  const product = {
    // id rỗng → backend tự generate (tạo mới)
    // id có sẵn → backend upsert (update nếu trùng)
    id: id || undefined,
    slug: slugify(title || id),
    title,
    sourceUrl: get('sourceUrl'),
    affiliateUrl,
    category: get('category') || 'gia-dung',
    price: parseNumber(get('price')),
    originalPrice: parseNumber(get('oldPrice')),
    description: get('description'),
    images,
    image: images[0] || null,
    gallery: images.slice(1),
    video: get('video'),
    videos: get('video') ? [get('video')] : [],
    rating: parseNumber(get('rating')) || 4.8,
    reviewCount: 0,
    sold: 0,
    tags,
    badges,
    isHot: parseBool(get('isHot')),
    isBestSeller: parseBool(get('isBestSeller')),
    platform: detectPlatformFromUrl(get('sourceUrl') || affiliateUrl),
    status: ['active', 'hidden'].includes(status) ? status : 'active',
  };

  return { product, warnings, errors, rowIndex: index, originalStatus: status };
}

function detectPlatformFromUrl(url) {
  if (!url) return 'other';
  if (/shopee\./i.test(url)) return 'shopee';
  if (/tiktok\.com|shop\.tiktok/i.test(url)) return 'tiktok';
  if (/lazada\./i.test(url)) return 'lazada';
  if (/tiki\.vn/i.test(url)) return 'tiki';
  return 'other';
}

/**
 * Lấy CSV → parse → map → trả về { rows, columnMap, summary }
 *  - rows: [{ product, warnings, errors, rowIndex }]
 *  - summary: { total, valid, errors, hidden }
 */
export async function fetchAndPreview(csvUrl) {
  const csv = await fetchCsv(csvUrl);
  const rawRows = parseCsv(csv);
  if (!rawRows.length) {
    return { rows: [], columnMap: {}, summary: { total: 0, valid: 0, errors: 0, hidden: 0 } };
  }
  const headers = Object.keys(rawRows[0]);
  const colMap = buildColumnMap(headers);

  if (!colMap.title) {
    throw new Error(
      `Không tìm thấy cột "title" trong Sheet. Cột hiện tại: ${headers.join(', ')}`
    );
  }

  const rows = rawRows.map((r, i) => mapRow(r, colMap, i + 2)); // +2: dòng 1 = header, index 0 = row 2

  const summary = {
    total: rows.length,
    valid: rows.filter((r) => !r.errors.length).length,
    errors: rows.filter((r) => r.errors.length).length,
    hidden: rows.filter((r) => r.originalStatus === 'hidden').length,
    detectedColumns: colMap,
    headers,
  };

  return { rows, columnMap: colMap, summary };
}
