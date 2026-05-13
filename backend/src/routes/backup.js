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

const VERSION = 'lion-affiliate-backup/1.0';

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
    if (!body.data || typeof body.data !== 'object') {
      return res.status(400).json({ error: 'File backup không hợp lệ — thiếu field `data`.' });
    }
    if (body.version && !body.version.startsWith('lion-affiliate-backup')) {
      return res.status(400).json({ error: `File backup không phải của Lion Affiliate (version: ${body.version})` });
    }
    const d = body.data;
    const report = { products: 0, videos: 0, categories: 0, collections: 0, blogs: 0, errors: [] };

    // Import từng store. Nếu lỗi 1 mục → ghi vào report.errors nhưng tiếp tục.
    if (Array.isArray(d.products)) {
      for (const p of d.products) {
        try { await saveProduct(p); report.products++; }
        catch (err) { report.errors.push(`product ${p.id}: ${err.message}`); }
      }
    }
    if (Array.isArray(d.videos)) {
      for (const v of d.videos) {
        try { await videosStore.save(v); report.videos++; }
        catch (err) { report.errors.push(`video ${v.id}: ${err.message}`); }
      }
    }
    if (Array.isArray(d.categories)) {
      for (const c of d.categories) {
        try { await categoriesStore.save(c); report.categories++; }
        catch (err) { report.errors.push(`category ${c.id}: ${err.message}`); }
      }
    }
    if (Array.isArray(d.collections)) {
      for (const c of d.collections) {
        try { await collectionsStore.save(c); report.collections++; }
        catch (err) { report.errors.push(`collection ${c.id}: ${err.message}`); }
      }
    }
    if (Array.isArray(d.blogs)) {
      for (const b of d.blogs) {
        try { await blogsStore.save(b); report.blogs++; }
        catch (err) { report.errors.push(`blog ${b.id}: ${err.message}`); }
      }
    }
    if (d.siteSettings && typeof d.siteSettings === 'object') {
      try { await writeSettings(d.siteSettings); }
      catch (err) { report.errors.push(`siteSettings: ${err.message}`); }
    }
    if (d.googleSheetSettings && typeof d.googleSheetSettings === 'object') {
      try { await writeSheetSettings(d.googleSheetSettings); }
      catch (err) { report.errors.push(`googleSheetSettings: ${err.message}`); }
    }

    res.json({ ok: true, report });
  } catch (err) {
    console.error('[backup-import]', err);
    res.status(500).json({ error: err.message });
  }
}
