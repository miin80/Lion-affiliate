import { useCallback, useEffect, useState } from 'react';
import { fetchProducts } from '../services/api';
import { PRODUCTS as MOCK_PRODUCTS } from '../data/products';
import { SHOW_DEMO_DATA } from '../utils/demoFlag';

const CACHE_KEY = 'lion_affiliate_products_v2';

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
 * useProducts — fetch sản phẩm thật từ backend.
 *  - Production (VITE_SHOW_DEMO_DATA=false): chỉ sản phẩm thật. Backend rỗng = empty.
 *  - Dev (VITE_SHOW_DEMO_DATA=true): fallback mock data khi backend rỗng để demo UI.
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Logic:
  //   - Có sản phẩm thật → chỉ hiện sản phẩm thật
  //   - Không có sản phẩm thật + SHOW_DEMO_DATA=true → fallback mock (dev only)
  //   - Không có sản phẩm thật + SHOW_DEMO_DATA=false → rỗng (production)
  let merged;
  if (apiProducts.length > 0) {
    merged = apiProducts;
  } else if (SHOW_DEMO_DATA) {
    merged = MOCK_PRODUCTS.map((p) => ({ status: 'active', ...p, __isMock: true }));
  } else {
    merged = [];
  }

  const products = merged.filter((p) => (p.status || 'active') === 'active');

  return { products, apiProducts, loading, error, reload };
}
