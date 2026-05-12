// ============================================================================
//  API SERVICE — giao tiếp với backend.
//  Mặc định gọi `/api` (Vite dev proxy). Production: set VITE_API_URL.
// ============================================================================

const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* not JSON */
  }
  if (!res.ok) {
    const msg = data?.error || text || res.statusText;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

/** Scrape metadata từ một URL gốc (KHÔNG lưu — chỉ trả về data). */
export function scrapeProduct(url) {
  return request('/api/scrape', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

/**
 * Import sản phẩm — endpoint chuẩn theo spec.
 * POST /api/import-product { sourceUrl, affiliateUrl }
 * Trả về { ok, product, message, fallback }
 */
export function importProductApi(sourceUrl, affiliateUrl) {
  return request('/api/import-product', {
    method: 'POST',
    body: JSON.stringify({ sourceUrl, affiliateUrl }),
  });
}

/** Lấy danh sách sản phẩm đã lưu. */
export async function fetchProducts() {
  const data = await request('/api/products');
  return data.products || [];
}

/** Lưu (tạo mới hoặc update) một sản phẩm. */
export async function saveProductApi(product) {
  const data = await request('/api/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
  return data.product;
}

/** Xoá một sản phẩm. */
export function deleteProductApi(id) {
  return request(`/api/products/${id}`, { method: 'DELETE' });
}

/**
 * Fallback client khi backend không available — chỉ dùng để báo cho user
 * biết, KHÔNG dùng làm nguồn data thực.
 */
export function clientSideFallback(url) {
  try {
    const u = new URL(url);
    return {
      ok: false,
      fallback: true,
      title: '',
      description: '',
      images: [],
      video: null,
      price: null,
      platform: 'other',
      affiliateUrl: '',
      sourceUrl: url,
      message: `Không kết nối được backend. Hostname: ${u.hostname}. Vui lòng nhập thông tin sản phẩm thủ công.`,
    };
  } catch {
    return null;
  }
}
