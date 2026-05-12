import { useCallback, useEffect, useState } from 'react';
import { fetchProducts } from '../services/api';
import { PRODUCTS as MOCK } from '../data/products';

const CACHE_KEY = 'lion_affiliate_products_v1';

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}
function writeCache(arr) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(arr));
  } catch {}
}

/**
 * useProducts — stale-while-revalidate cho danh sách sản phẩm.
 *  - Init: dùng cache nếu có (instant hiển thị data thật).
 *  - Mount: fetch fresh, update state + cache.
 *  - Fallback mock products nếu backend chưa có sản phẩm nào.
 */
export function useProducts() {
  const [apiProducts, setApiProducts] = useState(() => readCache() || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProducts();
      setApiProducts(data);
      writeCache(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      // Giữ data cũ trong state — không reset về [] để tránh flash
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const mockWithFlag = MOCK.map((p) => ({ status: 'active', ...p, __isMock: true }));
  const merged = apiProducts.length > 0
    ? [...apiProducts, ...mockWithFlag]
    : mockWithFlag;

  const products = merged.filter((p) => (p.status || 'active') === 'active');

  return { products, apiProducts, mockProducts: mockWithFlag, loading, error, reload };
}
