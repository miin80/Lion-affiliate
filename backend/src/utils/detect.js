export function detectPlatform(url) {
  if (!url) return 'other';
  if (/shopee\.(vn|com|co|sg|com\.my|co\.th|co\.id|ph)/i.test(url)) return 'shopee';
  if (/(tiktok\.com|shop\.tiktok\.com|vt\.tiktok\.com)/i.test(url)) return 'tiktok';
  if (/lazada\.(vn|com|com\.my|co\.th|co\.id|com\.ph|sg)/i.test(url)) return 'lazada';
  if (/tiki\.vn/i.test(url)) return 'tiki';
  return 'other';
}

/** Parse một giá tiền VND ra số. "1.490.000₫" → 1490000 */
export function parseVND(str) {
  if (typeof str === 'number') return str;
  if (!str) return null;
  const digits = String(str).replace(/[^0-9]/g, '');
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}
