import { motion } from 'framer-motion';
import LazyImage from './LazyImage';
import Rating from './Rating';
import { formatVND, formatCompact, discountPercent } from '../utils/format';
import { getAffiliateUrl } from '../config/affiliate';
// Không import MOCK — chỉ hiện sản phẩm thật.

const PODIUM = [
  { rank: 1, label: '🥇', color: 'from-amber-400 to-yellow-500' },
  { rank: 2, label: '🥈', color: 'from-slate-300 to-slate-400' },
  { rank: 3, label: '🥉', color: 'from-orange-300 to-amber-500' },
];

export default function TopBestseller({ onOpen, products }) {
  // Ưu tiên sản phẩm có badge "bestseller", fallback sang sold count.
  // Section CHỈ hiện khi có ít nhất 3 sản phẩm thật (podium 🥇🥈🥉).
  const pool = products || [];
  if (pool.length < 3) return null;
  const tagged = pool.filter((p) => p.badges?.includes('bestseller'));
  const top = (tagged.length >= 3 ? tagged : pool)
    .slice()
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 3);
  if (!top.length) return null;

  return (
    <section className="container-page mt-8 sm:mt-12">
      <div className="mb-4">
        <h2 className="text-xl font-extrabold sm:text-2xl">🏆 Top bán chạy</h2>
        <p className="text-xs text-brand-ink-500 sm:text-sm">
          3 sản phẩm được mọi người mua nhiều nhất qua link của mình.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {top.map((p, i) => {
          const meta = PODIUM[i];
          const discount = discountPercent(p.price, p.originalPrice);
          const affiliate =
            p.affiliateUrl?.trim() ||
            (p.sourceUrl ? getAffiliateUrl(p.sourceUrl) : '#');
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="relative overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-brand-ink-100"
            >
              {/* Rank ribbon */}
              <div
                className={`absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${meta.color} text-lg shadow`}
              >
                {meta.label}
              </div>

              <div className="flex gap-3 p-3 sm:flex-col sm:gap-0 sm:p-0">
                <button
                  type="button"
                  onClick={() => onOpen?.(p)}
                  className="block w-28 shrink-0 sm:w-auto"
                >
                  <LazyImage
                    src={p.images[0]}
                    alt={p.title}
                    aspect="aspect-square"
                    className="rounded-xl sm:rounded-none"
                  />
                </button>

                <div className="flex flex-1 flex-col justify-between gap-1 sm:p-4">
                  <div>
                    <h3
                      className="line-clamp-2 cursor-pointer text-sm font-semibold leading-snug text-brand-ink-900 hover:text-brand-orange-600"
                      onClick={() => onOpen?.(p)}
                    >
                      {p.title}
                    </h3>
                    <Rating value={p.rating} count={p.reviewCount} />
                  </div>

                  <div className="flex items-end justify-between gap-2 pt-1">
                    <div>
                      <div className="text-base font-extrabold text-brand-orange-600">
                        {formatVND(p.price)}
                      </div>
                      {discount > 0 && (
                        <div className="text-[10px] text-brand-pink-600 font-bold">
                          Giảm {discount}% · Đã bán {formatCompact(p.sold)}
                        </div>
                      )}
                    </div>
                    <a
                      href={affiliate}
                      target="_blank"
                      rel="noopener nofollow sponsored"
                      className="rounded-full bg-brand-orange-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-cta hover:bg-brand-orange-600"
                    >
                      Mua →
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
