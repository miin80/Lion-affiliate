import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { scrapeRoute } from './routes/scrape.js';
import {
  listRoute,
  getRoute,
  saveRoute,
  deleteRoute,
} from './routes/products.js';

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',') }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'affiliate-backend', time: new Date().toISOString() });
});

// Scrape metadata từ link gốc — KHÔNG lưu, chỉ trả về data.
app.post('/api/scrape', scrapeRoute);

// CRUD sản phẩm (đã lưu sau khi admin import + chỉnh sửa).
app.get('/api/products', listRoute);
app.get('/api/products/:id', getRoute);
app.post('/api/products', saveRoute);     // create or update (truyền id nếu update)
app.put('/api/products/:id', (req, res) => {
  req.body.id = req.params.id;
  return saveRoute(req, res);
});
app.delete('/api/products/:id', deleteRoute);

app.use((err, _req, res, _next) => {
  console.error('UNHANDLED:', err);
  res.status(500).json({ error: err.message || 'Internal error' });
});

app.listen(PORT, () => {
  console.log(`✅ Affiliate backend listening on http://localhost:${PORT}`);
  console.log(`   CORS allowed: ${CORS_ORIGIN}`);
});
