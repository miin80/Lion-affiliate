// ============================================================================
//  API SERVICE — giao tiếp với backend.
//  Mặc định gọi `/api` (Vite dev proxy). Production: set VITE_API_URL.
// ============================================================================

import { authHeader, logout } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...(opts.headers || {}),
    },
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
    // Token hết hạn / không hợp lệ → auto logout, frontend sẽ redirect tới /admin/login
    if (res.status === 401) logout();
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

/** Lấy danh sách sản phẩm public (chỉ status=active). */
export async function fetchProducts() {
  const data = await request('/api/products');
  return data.products || [];
}

/** Lấy TẤT CẢ sản phẩm cho trang admin (active + hidden). */
export async function fetchAdminProducts() {
  const data = await request('/api/products/admin');
  return data.products || [];
}

/** Đổi trạng thái sản phẩm: 'active' (hiện) | 'hidden' (ẩn). */
export async function updateProductStatusApi(id, status) {
  const data = await request(`/api/products/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return data.product;
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

/** Lấy site settings (profile, social, buttons, hero). */
export async function fetchSiteSettings() {
  const data = await request('/api/site-settings');
  return data.settings;
}

/** Lưu (partial) site settings — backend deep merge. */
export async function saveSiteSettingsApi(patch) {
  const data = await request('/api/site-settings', {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
  return data.settings;
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
