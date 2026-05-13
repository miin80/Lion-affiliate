import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Seo from '../components/Seo';
import LazyImage from '../components/LazyImage';
import PlatformBadge from '../components/PlatformBadge';
import Rating from '../components/Rating';
import { CheckCircle, ArrowRight, ArrowLeft } from '../components/icons';
import { formatVND, formatCompact, formatPriceRange, resolveDiscount } from '../utils/format';
import { getAffiliateUrl } from '../config/affiliate';
import { getProductBySlug } from '../data/products';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../hooks/useProducts';
import { trackClick } from '../services/analytics';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { products, loading } = useProducts();
  const product = products.find((p) => p.slug === slug) || getProductBySlug(slug);
  const [activeImg, setActiveImg] = useState(0);

  // Reset gallery thumbnail index khi sang product khác (Route component không
  // unmount, useState giữ giá trị cũ → có thể trỏ index ngoài array images).
  useEffect(() => {
    setActiveImg(0);
  }, [slug]);

  // Click related card → điều hướng tới detail page mới (React Router, không
  // reload). ScrollToTop component đã xử lý scroll lên đầu khi pathname đổi.
  const handleRelatedOpen = (p) => {
    if (p?.slug) navigate(`/product/${p.slug}`);
  };

  if (loading && !product) {
    return <div className="container-page py-20 text-center text-brand-ink-500">Đang tải...</div>;
  }

  if (!product) {
    return (
      <div className="container-page py-20 text-center">
        <Seo title="Không tìm thấy" />
        <h1 className="text-2xl font-extrabold">Không tìm thấy sản phẩm</h1>
        <Link to="/" className="btn-primary mt-6">← Về trang chủ</Link>
      </div>
    );
  }

  const discount = resolveDiscount(product);
  const priceLabel = formatPriceRange(product.priceMin, product.priceMax, product.price);
  const oldPriceLabel = formatPriceRange(product.oldPriceMin, product.oldPriceMax, product.originalPrice);
  const hasOldPrice =
    !!oldPriceLabel &&
    ((product.oldPriceMin || product.originalPrice) > (product.priceMin || product.price));
  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);
  const affiliate =
    product.affiliateUrl?.trim() ||
    (product.sourceUrl ? getAffiliateUrl(product.sourceUrl) : '#');
  const firstVideo = product.video || product.videos?.[0] || null;
  // Guard: product có thể thiếu images/platform (data từ Sheet/import lỗi). Không được crash.
  const images = Array.isArray(product.images) ? product.images : [];
  const platformLabel = product.platform
    ? product.platform.charAt(0).toUpperCase() + product.platform.slice(1)
    : 'cửa hàng';

  return (
    <>
      <Seo
        title={product.title}
        description={product.shortDesc || product.fullDesc}
        image={images[0]}
        type="product"
      />

      {/* Back button rõ ràng + breadcrumb. Trên mobile, button bằng tay chạm
          tốt hơn link text-xs nhỏ. Dùng navigate(-1) để giữ scroll state nếu
          user từ list → fallback navigate('/') nếu history trống (deep link). */}
      <div className="container-page flex items-center gap-3 pt-4 sm:pt-6">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-ink-700 shadow-soft ring-1 ring-brand-ink-200 transition hover:bg-brand-orange-50 hover:text-brand-orange-600 hover:ring-brand-orange-200 sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
        <nav aria-label="Breadcrumb" className="hidden truncate text-xs text-brand-ink-500 sm:block">
          <Link to="/" className="hover:text-brand-orange-600">Trang chủ</Link>
          <span className="mx-1">/</span>
          <Link to="/products" className="hover:text-brand-orange-600">Sản phẩm</Link>
          <span className="mx-1">/</span>
          <span className="text-brand-ink-700">{product.title}</span>
        </nav>
      </div>

      <div className="container-page mt-4 grid gap-6 sm:mt-6 lg:grid-cols-2 lg:gap-10">
        {/* Gallery */}
        <div>
          <div className="overflow-hidden rounded-3xl bg-brand-ink-50 shadow-card ring-1 ring-brand-ink-100">
            {firstVideo ? (
              <video
                src={firstVideo}
                controls
                playsInline
                className="aspect-square w-full bg-black object-cover"
              />
            ) : (
              <LazyImage
                src={images[activeImg] || images[0]}
                alt={product.title}
                aspect="aspect-square"
                eager
              />
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  onClick={() => setActiveImg(i)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-2 transition ${
                    i === activeImg ? 'ring-brand-orange-500' : 'ring-transparent'
                  }`}
                >
                  <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <PlatformBadge platform={product.platform} />
            {product.badges?.includes('reviewed') && (
              <span className="badge bg-brand-ink-100 text-brand-ink-800">✓ Minh Quang đã review</span>
            )}
            {product.badges?.includes('hot') && (
              <span className="badge bg-brand-orange-500 text-white">🔥 HOT</span>
            )}
            {discount > 0 && (
              <span className="badge bg-brand-pink-500 text-white">-{discount}%</span>
            )}
          </div>

          <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">
            {product.title}
          </h1>

          <Rating value={product.rating} count={product.reviewCount} size="lg" />

          <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-gradient-soft p-4 ring-1 ring-brand-ink-100">
            <span className="text-3xl font-extrabold text-brand-orange-600">
              {priceLabel || formatVND(product.price)}
            </span>
            {hasOldPrice && (
              <span className="text-base text-brand-ink-400 line-through">
                {oldPriceLabel}
              </span>
            )}
            {discount > 0 && (
              <span className="badge bg-brand-pink-500 text-white">-{discount}%</span>
            )}
            {(product.soldText || product.sold) && (
              <span className="ml-auto text-xs text-brand-ink-500">
                Đã bán {product.soldText || formatCompact(product.sold)}
              </span>
            )}
          </div>

          {product.fullDesc && (
            <p className="text-base leading-relaxed text-brand-ink-700">
              {product.fullDesc}
            </p>
          )}

          {product.pros?.length > 0 && (
            <div className="rounded-2xl bg-white p-4 ring-1 ring-brand-ink-100">
              <div className="mb-2 text-sm font-bold">✨ Ưu điểm</div>
              <ul className="space-y-2">
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
            <div className="rounded-2xl bg-brand-pink-50 p-4">
              <div className="mb-1 text-sm font-bold text-brand-pink-700">
                💡 Phù hợp với
              </div>
              <p className="text-sm text-brand-ink-800">{product.forWho}</p>
            </div>
          )}

          <div className="sticky bottom-20 z-10 mt-2 grid gap-2 sm:static sm:grid-cols-[1fr_auto]">
            <a
              href={affiliate}
              target="_blank"
              rel="noopener nofollow sponsored"
              onClick={() => trackClick({ type: 'product', id: product.id, action: 'buy' })}
              className="btn-primary py-4 text-base"
            >
              Mua ngay trên {platformLabel}
              <ArrowRight className="h-5 w-5" />
            </a>
            <button
              onClick={() => navigator.share?.({ url: window.location.href, title: product.title })}
              className="btn-ghost py-4 text-base"
            >
              Chia sẻ
            </button>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="container-page mt-12">
          <h2 className="mb-4 text-xl font-extrabold">Có thể bạn cũng thích</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} onOpen={handleRelatedOpen} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
