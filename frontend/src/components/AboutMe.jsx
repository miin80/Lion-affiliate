import { motion } from 'framer-motion';
import { useSiteSettings } from '../hooks/useSiteSettings';

/**
 * AboutMe — section ngắn "Mình là ai?" tạo trust + personality cho landing.
 *
 * Đọc từ site settings.about (admin có thể đổi). Fallback nội dung mặc định
 * khi admin chưa cấu hình → page vẫn nhìn có hồn ngay sau khi deploy.
 */
const DEFAULT_HIGHLIGHTS = [
  { icon: '🏠', text: 'Gia dụng tiện lợi' },
  { icon: '🍼', text: 'Đồ Mẹ & Bé an toàn' },
  { icon: '🎬', text: 'Đồ TikTok đang hot' },
  { icon: '🛒', text: 'Deal Shopee siêu ngon' },
];

export default function AboutMe() {
  const { settings } = useSiteSettings();
  const profile = settings.profile || {};
  const about = settings.about || {};
  const highlights = Array.isArray(about.highlights) && about.highlights.length
    ? about.highlights
    : DEFAULT_HIGHLIGHTS;
  const headline = about.headline || '👋 Mình là ai?';
  const intro = about.intro || 'Mình chuyên review những đồ thật đã dùng — không quảng cáo trên trời, không tâng bốc. Mỗi tuần mình tìm và thử:';

  return (
    <section className="container-page mt-10 sm:mt-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="overflow-hidden rounded-3xl bg-white p-6 shadow-card ring-1 ring-brand-ink-100 sm:p-8"
      >
        <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr] sm:gap-8">
          {profile.avatar && (
            <img
              src={profile.avatar}
              alt={profile.name}
              loading="lazy"
              className="h-20 w-20 shrink-0 rounded-2xl object-cover shadow-soft ring-2 ring-white sm:h-28 sm:w-28"
            />
          )}
          <div>
            <h2 className="text-xl font-extrabold sm:text-2xl">{headline}</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-ink-600 sm:text-base">
              {intro}
            </p>
          </div>
        </div>

        <ul className="mt-5 grid gap-2 sm:mt-6 sm:grid-cols-2 sm:gap-3">
          {highlights.map((h, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-2xl bg-brand-ink-50 px-4 py-3 text-sm font-semibold text-brand-ink-800 transition hover:bg-brand-orange-50"
            >
              <span className="text-xl leading-none">{h.icon}</span>
              <span>{h.text}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}
