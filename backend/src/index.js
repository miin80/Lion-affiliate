import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { scrapeRoute } from './routes/scrape.js';
import { importProductRoute } from './routes/importProduct.js';
import {
  listRoute,
  listAdminRoute,
  getRoute,
  saveRoute,
  bulkSaveRoute,
  bulkStatusRoute,
  statusRoute,
  deleteRoute,
  sheetSyncRoute,
} from './routes/products.js';
import { clickRoute, summaryRoute } from './routes/analytics.js';
import { getSettingsRoute, putSettingsRoute } from './routes/settings.js';
import { loginRoute, meRoute } from './routes/auth.js';
import { requireAuth } from './middleware/auth.js';
import {
  getSheetSettingsRoute,
  putSheetSettingsRoute,
  previewSheetRoute,
  importSheetRoute,
} from './routes/googleSheet.js';
import {
  backupExportRoute,
  backupExportCsvRoute,
  backupImportRoute,
} from './routes/backup.js';
import { createRoutes } from './store/genericStore.js';
import {
  videosStore,
  categoriesStore,
  collectionsStore,
  blogsStore,
} from './store/resources.js';

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Parse origins từ env (strip slash, whitespace).
const allowedList =
  CORS_ORIGIN === '*'
    ? null
    : CORS_ORIGIN.split(',').map((s) => s.trim().replace(/\/+$/, ''));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow same-origin / no-origin requests (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    // Wildcard
    if (allowedList === null) return callback(null, true);
    // Exact match (after normalization)
    const normalized = origin.replace(/\/+$/, '');
    if (allowedList.includes(normalized)) return callback(null, true);
    console.warn(`[CORS] Blocked origin: "${origin}". Allowed: ${JSON.stringify(allowedList)}`);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// Đảm bảo preflight cho mọi route
app.options('*', cors(corsOptions));
// 10mb để cho phép upload ảnh base64 inline (avatar, cover, thumbnail)
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'affiliate-backend', time: new Date().toISOString() });
});

// ============ AUTH ============
app.post('/api/auth/login', loginRoute);
app.get('/api/auth/me', meRoute);

// ============ PUBLIC ============
// Khách truy cập web đọc data — không cần token.
app.get('/api/products', listRoute);
app.get('/api/site-settings', getSettingsRoute);

// ============ ADMIN (yêu cầu token) ============
app.post('/api/scrape', requireAuth, scrapeRoute);
app.post('/api/import-product', requireAuth, importProductRoute);

// ⚠️ Quan trọng: routes có path cụ thể (/admin, /bulk) phải đăng ký TRƯỚC
//    routes có param (/:id), nếu không Express sẽ match :id="admin" → 404.
app.get('/api/products/admin', requireAuth, listAdminRoute);
app.post('/api/products/bulk', requireAuth, bulkSaveRoute);
app.patch('/api/products/bulk', requireAuth, bulkStatusRoute);
// Sheet sync — Apps Script paste URL → tự scrape + lưu + trả enriched data về Sheet
app.post('/api/products/sheet-sync', requireAuth, sheetSyncRoute);
app.post('/api/products', requireAuth, saveRoute);
app.get('/api/products/:id', getRoute);   // public detail by id (sau /admin)
app.put('/api/products/:id', requireAuth, (req, res) => {
  req.body.id = req.params.id;
  return saveRoute(req, res);
});
app.patch('/api/products/:id/status', requireAuth, statusRoute);
app.delete('/api/products/:id', requireAuth, deleteRoute);

app.put('/api/site-settings', requireAuth, putSettingsRoute);

// ============ ANALYTICS ============
// POST public — khách bấm Mua/Xem sẽ tracking. Không cần auth.
app.post('/api/analytics/click', clickRoute);
// GET admin — xem stats.
app.get('/api/analytics/summary', requireAuth, summaryRoute);

// ============ GOOGLE SHEET IMPORT (admin only) ============
app.get('/api/google-sheet/settings', requireAuth, getSheetSettingsRoute);
app.put('/api/google-sheet/settings', requireAuth, putSheetSettingsRoute);
app.post('/api/google-sheet/preview', requireAuth, previewSheetRoute);
app.post('/api/google-sheet/import', requireAuth, importSheetRoute);

// ============ BACKUP / RESTORE (admin only) ============
app.get('/api/backup/export', requireAuth, backupExportRoute);
app.get('/api/backup/export-csv', requireAuth, backupExportCsvRoute);
app.post('/api/backup/import', requireAuth, backupImportRoute);

// ============ GENERIC CMS RESOURCES ============
// Mỗi resource có: GET public (active only), GET /admin, GET /:id,
//                  POST (save), PUT /:id, PATCH /:id/status, DELETE /:id
function mountResource(base, store) {
  const r = createRoutes(store);
  app.get(`/api/${base}`, r.list);
  // /admin và /reorder phải đứng TRƯỚC /:id để Express match đúng
  app.get(`/api/${base}/admin`, requireAuth, r.listAdmin);
  app.patch(`/api/${base}/reorder`, requireAuth, async (req, res) => {
    try {
      const items = await store.reorder(req.body || []);
      res.json({ items });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.get(`/api/${base}/:id`, r.get);
  app.post(`/api/${base}`, requireAuth, r.save);
  app.put(`/api/${base}/:id`, requireAuth, r.update);
  app.patch(`/api/${base}/:id/status`, requireAuth, r.setStatus);
  app.delete(`/api/${base}/:id`, requireAuth, r.remove);
}
mountResource('videos', videosStore);
mountResource('categories', categoriesStore);
mountResource('collections', collectionsStore);
mountResource('blogs', blogsStore);

// Category public — chỉ trả category có ít nhất 1 sản phẩm active thuộc cat đó.
// Bonus: luôn giữ 'all' (Tất cả) và 'deal' (Deal hot) là 2 category đặc biệt.
import { listActiveProducts } from './store/products.js';
app.get('/api/categories/active-with-products', async (_req, res) => {
  try {
    const [cats, products] = await Promise.all([
      categoriesStore.listActive(),
      listActiveProducts(),
    ]);
    const usedSlugs = new Set(products.map((p) => p.category).filter(Boolean));
    const filtered = cats.filter((c) => {
      // Các category đặc biệt luôn giữ
      if (c.slug === 'all' || c.slug === 'deal') return true;
      // Còn lại chỉ giữ nếu có ít nhất 1 sản phẩm thuộc category đó
      return usedSlugs.has(c.slug);
    });
    res.json({ items: filtered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use((err, _req, res, _next) => {
  console.error('UNHANDLED:', err);
  res.status(500).json({ error: err.message || 'Internal error' });
});

app.listen(PORT, () => {
  console.log(`✅ Affiliate backend listening on http://localhost:${PORT}`);
  console.log(`   CORS allowed: ${CORS_ORIGIN}`);
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
    console.warn(
      '⚠️  ADMIN_USERNAME / ADMIN_PASSWORD chưa được set. Login admin sẽ fail. Hãy tạo file .env.'
    );
  }
});
