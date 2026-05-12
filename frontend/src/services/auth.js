// ============================================================================
//  AUTH SERVICE
//  Quản lý JWT token: login, logout, gắn vào header khi gọi API admin.
//  Token lưu trong localStorage. Hết hạn → tự logout.
// ============================================================================
const TOKEN_KEY = 'lion_affiliate_token';
const USER_KEY = 'lion_affiliate_user';
const API_BASE = import.meta.env.VITE_API_URL || '';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function logout() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // KHÔNG clear cache data — vẫn cần để khách xem instant lần sau
  } catch {}
}

/** Trả về header Authorization nếu có token, dùng spread vào fetch options. */
export function authHeader() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Login failed (${res.status})`);
  }
  try {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user || {}));
  } catch {}
  return data;
}

/** Verify token còn hợp lệ. Nếu fail → tự logout. */
export async function checkAuth() {
  const t = getToken();
  if (!t) return null;
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) {
      logout();
      return null;
    }
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}
