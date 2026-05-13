import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Seo from '../components/Seo';
import LazyImage from '../components/LazyImage';
import ProductGrid from '../components/ProductGrid';
import ProductModal from '../components/ProductModal';
import { COLLECTIONS as MOCK_COLLECTIONS, getCollection } from '../data/collections';
import { getProductsByIds } from '../data/products';
import { useResource } from '../hooks/useResource';
import { collectionsApi } from '../services/resources';
import { useProducts } from '../hooks/useProducts';
import { SHOW_DEMO_DATA } from '../utils/demoFlag';

export default function Collection() {
  const { slug } = useParams();
  // Real collections từ backend (cache stale-while-revalidate). Fallback mock chỉ khi dev.
  const fallback = SHOW_DEMO_DATA ? MOCK_COLLECTIONS : [];
  const { items: realCollections, loading } = useResource(
    collectionsApi,
    fallback,
    'lion_affiliate_collections_v2'
  );
  const { products: realProducts } = useProducts();
  const [active, setActive] = useState(null);

  const collection = realCollections.find((c) => c.slug === slug) || getCollection(slug);

  if (loading && !collection) {
    return <div className="container-page py-20 text-center text-brand-ink-500">Đang tải...</div>;
  }
  if (!collection) {
    return (
      <div className="container-page py-20 text-center">
        <Seo title="Bộ sưu tập không tồn tại" />
        <h1 className="text-2xl font-extrabold">Không tìm thấy bộ sưu tập</h1>
        <Link to="/" className="btn-primary mt-6">← Về trang chủ</Link>
      </div>
    );
  }

  // Match products: ưu tiên real product theo slug hoặc id, fallback sang mock.
  const slugs = collection.productSlugs || [];
  const realMatches = slugs
    .map((s) => realProducts.find((p) => p.slug === s || p.id === s))
    .filter(Boolean);
  const products = realMatches.length ? realMatches : getProductsByIds(slugs);

  return (
    <>
      <Seo title={collection.title} description={collection.desc} image={collection.cover} />

      <section className="relative h-56 overflow-hidden sm:h-72">
        <LazyImage src={collection.cover} alt={collection.title} aspect="aspect-auto" eager wrapperClassName="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="container-page absolute inset-x-0 bottom-0 pb-6 text-white">
          <div className="text-3xl">{collection.emoji}</div>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{collection.title}</h1>
          <p className="mt-1 max-w-xl text-sm text-white/90 sm:text-base">{collection.desc}</p>
        </div>
      </section>

      <section className="container-page mt-6">
        <ProductGrid products={products} onOpen={setActive} />
      </section>

      <ProductModal product={active} onClose={() => setActive(null)} />
    </>
  );
}
