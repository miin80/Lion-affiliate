// Backup / Restore routes — export & import toàn bộ data về JSON.
//
// GET  /api/backup/export       → trả 1 JSON tổng hợp tất cả store
// GET  /api/backup/export-csv   → trả CSV danh sách sản phẩm
// POST /api/backup/import       → nhận JSON, upsert vào các store
//
// Tất cả routes require admin auth (đã wire qua requireAuth ở index.js).
import {
  listProducts,
  saveProduct,
} from '../store/products.js';
import {
  videosStore,
  categoriesStore,
  collectionsStore,
  blogsStore,
} from '../store/resources.js';
import { readSettings, writeSettings } from '../store/settings.js';
import { readSheetSettings, writeSheetSettings } from '../store/sheetSettings.js';
import { validateProduct } from '../shared/productSchema.js';

const VERSION = 'lion-affiliate-backup/1.0';
// Giới hạn an toàn: 1 backup không nên chứa quá nhiều bản ghi (chống abuse).
const MAX_ITEMS_PER_RESOURCE = 10000;

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Validate sơ bộ 1 resource item (video/category/collection/blog).
 * Yêu cầu là plain object + có slug (categories/collections/blogs cần slug để route public).
 * Trả { ok: true } hoặc { ok: false, error: '...' }.
 */
function validateResourceItem(item, type) {
  if (!isPlainObject(item)) return { ok: false, error: 'không phải object hợp lệ' };
  // Videos không yêu cầu slug; còn lại cần slug + name/title
  if (type === 'categories') {
    if (!item.slug || typeof item.slug !== 'string' || !item.slug.trim()) {
      return { ok: false, error: 'thiếu slug' };
    }
    if (!item.name || typeof item.name !== 'string' || !item.name.trim()) {
      return { ok: false, error: 'thiếu name' };
    }
  }
  if (type === 'collections' || type === 'blogs') {
    if (!item.slug || typeof item.slug !== 'string' || !item.slug.trim()) {
      return { ok: false, error: 'thiếu slug' };
    }
    if (!item.title || typeof item.title !== 'string' || !item.title.trim()) {
      return { ok: false, error: 'thiếu title' };
    }
  }
  if (type === 'videos') {
    if (!item.title || typeof item.title !== 'string' || !item.title.trim()) {
      return { ok: false, error: 'thiếu title' };
    }
  }
  return { ok: true };
}

export async function backupExportRoute(_req, res) {
  try {
    const [products, videos, categories, collections, blogs, siteSettings, sheetSettings] =
      await Promise.all([
        listProducts(),
        videosStore.list(),
        categoriesStore.list(),
        collectionsStore.list(),
        blogsStore.list(),
        readSettings(),
        readSheetSettings(),
      ]);
    const payload = {
      version: VERSION,
      exportedAt: new Date().toISOString(),
      counts: {
        products: products.length,
        videos: videos.length,
        categories: categories.length,
        collections: collections.length,
        blogs: blogs.length,
      },
      data: {
        products,
        videos,
        categories,
        collections,
        blogs,
        siteSettings,
        googleSheetSettings: sheetSettings,
      },
    };
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="lion-backup-${new Date().toISOString().slice(0, 10)}.json"`
    );
    res.send(JSON.stringify(payload, null, 2));
  } catch (err) {
    console.error('[backup-export]', err);
    res.status(500).json({ error: err.message });
  }
}

function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function backupExportCsvRoute(_req, res) {
  try {
    const products = await listProducts();
    const headers = [
      'id', 'slug', 'title', 'sourceUrl', 'affiliateUrl', 'category',
      'price', 'priceMin', 'priceMax', 'originalPrice', 'oldPriceMin', 'oldPriceMax',
      'discountPercent', 'rating', 'reviewCount', 'sold', 'soldText',
      'description', 'image', 'gallery', 'video', 'tags',
      'badges', 'status', 'source', 'platform', 'createdAt', 'updatedAt',
    ];
    const lines = [headers.join(',')];
    products.forEach((p) => {
      const row = [
        p.id, p.slug, p.title, p.sourceUrl, p.affiliateUrl, p.category,
        p.price, p.priceMin, p.priceMax, p.originalPrice, p.oldPriceMin, p.oldPriceMax,
        p.discountPercent, p.rating, p.reviewCount, p.sold, p.soldText,
        p.description, p.images?.[0] || '', (p.images || []).slice(1).join('|'),
        p.videos?.[0] || p.video || '',
        (p.tags || []).join('|'),
        (p.badges || []).join('|'),
        p.status, p.source, p.platform,
        p.createdAt, p.updatedAt,
      ].map(csvEscape).join(',');
      lines.push(row);
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="lion-products-${new Date().toISOString().slice(0, 10)}.csv"`
    );
    // BOM cho Excel mở UTF-8 đúng
    res.send('﻿' + lines.join('\n'));
  } catch (err) {
    console.error('[backup-csv]', err);
    res.status(500).json({ error: err.message });
  }
}

