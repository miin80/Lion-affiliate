// API client cho tính năng Google Sheet bulk import.
import { authHeader, logout } from './auth';
const API_BASE = import.meta.env.VITE_API_URL || '';

async function req(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...(opts.headers || {}) },
    ...opts,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    if (res.status === 401) logout();
    throw new Error(data?.error || res.statusText);
  }
  return data;
}

export const sheetApi = {
  /** Lấy CSV URL + meta (lastImportAt, lastImportCount) đã lưu. */
  getSettings: () => req('/api/google-sheet/settings').then((d) => d.settings),

  /** Lưu CSV URL. Backend tự normalize (edit URL → export URL). */
  saveSettings: (csvUrl) =>
    req('/api/google-sheet/settings', {
      method: 'PUT',
      body: JSON.stringify({ csvUrl }),
    }).then((d) => d.settings),

  /** Fetch + parse + map. Trả về { rows, columnMap, summary } */
  preview: (csvUrl) =>
    req('/api/google-sheet/preview', {
      method: 'POST',
      body: JSON.stringify({ csvUrl }),
    }),

  /**
   * Import vào products.json.
   *  - selectedIds: array of rowIndex để import. Bỏ trống = import tất cả row hợp lệ + active.
   */
  import: ({ csvUrl, selectedIds } = {}) =>
    req('/api/google-sheet/import', {
      method: 'POST',
      body: JSON.stringify({ csvUrl, selectedIds }),
    }),
};
