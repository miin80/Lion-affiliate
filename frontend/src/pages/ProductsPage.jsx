import { useMemo, useState } from 'react';
import Seo from '../components/Seo';
import HeroSearch from '../components/HeroSearch';
import CategoryTabs from '../components/CategoryTabs';
import ProductGrid from '../components/ProductGrid';
import ProductModal from '../components/ProductModal';
import { filterAndSort } from '../data/products';
import { useProducts } from '../hooks/useProducts';

export default function ProductsPage() {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('hot');
  const [active, setActive] = useState(null);
  const { products, loading } = useProducts();

  const filtered = useMemo(
    () => filterAndSort(products, { category, search, sort }),
    [products, category, search, sort]
  );

  return (
    <>
      <Seo title="Tất cả sản phẩm" />
      <HeroSearch value={search} onChange={setSearch} />
      <CategoryTabs
        active={category}
        onChange={setCategory}
        sort={sort}
        onSortChange={setSort}
      />
      <section className="container-page mt-4 sm:mt-6">
        <div className="mb-3 text-xs text-brand-ink-500">
          {loading ? 'Đang tải...' : `${filtered.length} sản phẩm`}
        </div>
        <ProductGrid products={filtered} onOpen={setActive} />
      </section>
      <ProductModal product={active} onClose={() => setActive(null)} />
    </>
  );
}
