// Products store — dual impl: Supabase (production) hoặc JSON file (dev fallback).
// Tự detect qua USE_SUPABASE flag. API public function giữ NGUYÊN signature
// để routes/products.js không phải sửa.
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, USE_SUPABASE } from './supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const FILE = path.join(DATA_DIR, 'products.json');

// ============================================================================
// JSON FILE IMPL (fallback khi USE_SUPABASE=false)
// ============================================================================
let memCache = null;
let writeQueue = Promise.resolve();

async function jsonEnsureFile() {
  try {
    await fs.access(FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, '[]', 'utf8');
  }
}

async function jsonRead() {
  if (memCache) return memCache;
  await jsonEnsureFile();
  const txt = await fs.readFile(FILE, 'utf8');
  let arr;
  try {
    arr = JSON.parse(txt) || [];
  } catch {
    arr = [];
  }
  memCache = arr.map((p) => ({ status: 'active', ...p }));
  return memCache;
}

async function jsonWrite(arr) {
  memCache = arr;
  writeQueue = writeQueue.then(() =>
    fs.writeFile(FILE, JSON.stringify(arr, null, 2), 'utf8')
  );
  return writeQueue;
}

// ============================================================================
// SUPABASE IMPL
// Row schema: { id, data (jsonb full product), status, slug, category, source,
//               created_at, updated_at, trashed_at }
// ============================================================================
function rowToProduct(row) {
  if (!row) return null;
  // data jsonb chứa full object; cột top-level (status/slug/...) là copy để query.
  return {
    ...(row.data || {}),
    id: row.id,
    status: row.status,
    slug: row.slug || row.data?.slug,
    category: row.category || row.data?.category,
    source: row.source || row.data?.source || 'manual',
    createdAt: row.created_at || row.data?.createdAt,
    updatedAt: row.updated_at || row.data?.updatedAt,
    trashedAt: row.trashed_at || row.data?.trashedAt || null,
  };
}

function productToRow(p) {
  const data = { ...p };
  // Loại bỏ các field trùng top-level để không nhân đôi dữ liệu trong jsonb
  // (nhưng vẫn keep cho backward compat khi đọc lại — không quan trọng)
  return {
    id: p.id,
    data,
    status: p.status || 'active',
    slug: p.slug || null,
    category: p.category || null,
    source: p.source || 'manual',
    updated_at: new Date().toISOString(),
    trashed_at: p.status === 'trash' ? new Date().toISOString() : null,
  };
}

async function supaListAll() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`[supabase products] ${error.message}`);
  return (data || []).map(rowToProduct);
}

async function supaListActive() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`[supabase products] ${error.message}`);
  return (data || []).map(rowToProduct);
}

async function supaListTrash() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'trash');
  if (error) throw new Error(`[supabase products] ${error.message}`);
  return (data || []).map(rowToProduct);
}

async function supaGet(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`[supabase products] ${error.message}`);
  return data ? rowToProduct(data) : null;
}

async function supaUpsert(product) {
  const row = productToRow(product);
  const { data, error } = await supabase
    .from('products')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(`[supabase products] ${error.message}`);
  return rowToProduct(data);
}

async function supaDelete(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(`[supabase products] ${error.message}`);
  return true;
}

async function supaSetStatus(id, status) {
  if (!['active', 'hidden', 'trash'].includes(status)) {
    throw new Error('Status không hợp lệ. Chỉ chấp nhận: active | hidden | trash.');
  }
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('products')
    .update({
      status,
      updated_at: now,
      trashed_at: status === 'trash' ? now : null,
    })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw new Error(`[supabase products] ${error.message}`);
  return data ? rowToProduct(data) : null;
}

async function supaBulkSetStatus(ids, status) {
  if (!Array.isArray(ids) || !ids.length) return { updated: 0 };
  if (!['active', 'hidden', 'trash'].includes(status)) {
    throw new Error('Status không hợp lệ.');
  }
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('products')
    .update({
      status,
      updated_at: now,
      trashed_at: status === 'trash' ? now : null,
    })
    .in('id', ids)
    .select('id');
  if (error) throw new Error(`[supabase products] ${error.message}`);
  return { updated: data?.length || 0 };
}

// ============================================================================
// PUBLIC API — giữ nguyên signature cũ
// ============================================================================
function slugify(text) {
  return String(text || 'san-pham')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'san-pham';
}

