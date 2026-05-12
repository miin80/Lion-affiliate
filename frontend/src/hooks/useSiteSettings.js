import { useCallback, useEffect, useState } from 'react';
import { fetchSiteSettings } from '../services/api';
import { SITE } from '../config/site';

/**
 * Default fallback dùng khi backend không khả dụng.
 * Khớp shape với backend/src/store/settings.js
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

export function useSiteSettings() {
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      const s = await fetchSiteSettings();
      if (s) setSettings({ ...DEFAULT_SITE_SETTINGS, ...s });
      setError(null);
    } catch (err) {
      // Backend chưa chạy — dùng default, không làm sập UI.
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
