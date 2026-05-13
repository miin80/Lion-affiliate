// Analytics — dual impl: Supabase singleton blob hoặc JSON file.
// Giữ schema cũ: { clicks: { '<type>:<id>': { total, byDay, type, id, action } }, totalClicks, lastUpdated }.
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, USE_SUPABASE } from './supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const FILE = path.join(DATA_DIR, 'analytics.json');
const TABLE = 'analytics_state';
const SINGLETON_ID = 'singleton';

const DEFAULT_DATA = { clicks: {}, totalClicks: 0, lastUpdated: null };

let memCache = null;
let writeQueue = Promise.resolve();

// ============ JSON impl ============
async function jsonEnsure() {
  try {
    await fs.access(FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf8');
  }
}
async function jsonRead() {
  if (memCache) return memCache;
  await jsonEnsure();
  try {
    const txt = await fs.readFile(FILE, 'utf8');
    memCache = { ...DEFAULT_DATA, ...JSON.parse(txt) };
  } catch {
    memCache = { ...DEFAULT_DATA };
  }
  return memCache;
}
function jsonWrite(data) {
  memCache = data;
  writeQueue = writeQueue.then(() => fs.writeFile(FILE, JSON.stringify(data, null, 2), 'utf8'));
  return writeQueue;
}

// ============ Supabase impl ============
async function supaRead() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('data')
    .eq('id', SINGLETON_ID)
    .maybeSingle();
  if (error) throw new Error(`[supabase ${TABLE}] ${error.message}`);
  return { ...DEFAULT_DATA, ...(data?.data || {}) };
}
async function supaWrite(obj) {
  const { error } = await supabase
    .from(TABLE)
    .upsert(
      { id: SINGLETON_ID, data: obj, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
  if (error) throw new Error(`[supabase ${TABLE}] ${error.message}`);
  return obj;
}

async function readAll() {
  if (USE_SUPABASE) return supaRead();
  return jsonRead();
}
async function writeAll(obj) {
  if (USE_SUPABASE) return supaWrite(obj);
  return jsonWrite(obj);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// ============ Public API ============
export async function trackClick({ type, id, action }) {
  if (!type || !id) return null;
  const data = await readAll();
  const key = `${type}:${id}`;
  if (!data.clicks[key]) {
    data.clicks[key] = { total: 0, byDay: {}, action: action || 'buy', type, id };
  }
  data.clicks[key].total++;
  const td = todayKey();
  data.clicks[key].byDay[td] = (data.clicks[key].byDay[td] || 0) + 1;
  data.totalClicks++;
  data.lastUpdated = new Date().toISOString();
  await writeAll(data);
  return data.clicks[key];
}

export async function getSummary() {
  const data = await readAll();
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

  Object.entries(data.clicks || {}).forEach(([_, c]) => {
    todayClicks += c.byDay?.[today] || 0;
    last7Days += days7.reduce((sum, d) => sum + (c.byDay?.[d] || 0), 0);
    if (c.type === 'product') productList.push({ id: c.id, total: c.total });
    else if (c.type === 'video') videoList.push({ id: c.id, total: c.total });
  });

  const top5Products = productList.sort((a, b) => b.total - a.total).slice(0, 5);
  const top5Videos = videoList.sort((a, b) => b.total - a.total).slice(0, 5);

  return {
    totalClicks: data.totalClicks || 0,
    todayClicks,
    last7Days,
    top5Products,
    top5Videos,
    lastUpdated: data.lastUpdated,
  };
}
