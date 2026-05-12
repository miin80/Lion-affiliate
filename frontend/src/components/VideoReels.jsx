import { motion } from 'framer-motion';
import LazyImage from './LazyImage';
import { PlayIcon } from './icons';
import { VIDEOS as MOCK_VIDEOS } from '../data/videos';
import { getProductBySlug } from '../data/products';
import { useResource } from '../hooks/useResource';
import { videosApi } from '../services/resources';
import { useProducts } from '../hooks/useProducts';

export default function VideoReels() {
  // Lấy từ API (đã filter active), fallback mock
  const { items } = useResource(videosApi, MOCK_VIDEOS, 'lion_affiliate_videos_v1');
  const { products } = useProducts();

  if (!items.length) return null;
  return (
    <section id="video-reviews" className="container-page mt-10 scroll-mt-6 sm:mt-14">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold sm:text-2xl">🎬 Video review mới nhất</h2>
          <p className="text-xs text-brand-ink-500 sm:text-sm">
            Bấm vào video → xem sản phẩm trong bài.
          </p>
        </div>
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-hide sm:mx-0 sm:px-0">
        {items.map((v, i) => {
          // 1. Resolve product: ưu tiên productId (id thật), fallback productSlug (mock)
          const linkedProduct =
            (v.productId && products.find((p) => p.id === v.productId)) ||
            (v.productSlug && (products.find((p) => p.slug === v.productSlug) || getProductBySlug(v.productSlug)));
          const productHref = linkedProduct ? `/product/${linkedProduct.slug}` : null;
          const buyHref = v.affiliateUrl?.trim() || linkedProduct?.affiliateUrl || '';

          return (
            <motion.article
              key={v.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.2) }}
              className="relative w-40 shrink-0 overflow-hidden rounded-2xl bg-brand-ink-900 shadow-card sm:w-48"
            >
              <a
                href={v.videoUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <LazyImage
                  src={v.thumb}
                  alt={v.title}
                  aspect="aspect-[9/16]"
                  className="opacity-90 transition-opacity hover:opacity-100"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                {v.views && (
                  <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                    ▶ {v.views}
                  </div>
                )}
                {v.duration && (
                  <div className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-brand-ink-900">
                    {v.duration}
                  </div>
                )}
                <div className="absolute inset-x-2 bottom-12">
                  <p className="line-clamp-2 text-xs font-bold text-white">{v.title}</p>
                </div>
                <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2.5 text-brand-ink-900 shadow-card">
                  <PlayIcon className="h-5 w-5" />
                </span>
              </a>

              {linkedProduct && (
                <a
                  href={buyHref || productHref}
                  target={buyHref ? '_blank' : undefined}
                  rel={buyHref ? 'noopener nofollow sponsored' : undefined}
                  className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-full bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-brand-ink-900 backdrop-blur transition hover:bg-white"
                >
                  <span className="line-clamp-1">{linkedProduct.title.split(' — ')[0]}</span>
                  <span className="shrink-0 text-brand-orange-600">→</span>
                </a>
              )}
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
