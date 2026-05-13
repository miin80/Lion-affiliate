// ============================================================================
// Migrate JSON files → Supabase.
//
// Cách chạy:
//   1. Set env (file .env hoặc inline):
//        SUPABASE_URL=...
//        SUPABASE_SERVICE_ROLE_KEY=...
//   2. Chắc chắn đã chạy backend/supabase/schema.sql trên Supabase.
//   3. cd backend && npm run migrate:supabase
//
// Behavior:
//   - Đọc các file JSON trong backend/data/
//   - Upsert vào Supabase (onConflict id) — KHÔNG xoá data hiện có.
//   - In log số rows mỗi bảng.
//   - Idempotent: chạy nhiều lần ok, chỉ update theo id.
// ============================================================================
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('❌ Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong env.');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function readJsonSafe(filename, fallback) {
  try {
    const txt = await fs.readFile(path.join(DATA_DIR, filename), 'utf8');
    return JSON.parse(txt);
  } catch {
    console.warn(`⚠️  ${filename} không có / không đọc được — skip.`);
    return fallback;
  }
}

async function migrateProducts() {
  const arr = await readJsonSafe('products.json', []);
  if (!arr.length) return { count: 0 };
  const rows = arr.map((p) => ({
    id: p.id,
    data: p,
    status: p.status || 'active',
    slug: p.slug || null,
    category: p.category || null,
    source: p.source || 'manual',
    created_at: p.createdAt || new Date().toISOString(),
    updated_at: p.updatedAt || new Date().toISOString(),
    trashed_at: p.trashedAt || (p.status === 'trash' ? p.updatedAt : null),
  }));
  // Upsert theo batch (500 row/batch)
  let count = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await supabase.from('products').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`[products] upsert chunk ${i}-${i + chunk.length} ERROR:`, error.message);
    } else {
      count += chunk.length;
    }
  }
  return { count };
}

async function migrateGeneric(filename, table) {
  const arr = await readJsonSafe(filename, []);
  if (!arr.length) return { count: 0 };
  const rows = arr.map((it) => ({
    id: it.id,
    data: it,
    status: it.status || 'active',
    order: typeof it.order === 'number' ? it.order : 0,
    created_at: it.createdAt || new Date().toISOString(),
    updated_at: it.updatedAt || new Date().toISOString(),
    trashed_at: it.trashedAt || (it.status === 'trash' ? it.updatedAt : null),
  }));
  let count = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`[${table}] upsert chunk ${i}-${i + chunk.length} ERROR:`, error.message);
    } else {
      count += chunk.length;
    }
  }
  return { count };
}

async function migrateSingleton(filename, table, defaultData = {}) {
  const obj = await readJsonSafe(filename, defaultData);
  if (!obj || (Array.isArray(obj) && !obj.length)) return { ok: false };
  const { error } = await supabase
    .from(table)
    .upsert(
      { id: 'singleton', data: obj, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
  if (error) {
    console.error(`[${table}] singleton upsert ERROR:`, error.message);
    return { ok: false };
  }
  return { ok: true };
}

async function main() {
  console.log('🚀 Migration JSON → Supabase bắt đầu...\n');
  console.log('Supabase URL:', url, '\n');

  // 1. Products
  const p = await migrateProducts();
  console.log(`✅ products: migrated ${p.count} rows`);

  // 2-5. Generic resources
  for (const [filename, table] of [
    ['videos.json', 'videos'],
    ['categories.json', 'categories'],
    ['collections.json', 'collections'],
    ['blogs.json', 'blogs'],
  ]) {
    const r = await migrateGeneric(filename, table);
    console.log(`✅ ${table}: migrated ${r.count} rows`);
  }

  // 6-8. Singletons
  const s1 = await migrateSingleton('siteSettings.json', 'site_settings');
  console.log(`${s1.ok ? '✅' : '⚠️'} site_settings: ${s1.ok ? 'OK' : 'skip'}`);

  const s2 = await migrateSingleton('googleSheetSettings.json', 'google_sheet_settings');
  console.log(`${s2.ok ? '✅' : '⚠️'} google_sheet_settings: ${s2.ok ? 'OK' : 'skip'}`);

  const s3 = await migrateSingleton('analytics.json', 'analytics_state', {
    clicks: {},
    totalClicks: 0,
    lastUpdated: null,
  });
  console.log(`${s3.ok ? '✅' : '⚠️'} analytics_state: ${s3.ok ? 'OK' : 'skip'}`);

  console.log('\n🎉 Migration hoàn tất. Dữ liệu hiện đã ở Supabase, JSON file vẫn được giữ làm backup.');
  console.log('Bước tiếp: set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY trên Render → redeploy backend.');
}

main().catch((err) => {
  console.error('❌ Migration FAIL:', err);
  process.exit(1);
});
