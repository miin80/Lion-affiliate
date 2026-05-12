import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import { isAuthenticated } from '../services/auth';

export default function ProductGrid({
  products = [],
  onOpen,
  emptyText,
  emptyIcon = '🌱',
  showAdminCta = true,
}) {
  if (!products.length) {
    const isAdmin = isAuthenticated();
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-brand-ink-50 p-10 text-center">
        <div className="text-5xl">{emptyIcon}</div>
        <p className="max-w-md text-sm text-brand-ink-500">
          {emptyText || 'Chưa có sản phẩm nào.'}
        </p>
        {showAdminCta && (
          <Link
            to={isAdmin ? '/admin' : '/admin/login'}
            className="btn-primary mt-2 text-xs"
          >
            🚪 Vào trang quản trị
          </Link>
        )}
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
