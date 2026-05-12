import { useCallback, useEffect, useState } from 'react';

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}
function writeCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/**
 * useResource — stale-while-revalidate cho 1 resource (videos, categories, collections, blogs).
 *  - Init: cache localStorage → instant. Nếu cache rỗng dùng fallbackData.
 *  - Mount: fetch fresh, update state + cache.
 *  - Backend down: giữ data cũ trong state, không trắng.
 *
 * @param {object} api  — service object với .list()
 * @param {array} fallbackData — mock data dùng KHI cache rỗng VÀ backend down
 * @param {string} cacheKey — key trong localStorage (unique per resource)
 */
export function useResource(api, fallbackData = [], cacheKey) {
  const [items, setItems] = useState(() => {
    if (!cacheKey) return fallbackData;
    const cached = readCache(cacheKey);
    return cached && cached.length ? cached : fallbackData;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      const data = await api.list();
      if (data && data.length) {
        setItems(data);
        if (cacheKey) writeCache(cacheKey, data);
      } else {
        // Backend trả rỗng → giữ cache cũ nếu có, hoặc dùng fallback
        const cached = cacheKey ? readCache(cacheKey) : null;
        if (cached && cached.length) setItems(cached);
        else setItems(fallbackData);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
      // Backend lỗi → không reset, giữ data hiện tại
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, error, reload };
}
