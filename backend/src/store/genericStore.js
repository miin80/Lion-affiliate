// Factory tạo JSON file store cho 1 resource (videos, categories, collections, blogs).
// Mỗi resource là 1 mảng object có { id, status, order?, createdAt, updatedAt }.
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

export function createStore({ filename, defaults = [] }) {
  const FILE = path.join(DATA_DIR, filename);
  let memCache = null;
  let writeQueue = Promise.resolve();

  async function ensureFile() {
    try {
      await fs.access(FILE);
    } catch {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(FILE, JSON.stringify(defaults, null, 2), 'utf8');
    }
  }

  async function read() {
    if (memCache) return memCache;
    await ensureFile();
    const txt = await fs.readFile(FILE, 'utf8');
    try {
      memCache = (JSON.parse(txt) || []).map((it) => ({ status: 'active', ...it }));
    } catch {
      memCache = [];
    }
    return memCache;
  }

  async function write(arr) {
    memCache = arr;
    writeQueue = writeQueue.then(() =>
      fs.writeFile(FILE, JSON.stringify(arr, null, 2), 'utf8')
    );
    return writeQueue;
  }

  function genId() {
    return `${filename.replace('.json', '')}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  }

  return {
    async list() {
      return read();
    },
    async listActive() {
      const all = await read();
      return all
        .filter((it) => (it.status || 'active') === 'active')
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    },
    async get(id) {
      const all = await read();
      return all.find((it) => it.id === id) || null;
    },
    async save(item) {
      const all = await read();
      const now = new Date().toISOString();
      const id = item.id || genId();
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
      await write(all);
      return next;
    },
    async setStatus(id, status) {
      if (!['active', 'hidden', 'trash'].includes(status)) {
        throw new Error('Status không hợp lệ. Chỉ active | hidden | trash.');
      }
      const all = await read();
      const idx = all.findIndex((it) => it.id === id);
      if (idx < 0) return null;
      const now = new Date().toISOString();
      all[idx] = {
        ...all[idx],
        status,
        updatedAt: now,
        trashedAt: status === 'trash' ? now : null,
      };
      await write(all);
      return all[idx];
    },
    async remove(id) {
      const all = await read();
      const next = all.filter((it) => it.id !== id);
      await write(next);
      return all.length !== next.length;
    },
    /** Reorder bằng mảng id theo thứ tự mới. */
    async reorder(ids) {
      const all = await read();
      const byId = Object.fromEntries(all.map((it) => [it.id, it]));
      ids.forEach((id, i) => {
        if (byId[id]) byId[id].order = i;
      });
      await write(Object.values(byId));
      return Object.values(byId);
    },
  };
}

/** Factory tạo Express routes cho 1 store. */
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
