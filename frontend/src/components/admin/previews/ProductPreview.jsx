import PreviewFrame from './PreviewFrame';
import ProductCard from '../../ProductCard';

/**
 * ProductPreview — realtime preview của sản phẩm hiển thị y hệt trên website.
 *  - Truyền product object (đang edit) → hiển thị card thật.
 *  - PreviewFrame wrap với switch Desktop/Mobile.
 */
export default function ProductPreview({ product }) {
  // Build product object đầy đủ shape cho ProductCard (fill missing fields)
  const safe = {
    id: product.id || 'preview',
    slug: product.slug || 'preview',
    title: product.title || '(Tên sản phẩm)',
    shortDesc:
      (product.description || product.shortDesc || '').slice(0, 80) || '',
    price: Number(product.price) || 0,
    originalPrice: Number(product.originalPrice) || 0,
    rating: Number(product.rating) || 4.8,
    reviewCount: Number(product.reviewCount) || 0,
    sold: Number(product.sold) || 0,
    images:
      Array.isArray(product.images) && product.images.length
        ? product.images
        : product.image
        ? [product.image]
        : ['https://placehold.co/600x600/f1f5f9/64748b?text=No+image'],
    video: product.video || product.videos?.[0] || null,
    affiliateUrl: product.affiliateUrl || '#',
    sourceUrl: product.sourceUrl || '',
    platform: product.platform || 'other',
    badges: Array.isArray(product.badges) ? product.badges : [],
  };

  return (
    <PreviewFrame title="Xem trước trên website">
      <div className="mx-auto max-w-xs">
        <ProductCard product={safe} index={0} onOpen={() => {}} />
      </div>
    </PreviewFrame>
  );
}
