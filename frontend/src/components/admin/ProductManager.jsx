import { useEffect, useMemo, useState } from 'react';
import PlatformBadge from '../PlatformBadge';
import { CATEGORIES } from '../../data/categories';
import {
  fetchAdminProducts,
  updateProductStatusApi,
  deleteProductApi,
} from '../../services/api';
import { formatVND } from '../../utils/format';

const STATUS_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang hiển thị' },
  { key: 'hidden', label: 'Đã ẩn' },
];

const CATEGORY_NAME = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.name])
);

/**
 * Quản lý sản phẩm:
 *  - Search theo tên
 *  - Filter trạng thái (tất cả / đang hiển thị / đã ẩn)
 *  - Ẩn / Hiện lại (PATCH status)
 *  - Xoá vĩnh viễn (có confirm)
 */
export default function ProductManager() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminProducts();
      setList(data);
    } catch (err) {
      setError(`Không tải được danh sách: ${err.message}. Backend đang chạy chưa?`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const flashToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const toggleStatus = async (product) => {
    const next = product.status === 'active' ? 'hidden' : 'active';
    setBusyId(product.id);
    try {
      const updated = await updateProductStatusApi(product.id, next);
      setList((arr) => arr.map((p) => (p.id === product.id ? updated : p)));
      flashToast(
        next === 'hidden'
          ? `✓ Đã ẩn "${product.title}" khỏi website`
          : `✓ Đã hiện lại "${product.title}" trên website`
      );
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (product) => {
    if (
      !window.confirm(
        `Bạn chắc chắn muốn xoá "${product.title}"?\n\nHành động này KHÔNG thể hoàn tác — sản phẩm sẽ bị xoá vĩnh viễn khỏi products.json.`
      )
    )
      return;
    setBusyId(product.id);
    try {
      await deleteProductApi(product.id);
      setList((arr) => arr.filter((p) => p.id !== product.id));
      flashToast(`🗑 Đã xoá vĩnh viễn "${product.title}"`);
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    let arr = list;
    if (statusFilter !== 'all') {
      arr = arr.filter((p) => (p.status || 'active') === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return arr;
  }, [list, statusFilter, search]);

  const counts = useMemo(
    () => ({
      all: list.length,
      active: list.filter((p) => (p.status || 'active') === 'active').length,
      hidden: list.filter((p) => p.status === 'hidden').length,
    }),
    [list]
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-brand-ink-100 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="flex flex-1 items-center gap-2 rounded-full bg-brand-ink-50 px-4 py-2">
            <span className="text-brand-ink-400">🔍</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên / tag..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {STATUS_FILTERS.map((f) => {
              const isActive = statusFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? 'border-transparent bg-brand-ink-900 text-white'
                      : 'border-brand-ink-200 bg-white text-brand-ink-700 hover:border-brand-orange-300'
                  }`}
                >
                  {f.label} ({counts[f.key]})
                </button>
              );
            })}
          </div>

          <button
            onClick={load}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-orange-600 ring-1 ring-brand-orange-200 hover:bg-brand-orange-50"
            title="Reload"
          >
            ↻ Reload
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="rounded-2xl bg-green-50 px-4 py-2.5 text-sm text-green-700 ring-1 ring-green-200">
          {toast}
        </div>
      )}
      {error && (
        <div className="rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="rounded-3xl bg-brand-ink-50 p-10 text-center text-sm text-brand-ink-500">
          Đang tải danh sách...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl bg-brand-ink-50 p-10 text-center text-sm text-brand-ink-500">
          {list.length === 0
            ? 'Chưa có sản phẩm nào. Sang tab "Import" để thêm sản phẩm đầu tiên.'
            : 'Không có sản phẩm nào khớp filter / từ khoá.'}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              busy={busyId === p.id}
              onToggleStatus={() => toggleStatus(p)}
              onDelete={() => remove(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductRow({ product, busy, onToggleStatus, onDelete }) {
  const isHidden = product.status === 'hidden';
  return (
    <article
      className={`flex gap-3 rounded-2xl bg-white p-3 shadow-card ring-1 transition ${
        isHidden ? 'ring-brand-ink-200 opacity-70' : 'ring-brand-ink-100'
      }`}
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
        <img
          src={product.images?.[0] || 'https://placehold.co/200x200/f1f5f9/64748b?text=?'}
          alt={product.title}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {isHidden && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-brand-ink-900">
              ẨN
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 text-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <PlatformBadge platform={product.platform} className="text-[10px]" />
          <StatusPill status={product.status || 'active'} />
        </div>
        <h3 className="line-clamp-2 font-semibold leading-snug">{product.title}</h3>
        <div className="text-xs text-brand-ink-500">
          {CATEGORY_NAME[product.category] || product.category || '—'}
        </div>
        <div className="font-bold text-brand-orange-600">
          {product.price ? formatVND(product.price) : '—'}
        </div>

        {/* Actions */}
        <div className="mt-1 flex flex-wrap gap-1.5">
          <button
            onClick={onToggleStatus}
            disabled={busy}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition disabled:opacity-50 ${
              isHidden
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
            }`}
          >
            {isHidden ? '👁 Hiện lại' : '🙈 Ẩn khỏi website'}
          </button>
          <button
            onClick={onDelete}
            disabled={busy}
            className="rounded-full bg-red-100 px-3 py-1 text-[11px] font-semibold text-red-700 transition hover:bg-red-200 disabled:opacity-50"
          >
            🗑 Xoá vĩnh viễn
          </button>
        </div>
      </div>
    </article>
  );
}

function StatusPill({ status }) {
  if (status === 'hidden') {
    return (
      <span className="badge bg-amber-100 text-amber-800">● Đã ẩn</span>
    );
  }
  return <span className="badge bg-green-100 text-green-700">● Đang hiển thị</span>;
}
