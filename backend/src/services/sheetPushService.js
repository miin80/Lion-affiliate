// Đẩy product đã save về Google Sheet (Web → Sheet reverse sync).
//
// Cơ chế: backend POST tới Apps Script Web App URL → Apps Script append/update
// row trong Sheet match theo product.id. Tránh trùng vì upsert theo id.
//
// Để bật: admin paste pushWebAppUrl trong /admin/google-sheet sau khi đã
// deploy Apps Script là Web App.
//
// Fire-and-forget: không block save flow; lỗi chỉ log không throw.
import { readSheetSettings } from '../store/sheetSettings.js';

export async function pushProductToSheet(product) {
  if (!product || !product.id) return { ok: false, reason: 'no-id' };
  // Tránh vòng lặp: sản phẩm import từ Sheet đã có row, không đẩy ngược.
  if (product.source === 'sheet') return { ok: false, reason: 'from-sheet' };

  let settings;
  try {
    settings = await readSheetSettings();
  } catch (err) {
    return { ok: false, reason: 'read-settings-fail', error: err.message };
  }
  const url = (settings?.pushWebAppUrl || '').trim();
  if (!url) return { ok: false, reason: 'not-configured' };
  if (!/^https:\/\/script\.google\.com\/macros\//.test(url)) {
    console.warn('[push-sheet] URL không phải Apps Script Web App:', url);
    return { ok: false, reason: 'invalid-url' };
  }

  // Timeout 8s — không block save flow lâu.
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product }),
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(t);
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}
    if (!res.ok || data?.ok === false) {
      console.warn(`[push-sheet] HTTP ${res.status} body=${text.slice(0, 200)}`);
      return { ok: false, reason: 'apps-script-fail', status: res.status };
    }
    console.log(`[push-sheet] ✅ ${data?.action || 'pushed'} product ${product.id} → Sheet`);
    return { ok: true, action: data?.action };
  } catch (err) {
    clearTimeout(t);
    console.warn('[push-sheet] error:', err.message);
    return { ok: false, reason: 'fetch-error', error: err.message };
  }
}
