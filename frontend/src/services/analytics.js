// Analytics client.
// POST /api/analytics/click — public, không cần auth
// GET /api/analytics/summary — admin only
import { authHeader, logout } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Track click. Fire-and-forget — không block UX.
 * Dùng sendBeacon để đảm bảo request được gửi ngay cả khi user redirect.
 */
export function trackClick({ type, id, action = 'buy' }) {
  if (!type || !id) return;
  const url = `${API_BASE}/api/analytics/click`;
  const body = JSON.stringify({ type, id, action });
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } else {
      // fallback
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* silent */
  }
}

/** Admin: get summary stats. */
export async function fetchAnalyticsSummary() {
  const res = await fetch(`${API_BASE}/api/analytics/summary`, {
    headers: authHeader(),
  });
  if (!res.ok) {
    if (res.status === 401) logout();
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}
