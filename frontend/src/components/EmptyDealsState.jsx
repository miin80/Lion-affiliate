import { motion } from 'framer-motion';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { FacebookIcon, TikTokIcon, VideoIcon, ArrowRight } from './icons';

/**
 * EmptyDealsState — empty state cho homepage khi chưa có sản phẩm.
 *
 * Thiết kế:
 *  - 3 ghost skeleton card mờ phía sau (page có "sức sống", không trống trải).
 *  - Centerpiece overlay: animated icon + headline + CTAs.
 *  - Gradient bg mềm orange→pink theo brand.
 *  - Fade-in động + icon pulse nhẹ.
 *  - Mobile responsive: stack vertical, không overflow.
 *
 * Không phá design system: dùng class brand-orange / brand-pink / shadow-cta.
 */
export default function EmptyDealsState() {
  const { settings } = useSiteSettings();
  const socials = settings.socials || {};
  const follow = settings.buttons?.follow || {};
  const videoBtn = settings.buttons?.videoReview || {};

  // Resolve URL theo thứ tự: button setting → social fallback. Ẩn nút nếu không có URL nào.
  const followUrl = follow.url || socials.facebook || socials.tiktok || '';
  const followText = follow.text || 'Follow nhận deal mới';
  const isTikTok = !follow.url && !socials.facebook && socials.tiktok;
  const FollowIcon = isTikTok ? TikTokIcon : FacebookIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative"
    >
      {/* Ghost skeleton cards phía sau — page có cảm giác đang "load" deal mới */}
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

      {/* Centerpiece overlay */}
      <div className="absolute inset-0 flex items-center justify-center px-3 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="w-full max-w-md rounded-3xl bg-gradient-to-br from-brand-orange-50 via-white to-brand-pink-50 p-6 text-center shadow-card ring-1 ring-brand-orange-100 backdrop-blur sm:p-8"
        >
          {/* Animated icon — pulse loop nhẹ */}
          <motion.div
            animate={{ scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-brand text-3xl shadow-cta sm:h-20 sm:w-20 sm:text-4xl"
          >
            🔥
          </motion.div>

          <h3 className="mt-4 text-xl font-extrabold leading-tight sm:text-2xl">
            Deal mới đang được{' '}
            <span className="bg-gradient-brand bg-clip-text text-transparent">
              cập nhật mỗi ngày
            </span>
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm text-brand-ink-600 sm:text-base">
            Sản phẩm đầu tiên sẽ lên sóng sớm 👀 Follow để là người đầu tiên nhận deal hot
            mỗi ngày.
          </p>

          {/* CTAs */}
          <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
            {followUrl && (
              <a
                href={followUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-extrabold text-white shadow-cta transition hover:-translate-y-0.5 hover:shadow-cta-pink"
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
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-ink-800 ring-1 ring-brand-ink-200 transition hover:text-brand-orange-600 hover:ring-brand-orange-300"
            >
              <VideoIcon className="h-4 w-4" />
              {videoBtn.text || 'Xem video review'}
            </a>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="mt-3 inline-flex items-center gap-1 text-xs text-brand-ink-400 transition hover:text-brand-orange-600"
          >
            <span>↻</span>
            <span>Hoặc quay lại sau</span>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
