/**
 * VITE_SHOW_DEMO_DATA — bật/tắt demo data trên website public.
 *  - 'true'  : hiện demo data (12 sản phẩm mẫu, 6 video, 5 bộ sưu tập...) khi backend trống
 *               → dùng cho local dev / test giao diện
 *  - 'false' : KHÔNG hiện demo. Section trống = empty state hoặc ẩn luôn.
 *               → dùng cho production (mặc định)
 *
 * Đặt trong .env hoặc Vercel Environment Variables.
 */
export const SHOW_DEMO_DATA =
  String(import.meta.env.VITE_SHOW_DEMO_DATA || '').toLowerCase() === 'true';
