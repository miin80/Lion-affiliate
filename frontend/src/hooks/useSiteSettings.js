import { useCallback, useEffect, useState } from 'react';
import { fetchSiteSettings } from '../services/api';
import { SITE } from '../config/site';

/**
 * Default fallback dùng khi backend không khả dụng VÀ cũng chưa có cache.
 */
export const DEFAULT_SITE_SETTINGS = {
  profile: {
    name: SITE.name,
    tagline: SITE.tagline,
    shortBio: SITE.shortBio,
    avatar: SITE.avatar,
    stats: SITE.stats,
  },
  socials: SITE.socials,
  buttons: {
    follow: { text: '➕ Theo dõi mình', url: SITE.followUrl },
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
  disclosure: SITE.disclaimer || SITE.disclosure,
  email: SITE.email,
  sections: {
    hero: true,
    products: true,
    videoReels: true,
    topBestseller: true,
    collections: true,
    blog: true,
  },
};

const CACHE_KEY = 'lion_affiliate_site_settings_v2';

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache(value) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

/**
 * useSiteSettings — stale-while-revalidate.
 *  - Init: dùng cache localStorage NẾU có → hiển thị instant data thật của user.
 *          Nếu chưa có cache → dùng DEFAULT (chỉ xảy ra lần đầu visit).
 *  - Mount: fetch fresh từ /api/site-settings, update state + cache.
 *  - Render Free ngủ: cache hiển thị data đúng ngay; fresh fetch silently update.
 */
export function useSiteSettings() {
  const [settings, setSettings] = useState(() => {
    const cached = readCache();
    return cached ? { ...DEFAULT_SITE_SETTINGS, ...cached } : DEFAULT_SITE_SETTINGS;
  });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      const s = await fetchSiteSettings();
      if (s) {
        const merged = { ...DEFAULT_SITE_SETTINGS, ...s };
        setSettings(merged);
        writeCache(s);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { settings, loaded, error, reload };
}
