// Site settings — dual impl: Supabase singleton row hoặc JSON file.
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, USE_SUPABASE } from './supabase.js';
import { DEFAULT_AVATAR_DATA_URL } from './defaultAvatar.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const FILE = path.join(DATA_DIR, 'siteSettings.json');
const TABLE = 'site_settings';
const SINGLETON_ID = 'singleton';

let memCache = null;
let writeQueue = Promise.resolve();

export const DEFAULT_SETTINGS = {
  profile: {
    name: 'Minh Quang Reviews',
    tagline: 'Đồ tốt mình dùng mỗi ngày',
    shortBio:
      'Reviewer đời sống · Mỗi tuần 1 sản phẩm đáng mua. Tap ⬇️ để xem deal tốt nhất.',
    avatar: DEFAULT_AVATAR_DATA_URL,
    stats: {
      followers: '',
      reviewed: '',
      happy: '',
    },
  },
  socials: {
    tiktok: '',
    facebook: 'https://www.facebook.com/Lion9826/',
    instagram: '',
    youtube: '',
    shopee: '',
  },
  buttons: {
    follow: { text: '➕ Theo dõi mình', url: 'https://www.facebook.com/Lion9826/' },
    dealHot: { text: '🔥 Xem deal HOT hôm nay', url: '' },
    videoReview: { text: '🎬 Xem video review', url: '#video-reviews' },
  },
  hero: {
    badge: '🔥 Top recommend 2026',
    title: 'Top sản phẩm mình recommend',
    subtitle:
      'Tổng hợp deal tốt, đồ đáng mua, sản phẩm hot trên TikTok — mình test rồi mới đăng.',
    searchPlaceholder: 'Tìm sản phẩm (vd: nồi chiên, kem chống nắng...)',
  },
  disclosure:
    'Một số liên kết trên website là liên kết tiếp thị. Khi bạn mua hàng qua các liên kết này, mình có thể nhận được một khoản hoa hồng nhỏ — bạn KHÔNG phải trả thêm bất kỳ chi phí nào.',
  email: '',
  sections: {
    hero: true,
    products: true,
    videoReels: true,
    topBestseller: true,
    collections: true,
    blog: true,
  },
};

// ============ JSON file impl ============
async function jsonEnsureFile() {
  try {
    await fs.access(FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf8');
  }
}
async function jsonRead() {
  if (memCache) return memCache;
  await jsonEnsureFile();
  const txt = await fs.readFile(FILE, 'utf8');
  try {
    const stored = JSON.parse(txt);
    const isLegacy =
      stored?.profile?.name === 'Mira Reviews' ||
      (stored?.email || '').includes('mira-reviews') ||
      (stored?.profile?.tagline || '').includes('Review chuyên sâu');
    if (isLegacy) {
      console.log('[settings] Legacy Mira data detected — resetting to defaults');
      memCache = { ...DEFAULT_SETTINGS };
      await fs.writeFile(FILE, JSON.stringify(memCache, null, 2), 'utf8');
    } else {
      memCache = { ...DEFAULT_SETTINGS, ...stored };
    }
  } catch {
    memCache = { ...DEFAULT_SETTINGS };
  }
  return memCache;
}

// ============ Supabase impl ============
async function supaRead() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('data')
    .eq('id', SINGLETON_ID)
    .maybeSingle();
  if (error) throw new Error(`[supabase ${TABLE}] ${error.message}`);
  if (!data) {
    // Chưa có row → tạo từ DEFAULT
    await supaWrite(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return { ...DEFAULT_SETTINGS, ...(data.data || {}) };
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

function deepMerge(base, patch) {
  if (!patch || typeof patch !== 'object') return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = deepMerge(base?.[k] || {}, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// ============ Public API ============
export async function readSettings() {
  if (USE_SUPABASE) return supaRead();
  return jsonRead();
}

export async function writeSettings(patch) {
  const current = await readSettings();
  const next = deepMerge(current, patch);

  if (USE_SUPABASE) {
    await supaWrite(next);
    return next;
  }

  memCache = next;
  writeQueue = writeQueue.then(() =>
    fs.writeFile(FILE, JSON.stringify(next, null, 2), 'utf8')
  );
  await writeQueue;
  return next;
}
