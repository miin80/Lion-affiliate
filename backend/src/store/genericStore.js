// Generic store factory cho 4 resource: videos, categories, collections, blogs.
// Dual impl: Supabase (production) hoặc JSON file (dev fallback).
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, USE_SUPABASE } from './supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

/**
 * Tạo store cho 1 resource.
 *
 * @param {object} opts
 * @param {string} opts.filename  - tên file JSON (vd 'videos.json')
 * @param {string} opts.table     - tên table Supabase (vd 'videos')
 * @param {Array} opts.defaults   - data seed mặc định
 */
export function createStore({ filename, table, defaults = [] }) {
  // Nếu chỉ truyền filename mà không có table thì auto-derive (videos.json → videos)
  const tableName = table || filename.replace(/\.json$/, '');
  const FILE = path.join(DATA_DIR, filename);

  // ============ JSON file impl ============
  let memCache = null;
  let writeQueue = Promise.resolve();

  async function jsonEnsureFile() {
    try {
      await fs.access(FILE);
    } catch {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(FILE, JSON.stringify(defaults, null, 2), 'utf8');
    }
  }
  async function jsonRead() {
    if (memCache) return memCache;
    await jsonEnsureFile();
    const txt = await fs.readFile(FILE, 'utf8');
    try {
      memCache = (JSON.parse(txt) || []).map((it) => ({ status: 'active', ...it }));
    } catch {
      memCache = [];
    }
    return memCache;
  }
  async function jsonWrite(arr) {
    memCache = arr;
    writeQueue = writeQueue.then(() =>
      fs.writeFile(FILE, JSON.stringify(arr, null, 2), 'utf8')
    );
    return writeQueue;
  }

  function genId() {
    return `${tableName}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  }

  // ============ Supabase impl ============
  function rowToItem(row) {
    if (!row) return null;
    return {
      ...(row.data || {}),
      id: row.id,
      status: row.status,
      order: row.order ?? row.data?.order ?? 0,
      createdAt: row.created_at || row.data?.createdAt,
      updatedAt: row.updated_at || row.data?.updatedAt,
      trashedAt: row.trashed_at || row.data?.trashedAt || null,
    };
  }
  function itemToRow(item) {
    return {
      id: item.id,
      data: item,
      status: item.status || 'active',
      order: typeof item.order === 'number' ? item.order : 0,
      updated_at: new Date().toISOString(),
      trashed_at: item.status === 'trash' ? new Date().toISOString() : null,
    };
  }

  async function supaListAll() {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw new Error(`[supabase ${tableName}] ${error.message}`);
    return (data || []).map(rowToItem);
  }
  async function supaListActive() {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('status', 'active')
      .order('order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw new Error(`[supabase ${tableName}] ${error.message}`);
    return (data || []).map(rowToItem);
  }
  async function supaGet(id) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`[supabase ${tableName}] ${error.message}`);
    return data ? rowToItem(data) : null;
  }
  async function supaUpsert(item) {
    const row = itemToRow(item);
    const { data, error } = await supabase
      .from(tableName)
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw new Error(`[supabase ${tableName}] ${error.message}`);
    return rowToItem(data);
  }
  async function supaDelete(id) {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) throw new Error(`[supabase ${tableName}] ${error.message}`);
    return true;
  }

  return {
    async list() {
      if (USE_SUPABASE) return supaListAll();
      return jsonRead();
    },
    async listActive() {
      if (USE_SUPABASE) return supaListActive();
      const all = await jsonRead();
      return all
        .filter((it) => (it.status || 'active') === 'active')
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    },
    async get(id) {
      if (USE_SUPABASE) return supaGet(id);
      const all = await jsonRead();
      return all.find((it) => it.id === id) || null;
    },
    async save(item) {
      const now = new Date().toISOString();
      const id = item.id || genId();

      if (USE_SUPABASE) {
        const existing = await supaGet(id);
        const merged = {
          ...(existing || {}),
          ...item,
          id,
          status: item.status || existing?.status || 'active',
          updatedAt: now,
          createdAt: existing?.createdAt || now,
        };
        return supaUpsert(merged);
      }

      const all = await jsonRead();
      const idx = all.findIndex((it) => it.id === id);
      const next = {
        ...(idx >= 0 ? all[idx] : {}),
        ...item,
        id,
        status: item.status || (idx >= 0 ? all[idx].status : 'active') || 'active',
        updatedAt: now,
        createdAt: idx >= 0 ? all[idx].createdAt : now,
      };
      if (idx >= 0) all[idx] = next;
      else all.push(next);
      await jsonWrite(all);
      return next;
    },
    async setStatus(id, status) {
      if (!['active', 'hidden', 'trash'].includes(status)) {
        throw new Error('Status không hợp lệ. Chỉ active | hidden | trash.');
      }
      const now = new Date().toISOString();
      if (USE_SUPABASE) {
        const { data, error } = await supabase
          .from(tableName)
          .update({
            status,
            updated_at: now,
            trashed_at: status === 'trash' ? now : null,
          })
          .eq('id', id)
          .select()
          .maybeSingle();
        if (error) throw new Error(`[supabase ${tableName}] ${error.message}`);
        return data ? rowToItem(data) : null;
      }
      const all = await jsonRead();
      const idx = all.findIndex((it) => it.id === id);
      if (idx < 0) return null;
      all[idx] = {
        ...all[idx],
        status,
        updatedAt: now,
        trashedAt: status === 'trash' ? now : null,
      };
      await jsonWrite(all);
      return all[idx];
    },
    async remove(id) {
      if (USE_SUPABASE) return supaDelete(id);
      const all = await jsonRead();
      const next = all.filter((it) => it.id !== id);
      await jsonWrite(next);
      return all.length !== next.length;
    },
    async reorder(input) {
      if (!Array.isArray(input) || !input.length) return [];

      if (USE_SUPABASE) {
        // Update từng row (Supabase chưa hỗ trợ bulk update với khác value/row dễ).
        const updates = input.map((entry, i) => {
          if (typeof entry === 'string') return { id: entry, order: i };
          if (entry && entry.id) return { id: entry.id, order: entry.order ?? i };
          return null;
        }).filter(Boolean);
        // Promise.all để chạy parallel
        await Promise.all(
          updates.map((u) =>
            supabase.from(tableName).update({ order: u.order, updated_at: new Date().toISOString() }).eq('id', u.id)
          )
        );
        return supaListAll();
      }

      const all = await jsonRead();
      const byId = Object.fromEntries(all.map((it) => [it.id, it]));
      input.forEach((entry, i) => {
        if (typeof entry === 'string') {
          if (byId[entry]) byId[entry].order = i;
        } else if (entry && entry.id) {
          if (byId[entry.id]) byId[entry.id].order = entry.order ?? i;
        }
      });
      await jsonWrite(Object.values(byId));
      return Object.values(byId);
    },
  };
}

/** Factory tạo Express routes cho 1 store. (Không đổi.) */
export function createRoutes(store) {
  return {
    list: async (_req, res) => {
      try {
        res.json({ items: await store.listActive() });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },
    listAdmin: async (_req, res) => {
      try {
        res.json({ items: await store.list() });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },
    get: async (req, res) => {
      try {
        const it = await store.get(req.params.id);
        if (!it) return res.status(404).json({ error: 'Not found' });
        res.json({ item: it });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },
    save: async (req, res) => {
      try {
        const saved = await store.save(req.body || {});
        res.json({ item: saved });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },
    update: async (req, res) => {
      try {
        const saved = await store.save({ ...(req.body || {}), id: req.params.id });
        res.json({ item: saved });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },
    setStatus: async (req, res) => {
      try {
        const updated = await store.setStatus(req.params.id, req.body?.status);
        if (!updated) return res.status(404).json({ error: 'Not found' });
        res.json({ item: updated });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    },
    remove: async (req, res) => {
      try {
        const ok = await store.remove(req.params.id);
        res.json({ ok });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },
  };
}
