// Lưu cài đặt website (profile, social, buttons, hero) vào siteSettings.json.
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const FILE = path.join(DATA_DIR, 'siteSettings.json');

let memCache = null;
let writeQueue = Promise.resolve();

// Default mặc định nếu file chưa tồn tại — match data hiện tại của site.
export const DEFAULT_SETTINGS = {
  profile: {
    name: 'Mira Reviews',
    tagline: 'Review chuyên sâu — Deal tốt nhất',
    shortBio:
      'Reviewer đời sống · Mỗi tuần 1 sản phẩm đáng mua. Tap ⬇️ để xem deal tốt nhất.',
    avatar: 'https://i.pravatar.cc/300?img=47',
    stats: {
      followers: '128K',
      reviewed: '320+',
      happy: '98%',
    },
  },
  socials: {
    tiktok: 'https://tiktok.com/@mira_reviews',
    facebook: 'https://facebook.com/mira.reviews',
    instagram: 'https://instagram.com/mira.reviews',
    youtube: '',
    shopee: 'https://shopee.vn/mira_reviews',
  },
  buttons: {
    follow: {
      text: '➕ Theo dõi mình',
      url: 'https://tiktok.com/@mira_reviews',
    },
    dealHot: {
      text: '🔥 Xem deal HOT hôm nay',
      url: '', // rỗng = dùng hành vi mặc định (scroll xuống product grid filter Deal)
    },
    videoReview: {
      text: '🎬 Xem video review',
      url: '#video-reviews',
    },
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
  email: 'contact@mira-reviews.example.com',
  // Bật/tắt section hiển thị trên trang chủ
  sections: {
    hero: true,
    products: true,
    videoReels: true,
    topBestseller: true,
    collections: true,
    blog: true,
  },
};

async function ensureFile() {
  try {
    await fs.access(FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf8');
  }
}

export async function readSettings() {
  if (memCache) return memCache;
  await ensureFile();
  const txt = await fs.readFile(FILE, 'utf8');
  try {
    memCache = { ...DEFAULT_SETTINGS, ...JSON.parse(txt) };
  } catch {
    memCache = { ...DEFAULT_SETTINGS };
  }
  return memCache;
}

/** Deep merge — chấp nhận patch lồng nhau (profile.stats.followers...). */
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

export async function writeSettings(patch) {
  const current = await readSettings();
  const next = deepMerge(current, patch);
  memCache = next;
  writeQueue = writeQueue.then(() =>
    fs.writeFile(FILE, JSON.stringify(next, null, 2), 'utf8')
  );
  await writeQueue;
  return next;
}
