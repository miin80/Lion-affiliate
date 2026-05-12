import { useEffect, useMemo, useState } from 'react';
import PlatformBadge from '../PlatformBadge';
import { CATEGORIES } from '../../data/categories';
import {
  fetchAdminProducts,
  updateProductStatusApi,
  deleteProductApi,
} from '../../services/api';
import { formatVND, formatDate } from '../../utils/format';
import EditProductModal from './EditProductModal';

const STATUS_FILTERS = [
  { key: 'all', label: 'Tất cả (không tính trash)' },
  { key: 'active', label: 'Đang hiển thị' },
  { key: 'hidden', label: 'Đã ẩn' },
];

const SOURCE_FILTERS = [
  { key: 'all', label: '🌐 Tất cả nguồn' },
  { key: 'manual', label: '✍️ Manual' },
  { key: 'sheet', label: '📊 Google Sheet' },
];

const SORT_OPTIONS = [
  { key: 'new', label: '🆕 Mới nhất' },
  { key: 'old', label: '⏳ Cũ nhất' },
  { key: 'price-desc', label: '💸 Giá cao → thấp' },
  { key: 'price-asc', label: '💸 Giá thấp → cao' },
  { key: 'hot', label: '🔥 Hot (badge)' },
];

const CATEGORY_NAME = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.name])
);

