import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Seo from '../components/Seo';
import LazyImage from '../components/LazyImage';
import ProductGrid from '../components/ProductGrid';
import ProductModal from '../components/ProductModal';
import { getCollection } from '../data/collections';
import { getProductsByIds } from '../data/products';

export default function Collection() {
  const { slug } = useParams();
  const collection = getCollection(slug);
  const [active, setActive] = useState(null);

  if (!collection) {
    return (
      <div className="container-page py-20 text-center">
        <Seo title="Bộ sưu tập không tồn tại" />
        <h1 className="text-2xl font-extrabold">Không tìm thấy bộ sưu tập</h1>
        <Link to="/" className="btn-primary mt-6">← Về trang chủ</Link>
      </div>
    );
  }
  const products = getProductsByIds(collection.productSlugs);

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
