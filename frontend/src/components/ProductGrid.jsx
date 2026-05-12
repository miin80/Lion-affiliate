import ProductCard from './ProductCard';

export default function ProductGrid({ products = [], onOpen, emptyText = 'Chưa có sản phẩm nào.' }) {
  if (!products.length) {
    return (
      <div className="rounded-3xl bg-brand-ink-50 p-10 text-center text-brand-ink-500">
        {emptyText}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:gap-5">
      {products.map((p, i) => (
        <ProductCard key={p.id || p.slug} product={p} index={i} onOpen={onOpen} />
      ))}
    </div>
  );
}
