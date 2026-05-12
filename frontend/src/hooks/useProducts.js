import { useCallback, useEffect, useState } from 'react';
import { fetchProducts } from '../services/api';
import { PRODUCTS as MOCK } from '../data/products';

/**
 * Lấy sản phẩm từ backend (đã admin lưu) — merge với mock data.
 * Quy tắc:
 *  - Nếu backend trả về sản phẩm: hiển thị sản phẩm thật TRƯỚC, mock SAU
 *    (đánh dấu mock với __isMock để filter nếu cần).
 *  - Nếu backend lỗi / chưa có sản phẩm nào: hiển thị mock để demo.
 *
 * Lưu ý: chỉ scrape KHI ADMIN IMPORT. Khách truy cập web đọc data đã lưu —
 * không trigger scrape lại.
 */
export function useProducts() {
  const [apiProducts, setApiProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProducts();
      setApiProducts(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setApiProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Sản phẩm thật (admin lưu) ưu tiên. Mock chỉ append nếu chưa có sản phẩm thật.
  // apiProducts đã được backend filter status=active. Mock không có field status nên coi như active.
  const mockWithFlag = MOCK.map((p) => ({ status: 'active', ...p, __isMock: true }));
  const merged = apiProducts.length > 0
    ? [...apiProducts, ...mockWithFlag]
    : mockWithFlag;

  // Public chỉ hiển thị active (an toàn 2 lớp, phòng có data lẫn từ nguồn khác).
  const products = merged.filter((p) => (p.status || 'active') === 'active');

  return { products, apiProducts, mockProducts: mockWithFlag, loading, error, reload };
}
