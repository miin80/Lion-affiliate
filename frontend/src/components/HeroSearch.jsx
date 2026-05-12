import { motion } from 'framer-motion';
import { SearchIcon, FireIcon, ArrowRight } from './icons';
import { useSiteSettings } from '../hooks/useSiteSettings';

/**
 * HeroSearch — tiêu đề lớn + ô search + CTA.
 * Tất cả text/link đều đọc từ site settings (admin có thể đổi).
 */
export default function HeroSearch({ value, onChange, onDealClick }) {
  const { settings } = useSiteSettings();
  const hero = settings.hero || {};
  const dealBtn = settings.buttons?.dealHot || {};
  const videoBtn = settings.buttons?.videoReview || {};

  // Title có thể chứa highlight gradient. Split theo "mình recommend" để giữ effect.
  const renderTitle = () => {
    const t = hero.title || 'Top sản phẩm mình recommend';
    const tokens = t.split(/(mình recommend|recommend)/i);
    return tokens.map((tok, i) =>
      /mình recommend|recommend/i.test(tok) ? (
        <span key={i} className="bg-gradient-brand bg-clip-text text-transparent">
          {tok}
        </span>
      ) : (
        <span key={i}>{tok}</span>
      )
    );
  };

  return (
    <section className="container-page mt-6 sm:mt-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-soft p-5 ring-1 ring-brand-ink-100 sm:p-8"
      >
        <div className="pointer-events-none absolute -left-16 -top-12 h-40 w-40 rounded-full bg-brand-orange-200/60 blur-3xl" />
        <div className="pointer-events-none absolute -right-12 -bottom-10 h-44 w-44 rounded-full bg-brand-pink-200/60 blur-3xl" />

        <div className="relative">
          {hero.badge && (
            <span className="mx-auto block w-fit rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-orange-600 shadow-soft ring-1 ring-brand-orange-100">
              {hero.badge}
            </span>
          )}
          <h2 className="mt-3 text-center text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            {renderTitle()}
          </h2>
          {hero.subtitle && (
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-brand-ink-500 sm:text-base">
              {hero.subtitle}
            </p>
          )}

          {/* Search */}
          <label className="mx-auto mt-5 flex max-w-xl items-center gap-3 rounded-full bg-white px-5 py-3 shadow-soft ring-1 ring-brand-ink-100 focus-within:ring-brand-orange-300">
            <SearchIcon className="h-5 w-5 text-brand-ink-400" />
            <input
              type="search"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={hero.searchPlaceholder || 'Tìm sản phẩm...'}
              className="w-full bg-transparent text-sm outline-none placeholder:text-brand-ink-400"
            />
            {value && (
              <button
                onClick={() => onChange('')}
                className="text-xs font-semibold text-brand-orange-600 hover:text-brand-orange-700"
              >
                Xoá
              </button>
            )}
          </label>

          {/* CTAs */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {(dealBtn.text || onDealClick) && (
              dealBtn.url ? (
                <a
                  href={dealBtn.url}
                  target={dealBtn.url.startsWith('http') ? '_blank' : undefined}
                  rel={dealBtn.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-3 text-sm font-extrabold text-white shadow-cta transition hover:-translate-y-0.5 hover:shadow-cta-pink"
                >
                  <FireIcon className="h-4 w-4" />
                  {dealBtn.text || 'Xem deal HOT hôm nay'}
                  <ArrowRight className="h-4 w-4" />
                </a>
              ) : onDealClick ? (
                <button
                  type="button"
                  onClick={onDealClick}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-3 text-sm font-extrabold text-white shadow-cta transition hover:-translate-y-0.5 hover:shadow-cta-pink"
                >
                  <FireIcon className="h-4 w-4" />
                  {dealBtn.text || 'Xem deal HOT hôm nay'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : null
            )}
            {videoBtn.text && (
              <a
                href={videoBtn.url || '#video-reviews'}
                target={videoBtn.url?.startsWith('http') ? '_blank' : undefined}
                rel={videoBtn.url?.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-ink-800 shadow-soft ring-1 ring-brand-ink-200 transition hover:text-brand-orange-600 hover:ring-brand-orange-300"
              >
                {videoBtn.text}
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
