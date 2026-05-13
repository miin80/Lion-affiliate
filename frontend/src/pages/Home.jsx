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
import { useSiteSettings } from '../hooks/useSiteSettings';
import { ProductGridSkeleton } from '../components/Skeletons';

export default function Home() {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('hot');
  const [active, setActive] = useState(null);
  const { products, loading } = useProducts();
  const { settings } = useSiteSettings();
  const sections = settings.sections || {};
  // mặc định bật nếu chưa cấu hình
  const show = (key) => sections[key] !== false;

  const filtered = useMemo(
    () => filterAndSort(products, { category, search, sort }),
    [products, category, search, sort]
  );

  return (
    <>
      <Seo />

      <ProfileHeader />
      {show('hero') && (
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
      )}

      {show('products') && (
        <>
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
            {loading && products.length === 0 ? (
              <ProductGridSkeleton count={8} />
            ) : (
              <ProductGrid
                products={filtered}
                onOpen={setActive}
                emptyIcon={products.length === 0 ? '✨' : '🔍'}
                emptyText={
                  products.length === 0
                    ? '✨ Sản phẩm đang được cập nhật. Deal mới sẽ sớm xuất hiện — quay lại sau nhé!'
                    : 'Không tìm thấy sản phẩm phù hợp. Thử từ khoá khác nhé.'
                }
                emptyTextAdmin={
                  products.length === 0
                    ? 'Chưa có sản phẩm nào. Vào trang quản trị → Import hoặc Google Sheet để thêm.'
                    : undefined
                }
                showAdminCta={products.length === 0}
              />
            )}
          </section>
        </>
      )}

      {show('videoReels') && <VideoReels />}
      {show('topBestseller') && <TopBestseller onOpen={setActive} products={products} />}
      {show('collections') && <Collections />}

      <ProductModal product={active} onClose={() => setActive(null)} />
    </>
  );
}
