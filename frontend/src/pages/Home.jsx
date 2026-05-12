import { useMemo, useState } from 'react';
import Seo from '../components/Seo';
import ProfileHeader from '../components/ProfileHeader';
import HeroSearch from '../components/HeroSearch';
import CategoryTabs from '../components/CategoryTabs';
import ProductGrid from '../components/ProductGrid';
import VideoReels from '../components/VideoReels';
import TopBestseller from '../components/TopBestseller';
import Collections from '../components/Collections';
import ProductModal from '../components/ProductModal';
import { filterAndSort } from '../data/products';
import { useProducts } from '../hooks/useProducts';

export default function Home() {
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
      <Seo />

      <ProfileHeader />
      <HeroSearch
        value={search}
        onChange={setSearch}
        onDealClick={() => {
          setCategory('deal');
          setTimeout(() => {
            document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }}
      />

      <CategoryTabs
        active={category}
        onChange={setCategory}
        sort={sort}
        onSortChange={setSort}
      />

      <section id="product-grid" className="container-page mt-4 scroll-mt-6 sm:mt-6">
        <div className="mb-3 flex items-center justify-between text-xs text-brand-ink-500">
          <span>
            {loading ? 'Đang tải...' : `${filtered.length} sản phẩm${search && ` cho "${search}"`}`}
          </span>
        </div>
        <ProductGrid
          products={filtered}
          onOpen={setActive}
          emptyText="Không tìm thấy sản phẩm phù hợp. Thử từ khoá khác nhé."
        />
      </section>

      <VideoReels />
      <TopBestseller onOpen={setActive} products={products} />
      <Collections />

      <ProductModal product={active} onClose={() => setActive(null)} />
    </>
  );
}
