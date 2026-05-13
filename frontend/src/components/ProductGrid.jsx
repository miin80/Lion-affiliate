import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import { isAuthenticated } from '../services/auth';

/**
 * ProductGrid — grid sản phẩm public.
 *
 * Empty state:
 *  - Public visitor: chỉ hiện message clean kiểu "Sản phẩm đang được cập nhật".
 *    KHÔNG hiển thị nút/đường dẫn tới /admin.
 *  - Admin đã login (isAuthenticated): hiện thêm hint admin + nút "Vào trang
 *    quản trị" để debug nhanh.
 *
 * Props:
 *  - emptyText: text hiển thị cho visitor public.
 *  - emptyTextAdmin: (tuỳ chọn) override khi admin đã login.
 *  - emptyIcon: emoji icon, default ✨.
 *  - showAdminCta: cho phép tắt nút admin hoàn toàn (vd. trong embedded view).
 */
export default function ProductGrid({
  products = [],
  onOpen,
  emptyText,
  emptyTextAdmin,
  emptyIcon = '✨',
  showAdminCta = true,
}) {
  if (!products.length) {
    const isAdmin = isAuthenticated();
    const text =
      isAdmin && emptyTextAdmin
        ? emptyTextAdmin
        : emptyText ||
          'Các sản phẩm chọn lọc sẽ sớm có mặt tại đây. Hãy follow để không bỏ lỡ deal mới!';
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-brand-ink-50 p-10 text-center">
        <div className="text-5xl">{emptyIcon}</div>
        <p className="max-w-md text-sm text-brand-ink-500">{text}</p>
        {isAdmin && showAdminCta && (
          <Link to="/admin" className="btn-primary mt-2 text-xs">
            🚪 Vào trang quản trị
          </Link>
        )}
      </div>
    );
  }
  return (
    // auto-rows-fr: mọi row có CÙNG height = card cao nhất trong row → CTA mọi card
    // thẳng hàng. Dòng cuối có 1 sản phẩm cũng KHÔNG bị stretch (grid track theo
    // grid-cols cố định, item chỉ chiếm 1 cell).
    <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:gap-5">
      {products.map((p, i) => (
        <ProductCard key={p.id || p.slug} product={p} index={i} onOpen={onOpen} />
      ))}
    </div>
  );
}
