// Lưu trữ sản phẩm dạng JSON file (demo). Dễ migrate sang Supabase/Firebase sau.
// File data: backend/data/products.json
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const FILE = path.join(DATA_DIR, 'products.json');

let memCache = null;
let writeQueue = Promise.resolve();

async function ensureFile() {
  try {
    await fs.access(FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, '[]', 'utf8');
  }
}

async function read() {
  if (memCache) return memCache;
  await ensureFile();
  const txt = await fs.readFile(FILE, 'utf8');
  try {
    memCache = JSON.parse(txt) || [];
  } catch {
    memCache = [];
  }
  return memCache;
}

async function write(arr) {
  memCache = arr;
  // Serialise writes
  writeQueue = writeQueue.then(() =>
    fs.writeFile(FILE, JSON.stringify(arr, null, 2), 'utf8')
  );
  return writeQueue;
}

export async function listProducts() {
  return read();
}

export async function getProduct(id) {
  const all = await read();
  return all.find((p) => p.id === id) || null;
}

export async function saveProduct(product) {
  const all = await read();
  const now = new Date().toISOString();
  const id = product.id || `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const slug =
    product.slug ||
    (product.title || 'san-pham')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 80) || 'san-pham';

  const idx = all.findIndex((p) => p.id === id);
  const next = {
    ...(idx >= 0 ? all[idx] : {}),
    ...product,
    id,
    slug: idx >= 0 ? all[idx].slug : slug,
    updatedAt: now,
    createdAt: idx >= 0 ? all[idx].createdAt : now,
  };
  if (idx >= 0) all[idx] = next;
  else all.unshift(next);
  await write(all);
  return next;
}

export async function deleteProduct(id) {
  const all = await read();
  const next = all.filter((p) => p.id !== id);
  await write(next);
  return all.length !== next.length;
}
