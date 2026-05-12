// ============================================================================
//  AFFILIATE CONFIG
//  Trung tâm quản lý affiliate. Đổi mã affiliate / sub-id tại đây.
//  Cách dùng: getAffiliateUrl(originalUrl) -> trả về URL đã chèn tracking.
// ============================================================================

/**
 * Định nghĩa các nền tảng được hỗ trợ.
 * - `match`: regex để nhận diện URL.
 * - `name`: tên hiển thị.
 * - `color`: màu badge (Tailwind class).
 * - `affiliateId`: mã affiliate (đổi tại đây).
 * - `paramKey`: query param dùng để gắn tracking (nếu có).
 * - `wrap(url)`: hàm tuỳ chỉnh để bọc URL gốc bằng deeplink (nếu nền tảng yêu cầu).
 */
export const PLATFORMS = {
  shopee: {
    key: 'shopee',
    name: 'Shopee',
    color: 'bg-orange-500 text-white',
    match: /shopee\.(vn|com|co|sg|com\.my|co\.th|co\.id|ph)/i,
    affiliateId: 'YOUR_SHOPEE_AFF_ID',
    paramKey: 'af_sub_siteid',
    wrap: (url, cfg) => appendQuery(url, { [cfg.paramKey]: cfg.affiliateId }),
  },
  tiktok: {
    key: 'tiktok',
    name: 'TikTok Shop',
    color: 'bg-black text-white',
    match: /(tiktok\.com|shop\.tiktok\.com|vt\.tiktok\.com)/i,
    affiliateId: 'YOUR_TIKTOK_AFF_ID',
    paramKey: 'aff_id',
    wrap: (url, cfg) => appendQuery(url, { [cfg.paramKey]: cfg.affiliateId }),
  },
  lazada: {
    key: 'lazada',
    name: 'Lazada',
    color: 'bg-blue-600 text-white',
    match: /lazada\.(vn|com|com\.my|co\.th|co\.id|com\.ph|sg)/i,
    affiliateId: 'YOUR_LAZADA_AFF_ID',
    paramKey: 'sub_aff_id',
    wrap: (url, cfg) => appendQuery(url, { [cfg.paramKey]: cfg.affiliateId }),
  },
  tiki: {
    key: 'tiki',
    name: 'Tiki',
    color: 'bg-sky-600 text-white',
    match: /tiki\.vn/i,
    affiliateId: 'YOUR_TIKI_AFF_ID',
    paramKey: 'aff',
    wrap: (url, cfg) => appendQuery(url, { [cfg.paramKey]: cfg.affiliateId }),
  },
  other: {
    key: 'other',
    name: 'Cửa hàng',
    color: 'bg-slate-700 text-white',
    match: /.*/,
    affiliateId: '',
    paramKey: '',
    wrap: (url) => url,
  },
};

function appendQuery(url, params) {
  try {
    const u = new URL(url);
    Object.entries(params).forEach(([k, v]) => {
      if (k && v) u.searchParams.set(k, v);
    });
    return u.toString();
  } catch {
    return url;
  }
}

/** Phát hiện platform từ URL gốc. */
export function detectPlatform(url) {
  if (!url) return PLATFORMS.other;
  for (const key of Object.keys(PLATFORMS)) {
    if (key === 'other') continue;
    if (PLATFORMS[key].match.test(url)) return PLATFORMS[key];
  }
  return PLATFORMS.other;
}

/** Trả về URL có gắn tracking affiliate. */
export function getAffiliateUrl(url) {
  if (!url) return '#';
  const platform = detectPlatform(url);
  try {
    return platform.wrap(url, platform);
  } catch {
    return url;
  }
}