export default function ProductManager() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sort, setSort] = useState('new');
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');
  const [editing, setEditing] = useState(null);

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
    setTimeout(() => setToast(''), 2800);
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
          : `✓ Đã hiện lại "${product.title}"`
      );
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  // Đưa vào thùng rác (soft delete) — sản phẩm có thể khôi phục từ tab Thùng rác.
  const moveToTrash = async (product) => {
    if (
      !window.confirm(
        `Đưa "${product.title}" vào Thùng rác?\n\nSản phẩm sẽ ẩn khỏi website. Có thể khôi phục từ tab "🗑 Thùng rác".`
      )
    )
      return;
    setBusyId(product.id);
    try {
      const updated = await updateProductStatusApi(product.id, 'trash');
      setList((arr) => arr.map((p) => (p.id === product.id ? updated : p)));
      flashToast(`🗑 Đã đưa "${product.title}" vào Thùng rác`);
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleSaved = (savedProduct) => {
    setList((arr) => arr.map((p) => (p.id === savedProduct.id ? savedProduct : p)));
    flashToast(`✓ Đã cập nhật "${savedProduct.title}"`);
  };

  const filtered = useMemo(() => {
    // ProductManager KHÔNG hiển thị trash (xem ở tab Thùng rác riêng)
    let arr = list.filter((p) => p.status !== 'trash');
    // Status
    if (statusFilter !== 'all') {
      arr = arr.filter((p) => (p.status || 'active') === statusFilter);
    }
    // Source
    if (sourceFilter !== 'all') {
      arr = arr.filter((p) => (p.source || 'manual') === sourceFilter);
    }
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.id?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    // Sort
    const sorted = [...arr];
    switch (sort) {
      case 'old':
        sorted.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        break;
      case 'price-desc':
        sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'price-asc':
        sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'hot':
        sorted.sort((a, b) => {
          const aHot = a.badges?.includes('hot') ? 1 : 0;
          const bHot = b.badges?.includes('hot') ? 1 : 0;
          return bHot - aHot;
        });
        break;
      case 'new':
      default:
        sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return sorted;
  }, [list, statusFilter, sourceFilter, search, sort]);

  const counts = useMemo(
    () => ({
      all: list.length,
      active: list.filter((p) => (p.status || 'active') === 'active').length,
      hidden: list.filter((p) => p.status === 'hidden').length,
      manual: list.filter((p) => (p.source || 'manual') === 'manual').length,
      sheet: list.filter((p) => p.source === 'sheet').length,
    }),
    [list]
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-brand-ink-100 sm:p-5">
        <div className="grid gap-3">
          {/* Search */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-full bg-brand-ink-50 px-4 py-2">
              <span className="text-brand-ink-400">🔍</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên / id / tag..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-full border border-brand-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-orange-300"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button
                onClick={load}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-orange-600 ring-1 ring-brand-orange-200 hover:bg-brand-orange-50"
              >
                ↻ Reload
              </button>
            </div>
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

          {/* Source filter */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {SOURCE_FILTERS.map((f) => {
              const isActive = sourceFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setSourceFilter(f.key)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? 'border-transparent bg-brand-orange-500 text-white shadow-cta'
                      : 'border-brand-ink-200 bg-white text-brand-ink-700 hover:border-brand-orange-300'
                  }`}
                >
                  {f.label} ({f.key === 'all' ? list.length : counts[f.key]})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toast / Error */}
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
            ? 'Chưa có sản phẩm nào. Sang tab "Import" hoặc "Google Sheet" để thêm.'
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
              onDelete={() => moveToTrash(p)}
              onEdit={() => setEditing(p)}
            />
          ))}
        </div>
      )}

      {/* Edit modal */}
      <EditProductModal
        product={editing}
        onClose={() => setEditing(null)}
        onSaved={handleSaved}
      />
    </div>
  );
}

function ProductRow({ product, busy, onToggleStatus, onDelete, onEdit }) {
  const isHidden = product.status === 'hidden';
  const isSheet = product.source === 'sheet';
  return (
    <article
      className={`flex gap-3 rounded-2xl bg-white p-3 shadow-card ring-1 transition ${
        isHidden ? 'ring-amber-200 opacity-75' : 'ring-brand-ink-100'
      }`}
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
        <img
          src={product.images?.[0] || 'https://placehold.co/200x200/f1f5f9/64748b?text=?'}
          alt={product.title}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://placehold.co/200x200/fee2e2/991b1b?text=No+image';
          }}
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
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill status={product.status || 'active'} />
          <SourcePill source={product.source || 'manual'} />
          <PlatformBadge platform={product.platform} className="text-[10px]" />
        </div>

        {/* Title + meta */}
        <h3 className="line-clamp-2 font-semibold leading-snug">{product.title}</h3>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-brand-ink-500">
          <span>{CATEGORY_NAME[product.category] || product.category || '—'}</span>
          {product.createdAt && (
            <>
              <span>·</span>
              <span>📅 {formatDate(product.createdAt)}</span>
            </>
          )}
        </div>

        {/* Badges product (hot/bestseller) */}
        {(product.badges?.includes('hot') || product.badges?.includes('bestseller')) && (
          <div className="flex gap-1">
            {product.badges?.includes('hot') && (
              <span className="badge bg-brand-orange-500 text-white">🔥 HOT</span>
            )}
            {product.badges?.includes('bestseller') && (
              <span className="badge bg-gradient-to-r from-amber-500 to-brand-orange-500 text-white">
                👑 BEST
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-brand-orange-600">
            {product.price ? formatVND(product.price) : '—'}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-[10px] text-brand-ink-400 line-through">
              {formatVND(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Affiliate URL */}
        {product.affiliateUrl && (
          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener nofollow noreferrer"
            className="truncate text-[10px] text-brand-blue-600 hover:underline"
            title={product.affiliateUrl}
          >
            🔗 {product.affiliateUrl}
          </a>
        )}

        {/* Actions */}
        <div className="mt-1 flex flex-wrap gap-1.5">
          <button
            onClick={onEdit}
            disabled={busy}
            className="rounded-full bg-brand-blue-100 px-2.5 py-1 text-[11px] font-semibold text-brand-blue-700 transition hover:bg-brand-blue-200 disabled:opacity-50"
          >
            ✏️ Chỉnh sửa
          </button>
          <button
            onClick={onToggleStatus}
            disabled={busy}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-50 ${
              isHidden
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
            }`}
          >
            {isHidden ? '👁 Hiện lại' : '🙈 Ẩn'}
          </button>
          <button
            onClick={onDelete}
            disabled={busy}
            className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700 transition hover:bg-red-200 disabled:opacity-50"
            title="Đưa vào thùng rác (có thể khôi phục)"
          >
            🗑 Vào thùng rác
          </button>
        </div>
      </div>
    </article>
  );
}

function StatusPill({ status }) {
  if (status === 'hidden') {
    return <span className="badge bg-amber-100 text-amber-800">● HIDDEN</span>;
  }
  return <span className="badge bg-green-100 text-green-700">● ACTIVE</span>;
}

function SourcePill({ source }) {
  if (source === 'sheet') {
    return (
      <span className="badge bg-brand-blue-100 text-brand-blue-700" title="Import từ Google Sheet">
        📊 Sheet
      </span>
    );
  }
  return (
    <span className="badge bg-brand-ink-100 text-brand-ink-700" title="Thêm thủ công trong /admin">
      ✍️ Manual
    </span>
  );
}
