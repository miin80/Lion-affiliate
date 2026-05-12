import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import LazyImage from './LazyImage';
import PlatformBadge from './PlatformBadge';
import Rating from './Rating';
import { formatVND, formatCompact, discountPercent } from '../utils/format';
import { getAffiliateUrl } from '../config/affiliate';
import { CloseIcon, ArrowRight, CheckCircle } from './icons';
import { trackClick } from '../services/analytics';

/**
 * Modal chi tiết sản phẩm — bottom-sheet trên mobile, dialog giữa trên desktop.
 * Có nút "Xem trang đầy đủ" link sang /product/:slug để SEO/share.
 */
export default function ProductModal({ product, onClose }) {
  const [activeImg, setActiveImg] = useState(0);
  // Hỗ trợ schema cũ (single video) và mới (videos array)
  const firstVideo = product?.video || product?.videos?.[0] || null;

  useEffect(() => {
    if (!product) return;
    setActiveImg(0);
    document.body.style.overflow = 'hidden';
    const esc = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', esc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', esc);
    };
  }, [product, onClose]);

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
        >
          <motion.div
            key="sheet"
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[92vh] w-full overflow-hidden rounded-t-3xl bg-white sm:max-h-[90vh] sm:max-w-3xl sm:rounded-3xl"
          >
            {/* Close */}
            <button
              onClick={onClose}
              aria-label="Đóng"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-brand-ink-900 shadow ring-1 ring-brand-ink-200 hover:bg-white"
            >
              <CloseIcon className="h-5 w-5" />
            </button>

            <div className="overflow-y-auto max-h-[92vh] sm:max-h-[90vh]">
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                {/* Gallery */}
                <div className="bg-brand-ink-50">
                  <div className="relative">
                    {firstVideo ? (
                      <video
                        key={firstVideo}
                        src={firstVideo}
                        controls
                        playsInline
                        className="aspect-square w-full bg-black object-cover"
                      />
                    ) : (
                      <LazyImage
                        src={product.images[activeImg]}
                        alt={product.title}
                        aspect="aspect-square"
                        eager
                      />
                    )}
                    <div className="absolute left-3 top-3">
                      <PlatformBadge platform={product.platform} />
                    </div>
                  </div>
                  {product.images.length > 1 && !firstVideo && (
                    <div className="flex gap-2 overflow-x-auto p-3 scrollbar-hide">
                      {product.images.map((src, i) => (
                        <button
                          key={src + i}
                          onClick={() => setActiveImg(i)}
                          className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                            i === activeImg ? 'ring-brand-orange-500' : 'ring-transparent'
                          }`}
                        >
                          <img
                            src={src}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Detail */}
                <div className="flex flex-col gap-3 p-4 sm:p-6">
                  <div className="flex flex-wrap gap-1.5">
                    {product.badges?.includes('reviewed') && (
                      <span className="badge bg-brand-ink-100 text-brand-ink-800">
                        ✓ Minh Quang đã review
                      </span>
                    )}
                    {product.badges?.includes('bestseller') && (
                      <span className="badge bg-gradient-to-r from-amber-500 to-brand-orange-500 text-white">
                        👑 BEST SELLER
                      </span>
                    )}
                    {product.badges?.includes('hot') && (
                      <span className="badge bg-brand-orange-500 text-white">🔥 HOT</span>
                    )}
                  </div>

                  <h2 className="text-lg font-extrabold leading-tight sm:text-xl">
                    {product.title}
                  </h2>

                  <Rating value={product.rating} count={product.reviewCount} size="lg" />

                  <div className="flex flex-wrap items-end gap-2">
                    <span className="text-2xl font-extrabold text-brand-orange-600">
                      {formatVND(product.price)}
                    </span>
                    {product.originalPrice > product.price && (
                      <>
                        <span className="text-sm text-brand-ink-400 line-through">
                          {formatVND(product.originalPrice)}
                        </span>
                        <span className="badge bg-brand-pink-500 text-white">
                          -{discountPercent(product.price, product.originalPrice)}%
                        </span>
                      </>
                    )}
                  </div>

                  <div className="text-xs text-brand-ink-500">
                    Đã bán {formatCompact(product.sold)} · {product.tags?.join(' · ')}
                  </div>

                  {product.fullDesc && (
                    <p className="text-sm leading-relaxed text-brand-ink-700">
                      {product.fullDesc}
                    </p>
                  )}

                  {product.pros?.length > 0 && (
                    <div className="rounded-2xl bg-brand-ink-50 p-3 sm:p-4">
                      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-ink-700">
                        ✨ Ưu điểm
                      </div>
                      <ul className="space-y-1.5">
                        {product.pros.map((pro, i) => (
                          <li key={i} className="flex gap-2 text-sm text-brand-ink-800">
                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange-500" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {product.forWho && (
                    <div className="rounded-2xl bg-brand-pink-50 p-3 sm:p-4">
                      <div className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-pink-600">
                        💡 Phù hợp với
                      </div>
                      <p className="text-sm text-brand-ink-800">{product.forWho}</p>
                    </div>
                  )}

                  {/* CTAs */}
                  <div className="mt-1 flex gap-2">
                    <Link
                      to={`/product/${product.slug}`}
                      className="btn-ghost flex-1 text-sm"
                      onClick={onClose}
                    >
                      Trang chi tiết
                    </Link>
                    <a
                      href={
                        product.affiliateUrl?.trim() ||
                        (product.sourceUrl ? getAffiliateUrl(product.sourceUrl) : '#')
                      }
                      target="_blank"
                      rel="noopener nofollow sponsored"
                      onClick={() => trackClick({ type: 'product', id: product.id, action: 'buy' })}
                      className="btn-primary flex-[1.4] text-sm"
                    >
                      Mua ngay <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
