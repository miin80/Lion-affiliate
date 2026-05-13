import { Link } from 'react-router-dom';
import Seo from '../components/Seo';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-12 text-center">
      <Seo title="404 — Không tìm thấy" />
      <div className="text-7xl sm:text-8xl">🔍</div>
      <h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">Không tìm thấy trang</h1>
      <p className="mt-3 max-w-md text-brand-ink-500">
        Trang bạn tìm có thể đã được di chuyển, đổi tên hoặc tạm thời không khả dụng.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        <Link to="/" className="btn-primary text-sm">
          ← Về trang chủ
        </Link>
        <Link
          to="/products"
          className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand-ink-700 shadow-soft ring-1 ring-brand-ink-200 hover:ring-brand-orange-300"
        >
          🛍 Xem sản phẩm
        </Link>
        <Link
          to="/blog"
          className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand-ink-700 shadow-soft ring-1 ring-brand-ink-200 hover:ring-brand-orange-300"
        >
          📝 Đọc blog
        </Link>
      </div>
      <p className="mt-8 text-xs text-brand-ink-400">
        Cần hỗ trợ? <Link to="/contact" className="text-brand-orange-600 hover:underline">Liên hệ với chúng tôi</Link>.
      </p>
    </div>
  );
}
