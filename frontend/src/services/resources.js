// Helper service cho các CMS resource (videos, categories, collections, blogs).
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

export function createResourceApi(base) {
  return {
    list: () => req(`/api/${base}`).then((d) => d?.items || []),
    listAdmin: () => req(`/api/${base}/admin`).then((d) => d?.items || []),
    get: (id) => req(`/api/${base}/${id}`).then((d) => d?.item),
    save: (item) =>
      req(`/api/${base}`, { method: 'POST', body: JSON.stringify(item) }).then((d) => d?.item),
    update: (id, item) =>
      req(`/api/${base}/${id}`, { method: 'PUT', body: JSON.stringify(item) }).then((d) => d?.item),
    setStatus: (id, status) =>
      req(`/api/${base}/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }).then((d) => d?.item),
    remove: (id) => req(`/api/${base}/${id}`, { method: 'DELETE' }),
  };
}

export const videosApi = createResourceApi('videos');
export const categoriesApi = createResourceApi('categories');
export const collectionsApi = createResourceApi('collections');
export const blogsApi = createResourceApi('blogs');

// Override categoriesApi.list để dùng endpoint auto-filter "active + có sp thuộc cat".
categoriesApi.list = () => req('/api/categories/active-with-products').then((d) => d?.items || []);

// Generic reorder method cho tất cả resources.
[videosApi, categoriesApi, collectionsApi, blogsApi].forEach((api, i) => {
  const base = ['videos', 'categories', 'collections', 'blogs'][i];
  api.reorder = (items) =>
    req(`/api/${base}/reorder`, {
      method: 'PATCH',
      body: JSON.stringify(items),
    }).then((d) => d?.items || []);
});
