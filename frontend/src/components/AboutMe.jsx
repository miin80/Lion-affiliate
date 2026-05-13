import { motion } from 'framer-motion';
import { useSiteSettings } from '../hooks/useSiteSettings';

/**
 * AboutMe — trust section "Cách mình chọn sản phẩm".
 *
 * Khác Footer (USPs) + ProfileHeader (personality):
 *  - Giải thích TIÊU CHÍ chọn sản phẩm → tăng trust mua hàng.
 *  - 4 checkmark criteria + 4 trust pillar boxes (ecommerce style).
 *  - Bỏ avatar/personal intro vì đã có ở 2 chỗ khác.
 *
 * Admin có thể override toàn bộ qua settings.about.{title, intro, criteria,
 * goal, highlights}. Fallback default đầy đủ — section luôn render đẹp.
 */
const DEFAULT_CRITERIA = [
  'Giá tốt thật tại thời điểm đăng',
  'Shop uy tín, nhiều đánh giá tốt',
  'Ưu tiên đồ mình đã dùng hoặc đã tìm hiểu kỹ',
  'Chỉ chọn sản phẩm đáng mua trong tầm giá',
];

const DEFAULT_HIGHLIGHTS = [
  { icon: '🔥', text: 'Deal đang hot' },
  { icon: '🛍', text: 'Shop uy tín' },
  { icon: '⭐', text: 'Đánh giá tốt' },
  { icon: '🎯', text: 'Đáng mua trong tầm giá' },
];

export default function AboutMe() {
  const { settings } = useSiteSettings();
  const about = settings.about || {};
  const title = about.title || '🛒 Cách mình chọn sản phẩm';
  const intro = about.intro || 'Mình không đăng tràn lan. Mỗi sản phẩm trên web đều ưu tiên:';
  const goal = about.goal || 'Mục tiêu: giúp bạn tiết kiệm thời gian tìm deal ngon mỗi ngày.';
  const criteria = Array.isArray(about.criteria) && about.criteria.length
    ? about.criteria
    : DEFAULT_CRITERIA;
  const highlights = Array.isArray(about.highlights) && about.highlights.length
    ? about.highlights
    : DEFAULT_HIGHLIGHTS;

  return (
    <section className="container-page mt-8 sm:mt-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="overflow-hidden rounded-3xl bg-gradient-soft p-4 ring-1 ring-brand-ink-100 sm:p-6"
      >
        {/* Header — centered, compact */}
        <div className="text-center">
          <h2 className="text-base font-extrabold sm:text-lg">{title}</h2>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-brand-ink-600 sm:text-sm">
            {intro}
          </p>
        </div>

        {/* Criteria checkmarks — grid 1 col mobile, 2 cols desktop, max-w để gọn */}
        <ul className="mx-auto mt-3 grid max-w-2xl gap-1.5 sm:mt-4 sm:grid-cols-2 sm:gap-2">
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

        {/* Goal — italic dưới criteria, tạo cảm giác chốt */}
        <p className="mx-auto mt-3 max-w-xl text-center text-xs italic text-brand-ink-600 sm:mt-4 sm:text-sm">
          {goal}
        </p>

        {/* 4 trust pillar boxes — row pattern của ecommerce hiện đại */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-4 sm:gap-3">
          {highlights.map((h, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1 rounded-2xl bg-white p-2.5 text-center shadow-soft ring-1 ring-brand-ink-100 transition hover:-translate-y-0.5 hover:ring-brand-orange-200 sm:gap-1.5 sm:p-3"
            >
              <span className="text-xl sm:text-2xl" aria-hidden>{h.icon}</span>
              <span className="text-[11px] font-semibold leading-tight text-brand-ink-800 sm:text-xs">
                {h.text}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