export async function backupImportRoute(req, res) {
  try {
    const body = req.body || {};
    if (!isPlainObject(body)) {
      return res.status(400).json({ error: 'File backup không hợp lệ — body phải là object.' });
    }
    if (!isPlainObject(body.data)) {
      return res.status(400).json({ error: 'File backup không hợp lệ — thiếu field `data` (object).' });
    }
    if (body.version && !String(body.version).startsWith('lion-affiliate-backup')) {
      return res.status(400).json({ error: `File backup không phải của Lion Affiliate (version: ${body.version})` });
    }
    // Drop unknown top-level keys: chỉ pick các resource hợp lệ.
    const d = body.data;
    const ALLOWED_RESOURCES = ['products', 'videos', 'categories', 'collections', 'blogs', 'siteSettings', 'googleSheetSettings'];
    for (const key of Object.keys(d)) {
      if (!ALLOWED_RESOURCES.includes(key)) {
        // Bỏ qua, không cảnh báo lỗi — chỉ defend
        delete d[key];
      }
    }
    const report = { products: 0, videos: 0, categories: 0, collections: 0, blogs: 0, errors: [] };

    // PRODUCTS — validate qua schema chung (validateProduct).
    if (Array.isArray(d.products)) {
      if (d.products.length > MAX_ITEMS_PER_RESOURCE) {
        return res.status(400).json({ error: `products[] quá lớn (max ${MAX_ITEMS_PER_RESOURCE})` });
      }
      for (const p of d.products) {
        try {
          if (!isPlainObject(p)) {
            report.errors.push('product: không phải object hợp lệ');
            continue;
          }
          const v = validateProduct(p);
          if (!v.ok) {
            report.errors.push(`product ${p.id || '(no id)'}: ${v.errors.join('; ')}`);
            continue;
          }
          await saveProduct(p);
          report.products++;
        } catch (err) { report.errors.push(`product ${p?.id || '(no id)'}: ${err.message}`); }
      }
    }
    // VIDEOS / CATEGORIES / COLLECTIONS / BLOGS — validate basic shape.
    const resourceMap = [
      ['videos', d.videos, videosStore],
      ['categories', d.categories, categoriesStore],
      ['collections', d.collections, collectionsStore],
      ['blogs', d.blogs, blogsStore],
    ];
    for (const [type, list, store] of resourceMap) {
      if (!Array.isArray(list)) continue;
      if (list.length > MAX_ITEMS_PER_RESOURCE) {
        return res.status(400).json({ error: `${type}[] quá lớn (max ${MAX_ITEMS_PER_RESOURCE})` });
      }
      for (const item of list) {
        try {
          const v = validateResourceItem(item, type);
          if (!v.ok) {
            report.errors.push(`${type} ${item?.id || item?.slug || '(no id)'}: ${v.error}`);
            continue;
          }
          await store.save(item);
          report[type]++;
        } catch (err) {
          report.errors.push(`${type} ${item?.id || '(no id)'}: ${err.message}`);
        }
      }
    }
    // SETTINGS singletons — chỉ accept plain object, không accept array/null.
    if (d.siteSettings !== undefined) {
      if (!isPlainObject(d.siteSettings)) {
        report.errors.push('siteSettings: phải là object');
      } else {
        try { await writeSettings(d.siteSettings); }
        catch (err) { report.errors.push(`siteSettings: ${err.message}`); }
      }
    }
    if (d.googleSheetSettings !== undefined) {
      if (!isPlainObject(d.googleSheetSettings)) {
        report.errors.push('googleSheetSettings: phải là object');
      } else {
        try { await writeSheetSettings(d.googleSheetSettings); }
        catch (err) { report.errors.push(`googleSheetSettings: ${err.message}`); }
      }
    }

    res.json({ ok: true, report });
  } catch (err) {
    console.error('[backup-import]', err);
    res.status(500).json({ error: err.message });
  }
}
