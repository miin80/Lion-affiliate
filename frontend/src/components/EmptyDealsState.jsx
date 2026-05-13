import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { FacebookIcon, TikTokIcon, VideoIcon, ArrowRight, CloseIcon } from './icons';

const DISMISS_KEY = 'lion_empty_dismissed';
const REVEAL_DELAY_MS = 4500;

/**
 * EmptyDealsState — empty state cho homepage khi chưa có sản phẩm.
 *
 * UX flow:
 *  1. User vào trang: thấy 3 ghost skeleton card → cảm giác "đang tải deal".
 *  2. Sau 4.5s: centerpiece fade-in từ giữa (không hiện ngay, đỡ aggressive).
 *  3. User có thể tắt bằng nút X → ẩn cho tới hết session (sessionStorage).
 *
 * Sau khi dismiss, vẫn còn ghost cards → page nhìn vẫn "alive" như đang load.
 *
 * Đọc settings.buttons.{follow, videoReview} + settings.socials.
 */
export default function EmptyDealsState() {
  const { settings } = useSiteSettings();
  const socials = settings.socials || {};
  const follow = settings.buttons?.follow || {};
  const videoBtn = settings.buttons?.videoReview || {};

  // URL resolve theo thứ tự: setting → social fallback.
  const followUrl = follow.url || socials.facebook || socials.tiktok || '';
  const followText = follow.text || 'Follow nhận deal mới';
  const isTikTok = !follow.url && !socials.facebook && socials.tiktok;
  const FollowIcon = isTikTok ? TikTokIcon : FacebookIcon;

  // Dismiss state — kiểm tra sessionStorage để KHÔNG hiện lại sau khi user X.
  const [open, setOpen] = useState(() => {
    try {
      return !sessionStorage.getItem(DISMISS_KEY);
    } catch {
      return true;
    }
  });
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Delay show centerpiece để page có cảm giác "đang load deal" trước khi
    // hiện message "đang cập nhật". Đỡ aggressive.
    const t = setTimeout(() => setRevealed(true), REVEAL_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // private mode strict — vẫn cho đóng trong session hiện tại
    }
    setOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative"
    >
      {/* Ghost skeleton cards — luôn hiển thị, làm page có sức sống */}
      <div
        aria-hidden
        className="pointer-events-none grid grid-cols-2 gap-3 opacity-50 blur-[1.5px] sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={`overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-brand-ink-100 ${
              i === 2 ? 'hidden sm:block' : ''
            } ${i === 1 ? 'sm:hidden lg:block' : ''}`}
          >
            <div className="aspect-square skeleton" />
            <div className="space-y-2 p-3">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
              <div className="skeleton h-5 w-2/3 rounded" />
              <div className="skeleton h-7 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Centerpiece — chỉ hiện sau delay + chưa dismiss */}
      <AnimatePresence>
        {open && revealed && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-3 sm:px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 4 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="pointer-events-auto relative w-full max-w-sm rounded-3xl bg-gradient-to-br from-brand-orange-50 via-white to-brand-pink-50 p-5 text-center shadow-card ring-1 ring-brand-orange-100 backdrop-blur sm:p-6"
            >
              {/* Close button — rõ ràng, top-right */}
              <button
                type="button"
                onClick={handleClose}
                aria-label="Đóng"
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-brand-ink-600 ring-1 ring-brand-ink-200 transition hover:bg-white hover:text-brand-orange-600 hover:ring-brand-orange-200"
              >
                <CloseIcon className="h-4 w-4" />
              </button>

              {/* Animated icon — pulse loop nhẹ */}
              <motion.div
                animate={{ scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-2xl shadow-cta sm:h-16 sm:w-16 sm:text-3xl"
              >
                🔥
              </motion.div>

              <h3 className="mt-3 text-lg font-extrabold leading-tight sm:text-xl">
                Deal mới đang được{' '}
                <span className="bg-gradient-brand bg-clip-text text-transparent">
                  cập nhật mỗi ngày
                </span>
              </h3>

              <p className="mx-auto mt-1.5 max-w-xs text-sm text-brand-ink-600">
                Sản phẩm đầu tiên sẽ lên sóng sớm 👀 Follow để nhận deal hot đầu tiên.
              </p>

              <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
                {followUrl && (
                  <a
                    href={followUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-brand px-4 py-2 text-sm font-extrabold text-white shadow-cta transition hover:-translate-y-0.5 hover:shadow-cta-pink"
                  >
                    <FollowIcon className="h-4 w-4" />
                    {followText}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                )}
                <a
                  href={videoBtn.url || '#video-reviews'}
                  target={videoBtn.url?.startsWith('http') ? '_blank' : undefined}
                  rel={videoBtn.url?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-ink-800 ring-1 ring-brand-ink-200 transition hover:text-brand-orange-600 hover:ring-brand-orange-300"
                >
                  <VideoIcon className="h-4 w-4" />
                  {videoBtn.text || 'Xem video review'}
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