/** Tất cả sản phẩm (dùng cho admin). */
export async function listProducts() {
  if (USE_SUPABASE) return supaListAll();
  return jsonRead();
}

// Lọc sản phẩm theo startDate/endDate.
//  - Chưa tới startDate → ẩn khỏi public.
//  - Quá endDate VÀ autoHideExpired !== false → ẩn khỏi public.
//  - Quá endDate VÀ autoHideExpired === false → vẫn hiện (frontend show badge "Hết hạn").
function isWithinSchedule(p) {
  const now = Date.now();
  if (p.startDate) {
    const start = new Date(p.startDate).getTime();
    if (Number.isFinite(start) && start > now) return false;
  }
  if (p.endDate && (p.autoHideExpired ?? true) !== false) {
    const end = new Date(p.endDate).getTime();
    if (Number.isFinite(end) && end < now) return false;
  }
  return true;
}

/** Chỉ sản phẩm status=active + trong khung schedule (public). */
export async function listActiveProducts() {
  let active;
  if (USE_SUPABASE) active = await supaListActive();
  else {
    const all = await jsonRead();
    active = all.filter((p) => (p.status || 'active') === 'active');
  }
  return active.filter(isWithinSchedule);
}

/** Sản phẩm trash. */
export async function listTrashProducts() {
  if (USE_SUPABASE) return supaListTrash();
  const all = await jsonRead();
  return all.filter((p) => p.status === 'trash');
}

export async function getProduct(id) {
  if (USE_SUPABASE) return supaGet(id);
  const all = await jsonRead();
  return all.find((p) => p.id === id) || null;
}

export async function setStatus(id, status) {
  if (USE_SUPABASE) return supaSetStatus(id, status);
  // JSON fallback
  if (!['active', 'hidden', 'trash'].includes(status)) {
    throw new Error('Status không hợp lệ. Chỉ chấp nhận: active | hidden | trash.');
  }
  const all = await jsonRead();
  const idx = all.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  all[idx] = {
    ...all[idx],
    status,
    updatedAt: now,
    trashedAt: status === 'trash' ? now : null,
  };
  await jsonWrite(all);
  return all[idx];
}

export async function bulkSetStatus(ids, status) {
  if (USE_SUPABASE) return supaBulkSetStatus(ids, status);
  if (!Array.isArray(ids) || !ids.length) return { updated: 0 };
  if (!['active', 'hidden', 'trash'].includes(status)) {
    throw new Error('Status không hợp lệ.');
  }
  const all = await jsonRead();
  const now = new Date().toISOString();
  let count = 0;
  ids.forEach((id) => {
    const i = all.findIndex((p) => p.id === id);
    if (i >= 0) {
      all[i] = {
        ...all[i],
        status,
        updatedAt: now,
        trashedAt: status === 'trash' ? now : null,
      };
      count++;
    }
  });
  await jsonWrite(all);
  return { updated: count };
}

export async function saveProduct(product) {
  const now = new Date().toISOString();
  const id = product.id || `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const slug = product.slug || slugify(product.title || id);

  if (USE_SUPABASE) {
    // Lấy bản cũ (nếu có) để giữ createdAt + source
    const existing = await supaGet(id);
    const merged = {
      ...(existing || {}),
      ...product,
      id,
      slug: existing?.slug || slug,
      status: product.status || existing?.status || 'active',
      source: existing?.source || product.source || 'manual',
      updatedAt: now,
      createdAt: existing?.createdAt || now,
    };
    return supaUpsert(merged);
  }

  // JSON fallback
  const all = await jsonRead();
  const idx = all.findIndex((p) => p.id === id);
  const next = {
    ...(idx >= 0 ? all[idx] : {}),
    ...product,
    id,
    slug: idx >= 0 ? all[idx].slug : slug,
    status: product.status || (idx >= 0 ? all[idx].status : 'active') || 'active',
    source: idx >= 0 ? all[idx].source || 'manual' : (product.source || 'manual'),
    updatedAt: now,
    createdAt: idx >= 0 ? all[idx].createdAt : now,
  };
  if (idx >= 0) all[idx] = next;
  else all.unshift(next);
  await jsonWrite(all);
  return next;
}

export async function deleteProduct(id) {
  if (USE_SUPABASE) return supaDelete(id);
  const all = await jsonRead();
  const next = all.filter((p) => p.id !== id);
  await jsonWrite(next);
  return all.length !== next.length;
}
