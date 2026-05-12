// Click analytics — đếm số click "Mua ngay", "Xem deal" cho từng item.
// Lưu vào analytics.json. Đơn giản, không cần database.
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const FILE = path.join(DATA_DIR, 'analytics.json');

/**
 * Schema:
 * {
 *   "clicks": {
 *     "product:<id>": { "total": N, "byDay": { "YYYY-MM-DD": N } },
 *     "video:<id>": { ... }
 *   },
 *   "totalClicks": 1234,
 *   "lastUpdated": "..."
 * }
 */
const DEFAULT_DATA = { clicks: {}, totalClicks: 0, lastUpdated: null };

let memCache = null;
let writeQueue = Promise.resolve();

async function ensure() {
  try {
    await fs.access(FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf8');
  }
}

async function read() {
  if (memCache) return memCache;
  await ensure();
  try {
    const txt = await fs.readFile(FILE, 'utf8');
    memCache = { ...DEFAULT_DATA, ...JSON.parse(txt) };
  } catch {
    memCache = { ...DEFAULT_DATA };
  }
  return memCache;
}

function write(data) {
  memCache = data;
  writeQueue = writeQueue.then(() => fs.writeFile(FILE, JSON.stringify(data, null, 2), 'utf8'));
  return writeQueue;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/** Track 1 click. type: 'product' | 'video' | 'collection' */
export async function trackClick({ type, id, action }) {
  if (!type || !id) return null;
  const data = await read();
  const key = `${type}:${id}`;
  if (!data.clicks[key]) {
    data.clicks[key] = { total: 0, byDay: {}, action: action || 'buy', type, id };
  }
  data.clicks[key].total++;
  const td = todayKey();
  data.clicks[key].byDay[td] = (data.clicks[key].byDay[td] || 0) + 1;
  data.totalClicks++;
  data.lastUpdated = new Date().toISOString();
  await write(data);
  return data.clicks[key];
}

/** Summary statistics. */
export async function getSummary() {
  const data = await read();
  const today = todayKey();
  const days7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });

  let todayClicks = 0;
  let last7Days = 0;
  const productList = [];
  const videoList = [];

  Object.entries(data.clicks).forEach(([key, c]) => {
    todayClicks += c.byDay?.[today] || 0;
    last7Days += days7.reduce((sum, d) => sum + (c.byDay?.[d] || 0), 0);
    if (c.type === 'product') productList.push({ id: c.id, total: c.total });
    else if (c.type === 'video') videoList.push({ id: c.id, total: c.total });
  });

  const top5Products = productList.sort((a, b) => b.total - a.total).slice(0, 5);
  const top5Videos = videoList.sort((a, b) => b.total - a.total).slice(0, 5);

  return {
    totalClicks: data.totalClicks,
    todayClicks,
    last7Days,
    top5Products,
    top5Videos,
    lastUpdated: data.lastUpdated,
  };
}
