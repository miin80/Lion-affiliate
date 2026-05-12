import { Link } from 'react-router-dom';
import Seo from '../components/Seo';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Seo title="404 — Không tìm thấy" />
      <div className="text-7xl">🔍</div>
      <h1 className="mt-4 text-3xl font-extrabold">Không tìm thấy trang</h1>
      <p className="mt-2 text-brand-ink-500">Trang bạn tìm có thể đã được di chuyển hoặc xoá.</p>
      <Link to="/" className="btn-primary mt-6">← Về trang chủ</Link>
    </div>
  );
}
