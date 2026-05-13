import { motion } from 'framer-motion';
import { useSiteSettings } from '../hooks/useSiteSettings';

/**
 * AboutMe — trust section "Cách mình chọn sản phẩm".
 *
 * Tách content khỏi Footer (USPs) + ProfileHeader (personality):
 *  - Giải thích TIÊU CHÍ chọn sản phẩm → tăng trust mua hàng.
 *  - 4 checkmark criteria + 4 trust pillar boxes (ecommerce style).
 *
 * Admin override toàn bộ qua settings.about.{title, intro, criteria, goal,
 * highlights}. Fallback default đầy đủ — section luôn render đẹp.
 */
const DEFAULT_CRITERIA = [
  'Giá tốt thật tại thời điểm đăng',
  'Shop uy tín, nhiều đánh giá tốt',
  'Ưu tiên đồ mình đã dùng hoặc đã tìm hiểu kỹ',
  'Chỉ chọn sản phẩm đáng mua trong tầm giá',
];

const DEFAULT_HIGHLIGHTS = [
  { icon: '🔥', text: 'Deal đang hot', sub: 'cập nhật mỗi ngày' },
  { icon: '🛍', text: 'Shop uy tín', sub: 'rating 4.5★ trở lên' },
  { icon: '⭐', text: 'Đánh giá tốt', sub: 'review thật từ buyer' },
  { icon: '🎯', text: 'Đáng mua trong tầm giá', sub: 'không đắt vô lý' },
];

export default function AboutMe() {
  const { settings } = useSiteSettings();
  const about = settings.about || {};
  const titleEmoji = about.titleEmoji || '🛒';
  const titleText = about.titleText || 'Cách mình chọn sản phẩm';
  const intro = about.intro || 'Mình không đăng tràn lan. Mỗi sản phẩm trên web đều ưu tiên:';
  const goal = about.goal || 'Mục tiêu: giúp bạn tiết kiệm thời gian tìm deal ngon mỗi ngày.';
  const criteria = Array.isArray(about.criteria) && about.criteria.length
    ? about.criteria
    : DEFAULT_CRITERIA;
  const highlights = Array.isArray(about.highlights) && about.highlights.length
    ? about.highlights
    : DEFAULT_HIGHLIGHTS;

  return (
    // mt giảm mạnh để section không cách product grid quá xa.
    <section className="container-page mt-5 sm:mt-7">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-soft p-5 ring-1 ring-brand-ink-100 sm:p-7"
      >
        {/* Header — title to hơn, font-weight 700 (bold), spacing emoji↔text rõ ràng */}
        <div className="text-center">
          <h2 className="flex items-center justify-center gap-1.5 text-lg font-bold tracking-tight sm:text-2xl">
            <span aria-hidden className="text-[1.1em] leading-none">{titleEmoji}</span>
            <span>{titleText}</span>
          </h2>
          <p className="mx-auto mt-3 max-w-[700px] text-sm leading-relaxed text-brand-ink-600 sm:mt-4 sm:text-base">
            {intro}
          </p>
        </div>

        {/* Criteria checkmarks — grid 1 col mobile, 2 cols desktop */}
        <ul className="mx-auto mt-4 grid max-w-2xl gap-1.5 sm:mt-5 sm:grid-cols-2 sm:gap-2">
          {criteria.map((c, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-xl bg-white/80 px-3 py-2 text-xs text-brand-ink-700 ring-1 ring-brand-ink-100 sm:text-sm"
            >
              <span aria-hidden className="mt-0.5 font-bold text-green-600">✓</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>

        {/* Goal italic chốt */}
        <p className="mx-auto mt-3 max-w-xl text-center text-xs italic text-brand-ink-600 sm:mt-4 sm:text-sm">
          {goal}
        </p>

        {/* 4 trust pillar boxes — gradient nhạt + icon to + subtext + hover lift */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-4 sm:gap-3">
          {highlights.map((h, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1 rounded-2xl bg-gradient-to-br from-white via-white to-brand-orange-50/60 p-3 text-center shadow-soft ring-1 ring-brand-ink-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover hover:ring-brand-orange-200 sm:gap-1.5 sm:p-4"
            >
              <span className="text-2xl sm:text-[28px]" aria-hidden>{h.icon}</span>
              <span className="text-[12px] font-bold leading-tight text-brand-ink-800 sm:text-sm">
                {h.text}
              </span>
              {h.sub && (
                <span className="text-[11px] font-normal leading-tight text-brand-ink-400 sm:text-[13px]">
                  {h.sub}
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
