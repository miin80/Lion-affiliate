import { useCallback, useEffect, useState } from 'react';

/**
 * Generic hook fetch 1 resource từ backend.
 *  - api.list(): trả về [items active]
 *  - fallbackData: dùng khi backend down hoặc trả [] (giữ UX, không trắng trang)
 */
export function useResource(api, fallbackData = []) {
  const [items, setItems] = useState(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      const data = await api.list();
      setItems(data && data.length ? data : fallbackData);
      setError(null);
    } catch (err) {
      setError(err.message);
      setItems(fallbackData);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, error, reload };
}
