import { useEffect, useState } from 'react';
import { fetchAdminProducts } from '../../services/api';
import { fetchAnalyticsSummary } from '../../services/analytics';
import { videosApi, collectionsApi, blogsApi } from '../../services/resources';

/**
 * Dashboard — tổng quan stats + quick actions.
 *  - Cards: tổng/active/hidden/trash sản phẩm, video, collection, blog, click
 *  - Quick actions: chuyển sang tab tương ứng
 */
export default function Dashboard({ onTabChange }) {
  const [stats, setStats] = useState({
    products: { total: 0, active: 0, hidden: 0, trash: 0 },
    videos: 0,
    collections: 0,
    blogs: 0,
  });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [products, videos, collections, blogs, an] = await Promise.all([
          fetchAdminProducts().catch(() => []),
          videosApi.listAdmin().catch(() => []),
          collectionsApi.listAdmin().catch(() => []),
          blogsApi.listAdmin().catch(() => []),
          fetchAnalyticsSummary().catch(() => null),
        ]);
        setStats({
          products: {
            total: products.length,
            active: products.filter((p) => (p.status || 'active') === 'active').length,
            hidden: products.filter((p) => p.status === 'hidden').length,
            trash: products.filter((p) => p.status === 'trash').length,
          },
          videos: videos.length,
          collections: collections.length,
          blogs: blogs.length,
        });
        setAnalytics(an);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-brand-ink-100" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-brand-ink-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">📊 Dashboard</h1>
        <p className="text-sm text-brand-ink-500">Tổng quan hệ thống — cập nhật theo thời gian thực.</p>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
          ⚠️ {error}
        </div>
      )}

      {/* PRODUCT STATS */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-ink-500">
          🛍 Sản phẩm
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Tổng" value={stats.products.total} accent="ink" />
          <StatCard label="Đang hiển thị" value={stats.products.active} accent="green" />
          <StatCard label="Đã ẩn" value={stats.products.hidden} accent="amber" />
          <StatCard label="Thùng rác" value={stats.products.trash} accent="red" />
        </div>
      </section>

      {/* OTHER STATS */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-ink-500">
          📚 Nội dung
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="🎬 Videos" value={stats.videos} accent="blue" />
          <StatCard label="📚 Collections" value={stats.collections} accent="pink" />
          <StatCard label="📝 Blogs" value={stats.blogs} accent="ink" />
          <StatCard
            label="👆 Tổng click"
            value={analytics?.totalClicks || 0}
            accent="orange"
            sub={analytics ? `Hôm nay: ${analytics.todayClicks} · 7 ngày: ${analytics.last7Days}` : null}
          />
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-ink-500">
          ⚡ Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <ActionCard icon="📥" label="Import sản phẩm" onClick={() => onTabChange('import')} />
          <ActionCard icon="📊" label="Sync Google Sheet" onClick={() => onTabChange('sheet')} />
          <ActionCard icon="🎬" label="Thêm video" onClick={() => onTabChange('videos')} />
          <ActionCard icon="📚" label="Tạo bộ sưu tập" onClick={() => onTabChange('collections')} />
          <ActionCard icon="⚙️" label="Cài đặt website" onClick={() => onTabChange('settings')} />
        </div>
      </section>

      {/* TOP 5 PRODUCTS / VIDEOS */}
      {analytics && (analytics.top5Products?.length > 0 || analytics.top5Videos?.length > 0) && (
        <section className="grid gap-4 sm:grid-cols-2">
          <TopList title="🔥 Top 5 sản phẩm click nhiều" items={analytics.top5Products} />
          <TopList title="🎬 Top 5 video click nhiều" items={analytics.top5Videos} />
        </section>
      )}

      <div className="rounded-2xl bg-blue-50 p-4 text-xs text-blue-700 ring-1 ring-blue-200">
        💡 Mẹo: Dashboard này cập nhật mỗi khi bạn vào tab. Để xem realtime, bấm vào Dashboard ở sidebar.
      </div>
    </div>
  );
}

const ACCENT = {
  ink: 'bg-white text-brand-ink-900 ring-brand-ink-200',
  green: 'bg-green-50 text-green-700 ring-green-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  pink: 'bg-pink-50 text-pink-700 ring-pink-200',
  orange: 'bg-brand-orange-50 text-brand-orange-700 ring-brand-orange-200',
};

function StatCard({ label, value, accent = 'ink', sub }) {
  return (
    <div className={`rounded-2xl p-4 shadow-soft ring-1 ${ACCENT[accent]}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-1 text-2xl font-extrabold sm:text-3xl">{value}</div>
      {sub && <div className="mt-1 text-[10px] opacity-70">{sub}</div>}
    </div>
  );
}

function ActionCard({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-white p-4 text-center shadow-soft ring-1 ring-brand-ink-100 transition hover:-translate-y-0.5 hover:shadow-card-hover hover:ring-brand-orange-300"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}

function TopList({ title, items }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-brand-ink-100">
      <h3 className="text-sm font-extrabold">{title}</h3>
      {!items?.length ? (
        <p className="mt-2 text-xs text-brand-ink-500">Chưa có dữ liệu.</p>
      ) : (
        <ol className="mt-2 space-y-1.5 text-xs">
          {items.map((item, i) => (
            <li key={item.id} className="flex items-center justify-between">
              <span className="line-clamp-1 text-brand-ink-700">
                {i + 1}. {item.id}
              </span>
              <span className="font-bold text-brand-orange-600">{item.total} click</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
