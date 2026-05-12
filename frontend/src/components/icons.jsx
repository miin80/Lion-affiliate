// SVG icons gọn nhẹ (tránh thêm thư viện icon).
const i = (className = 'h-5 w-5') => ({ className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' });

export const HomeIcon = (p) => (
  <svg {...i(p.className)}><path d="M3 12 12 4l9 8"/><path d="M5 10v10h14V10"/></svg>
);
export const SearchIcon = (p) => (
  <svg {...i(p.className)}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
);
export const HeartIcon = (p) => (
  <svg {...i(p.className)}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg>
);
export const VideoIcon = (p) => (
  <svg {...i(p.className)}><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/></svg>
);
export const GridIcon = (p) => (
  <svg {...i(p.className)}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
);
export const ArrowRight = (p) => (
  <svg {...i(p.className)}><path d="M5 12h14M13 5l7 7-7 7"/></svg>
);
export const CloseIcon = (p) => (
  <svg {...i(p.className)}><path d="M6 6l12 12M18 6 6 18"/></svg>
);
export const PlayIcon = (p) => (
  <svg {...i(p.className)} fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></svg>
);
export const CheckCircle = (p) => (
  <svg {...i(p.className)}><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>
);
export const FireIcon = (p) => (
  <svg {...i(p.className)} fill="currentColor" stroke="none"><path d="M12 2s4 5 4 9a4 4 0 1 1-8 0c0-2 2-3 2-5s-1-3-1-3 3 1 3 4c0 1 1-1 0-5z"/></svg>
);

// Brand socials
export const TikTokIcon = (p) => (
  <svg viewBox="0 0 24 24" className={p.className || 'h-5 w-5'} fill="currentColor"><path d="M19.6 6.7a5.6 5.6 0 0 1-3.4-1.2 5.6 5.6 0 0 1-2-3.5h-3.4v13.5a2.6 2.6 0 1 1-2-2.6V9.4a6 6 0 1 0 5.5 6V9.7a8.7 8.7 0 0 0 5.3 1.8z"/></svg>
);
export const FacebookIcon = (p) => (
  <svg viewBox="0 0 24 24" className={p.className || 'h-5 w-5'} fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-3h2.4V9.4c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.2 2.1.2v2.3h-1.2c-1.2 0-1.6.7-1.6 1.5V12h2.7l-.4 3h-2.3v7A10 10 0 0 0 22 12z"/></svg>
);
export const InstagramIcon = (p) => (
  <svg viewBox="0 0 24 24" className={p.className || 'h-5 w-5'} fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
);
export const YouTubeIcon = (p) => (
  <svg viewBox="0 0 24 24" className={p.className || 'h-5 w-5'} fill="currentColor"><path d="M23 7s-.2-1.6-.9-2.3c-.8-.9-1.8-.9-2.2-1C16.6 3.5 12 3.5 12 3.5s-4.6 0-7.9.2c-.4.1-1.4.1-2.2 1C1.2 5.4 1 7 1 7S.8 8.8.8 10.7v1.6C.8 14.2 1 16 1 16s.2 1.6.9 2.3c.8.9 1.9.9 2.4 1 1.7.2 7.7.2 7.7.2s4.6 0 7.9-.2c.4-.1 1.4-.1 2.2-1 .7-.7.9-2.3.9-2.3s.2-1.8.2-3.7v-1.6C23.2 8.8 23 7 23 7zM9.7 14.6V8.4l6 3.1-6 3.1z"/></svg>
);
export const ShopeeIcon = (p) => (
  <svg viewBox="0 0 24 24" className={p.className || 'h-5 w-5'} fill="currentColor"><path d="M12 2a4 4 0 0 0-4 4v1H4v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7h-4V6a4 4 0 0 0-4-4zm0 2a2 2 0 0 1 2 2v1h-4V6a2 2 0 0 1 2-2z"/></svg>
);
