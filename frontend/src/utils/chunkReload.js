// ============================================================================
// Chunk-error reload helper
//
// Sau mỗi deploy Vercel, hash của các chunk lazy (Admin-XXXX.js, Home-XXXX.js)
// thay đổi. Tab trình duyệt đang mở từ TRƯỚC khi deploy vẫn reference chunk cũ
// → click route → fetch chunk cũ → 404 → "Failed to fetch dynamically imported
// module".
//
// Cách fix: detect lỗi → reload trang 1 lần để load HTML + chunk mới.
// sessionStorage flag chống vòng lặp reload nếu chunk thực sự down (server lỗi).
// ============================================================================

const RELOAD_KEY = 'lion_chunk_reload_at';
const RELOAD_WINDOW_MS = 10_000;

/** Detect xem error có phải do chunk-load fail không. */
export function isChunkLoadError(error) {
  const msg = String(error?.message || error?.reason?.message || error || '');
  return /Failed to fetch dynamically imported module|Loading chunk \w+ failed|Loading CSS chunk|Importing a module script failed/i.test(
    msg
  );
}

/**
 * Reload trang 1 lần nếu trong vòng 10s chưa reload (chống loop).
 * Return true nếu đã trigger reload, false nếu skip (đã reload gần đây).
 */
export function reloadOnceForChunkError() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last > RELOAD_WINDOW_MS) {
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
      window.location.reload();
      return true;
    }
  } catch {
    // sessionStorage có thể bị block (private mode strict). Vẫn cố reload 1 lần.
    window.location.reload();
    return true;
  }
  return false;
}
