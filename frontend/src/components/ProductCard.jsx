import { motion } from 'framer-motion';
import LazyImage from './LazyImage';
import PlatformBadge from './PlatformBadge';
import Rating from './Rating';
import { formatVND, formatCompact, discountPercent } from '../utils/format';
import { getAffiliateUrl } from '../config/affiliate';
import { PlayIcon, ArrowRight } from './icons';

/**
 * ProductCard - phong cách KOL link-bio.
 * - Click card → mở modal/page chi tiết (onOpen callback).
 * - Nút "Mua ngay" mở direct link affiliate (không qua modal) - tối ưu conversion.
 */
export default function ProductCard({ product, index = 0, onOpen }) {
  const discount = discountPercent(product.price, product.originalPrice);
  const cover = product.images?.[0];
  // Quy tắc: nút Mua dùng affiliateUrl (đã gắn mã của user).
  // Nếu chưa có (data cũ), wrap sourceUrl bằng config affiliate. KHÔNG bao giờ link tới sourceUrl trần.
  const buyUrl =
    product.affiliateUrl?.trim() ||
    (product.sourceUrl ? getAffiliateUrl(product.sourceUrl) : '#');

  const handleCardClick = (e) => {
    // Tránh trigger khi click vào nút
    if (e.target.closest('a, button')) return;
    onOpen?.(product);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.2) }}
      onClick={handleCardClick}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-brand-ink-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
    >
      {/* Image */}
      <div className="relative">
        <LazyImage
          src={cover}
          alt={product.title}
          aspect="aspect-square"
          className="transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top-left badges */}
        <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1">
          {product.badges?.includes('reviewed') && (
            <span className="badge bg-white/95 text-brand-ink-900 backdrop-blur ring-1 ring-brand-ink-200">
              ✓ Đã review
            </span>
          )}
          {product.badges?.includes('hot') && (
            <span className="badge bg-brand-orange-500 text-white shadow-cta">
              🔥 HOT
            </span>
          )}
          {product.badges?.includes('bestseller') && (
            <span className="badge bg-gradient-to-r from-amber-500 to-brand-orange-500 text-white shadow-cta">
              👑 BEST SELLER
            </span>
          )}
          {discount > 0 && (
            <span className="badge bg-brand-pink-500 text-white">-{discount}%</span>
          )}
        </div>

        {/* Top-right platform */}
        <div className="absolute right-2 top-2">
          <PlatformBadge platform={product.platform} />
        </div>

        {/* Video indicator */}
        {product.video && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
            <PlayIcon className="h-3 w-3" /> VIDEO
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-brand-ink-900 sm:text-sm">
          {product.title}
        </h3>

        {product.shortDesc && (
          <p className="line-clamp-1 text-[11px] text-brand-ink-500 sm:text-xs">
            {product.shortDesc}
          </p>
        )}

        <Rating value={product.rating} count={product.reviewCount} />

        <div className="mt-1 flex items-end justify-between">
          <div>
            <div className="text-base font-extrabold text-brand-orange-600 sm:text-lg">
              {formatVND(product.price)}
            </div>
            {product.originalPrice > product.price && (
              <div className="text-[10px] text-brand-ink-400 line-through sm:text-xs">
                {formatVND(product.originalPrice)}
              </div>
            )}
          </div>
          <div className="text-right text-[10px] text-brand-ink-500 sm:text-xs">
            Đã bán {formatCompact(product.sold)}
          </div>
        </div>

        {/* CTA group */}
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen?.(product);
            }}
            className="rounded-full bg-brand-ink-100 px-2 py-2 text-[11px] font-semibold text-brand-ink-800 transition hover:bg-brand-ink-200 sm:text-xs"
          >
            Xem deal
          </button>
          <a
            href={buyUrl}
            target="_blank"
            rel="noopener nofollow sponsored"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center gap-1 rounded-full bg-brand-orange-500 px-2 py-2 text-[11px] font-bold text-white shadow-cta transition hover:bg-brand-orange-600 sm:text-xs"
          >
            Mua ngay <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </motion.article>
  );
}
