import { useEffect, useState } from 'react';
import { categoriesApi } from '../services/resources';

// Slug 'all' / 'deal' là 2 tab UI đặc biệt, không gán làm category cho product.
const SPECIAL_SLUGS = new Set(['all', 'deal']);

/**
 * Lấy categories từ admin endpoint (listAdmin trả tất cả, không filter status).
 * Auto-filter slug đặc biệt. Trả mảng dùng được trong form Product.
 * Backend lỗi → giữ items=[] để form không crash (select sẽ empty briefly).
 */
export function useAdminCategories() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    categoriesApi
      .listAdmin()
      .then((arr) => {
        if (cancelled) return;
        if (Array.isArray(arr)) {
          setItems(arr.filter((c) => c && c.slug && !SPECIAL_SLUGS.has(c.slug)));
        }
      })
      .catch(() => {
        // Backend lỗi — giữ items=[]. Form sẽ hiện select rỗng, user nhận biết.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading };
}
