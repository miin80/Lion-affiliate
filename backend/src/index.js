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
  statusRoute,
  deleteRoute,
} from './routes/products.js';
import { getSettingsRoute, putSettingsRoute } from './routes/settings.js';
import { loginRoute, meRoute } from './routes/auth.js';
import { requireAuth } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',') }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'affiliate-backend', time: new Date().toISOString() });
});

// ============ AUTH ============
app.post('/api/auth/login', loginRoute);
app.get('/api/auth/me', meRoute);

// ============ PUBLIC ============
// Khách truy cập web đọc data — không cần token.
app.get('/api/products', listRoute);
app.get('/api/products/:id', getRoute);
app.get('/api/site-settings', getSettingsRoute);

// ============ ADMIN (yêu cầu token) ============
app.post('/api/scrape', requireAuth, scrapeRoute);
app.post('/api/import-product', requireAuth, importProductRoute);

app.get('/api/products/admin', requireAuth, listAdminRoute);
app.post('/api/products', requireAuth, saveRoute);
app.put('/api/products/:id', requireAuth, (req, res) => {
  req.body.id = req.params.id;
  return saveRoute(req, res);
});
app.patch('/api/products/:id/status', requireAuth, statusRoute);
app.delete('/api/products/:id', requireAuth, deleteRoute);

app.put('/api/site-settings', requireAuth, putSettingsRoute);

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
