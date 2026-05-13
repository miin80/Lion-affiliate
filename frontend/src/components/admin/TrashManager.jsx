import { useEffect, useState } from 'react';
import {
  fetchAdminProducts,
  updateProductStatusApi,
  deleteProductApi,
} from '../../services/api';
import { formatVND, formatDate } from '../../utils/format';
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

export default function TrashManager() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const all = await fetchAdminProducts();
      setList(all.filter((p) => p.status === 'trash'));
    } catch (err) {
      setError(`Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const safeTimeout = useSafeTimeout();
  const flashToast = (msg) => {
    setToast(msg);
    safeTimeout(() => setToast(''), 2800);
  };

  const restore = async (product) => {
    setBusyId(product.id);
    try {
      await updateProductStatusApi(product.id, 'hidden');
      setList((arr) => arr.filter((p) => p.id !== product.id));
      flashToast(`👁 Đã khôi phục "${product.title}" (status: hidden — chưa hiện trên web)`);
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const permanentDelete = async (product) => {
    if (
      !window.confirm(
        `Bạn chắc chắn muốn xoá VĨNH VIỄN "${product.title}"?\n\nHành động này KHÔNG THỂ KHÔI PHỤC.\nSản phẩm sẽ bị xoá hẳn khỏi products.json.`
      )
    )
      return;
    setBusyId(product.id);
    try {
      await deleteProductApi(product.id);
      setList((arr) => arr.filter((p) => p.id !== product.id));
      flashToast(`💥 Đã xoá vĩnh viễn "${product.title}"`);
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const emptyTrash = async () => {
    if (!list.length) return;
    if (
      !window.confirm(
        `Xoá VĨNH VIỄN tất cả ${list.length} sản phẩm trong Thùng rác?\n\nKHÔNG thể khôi phục.`
      )
    )
      return;
    setBusyId('all');
    try {
      for (const p of list) {
        await deleteProductApi(p.id);
      }
      setList([]);
      flashToast(`💥 Đã dọn thùng rác (${list.length} sản phẩm)`);
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-brand-ink-50 p-10 text-center text-sm text-brand-ink-500">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">🗑 Thùng rác</h1>
          <p className="text-sm text-brand-ink-500">
            Sản phẩm đã đưa vào thùng rác. Có thể <strong>khôi phục</strong> (chuyển sang
            "Đã ẩn") hoặc <strong>xoá vĩnh viễn</strong>.
          </p>
        </div>
        {list.length > 0 && (
          <button
            onClick={emptyTrash}
            disabled={busyId === 'all'}
            className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-cta hover:bg-red-700 disabled:opacity-50"
          >
            💥 Dọn thùng rác ({list.length})
          </button>
        )}
      </div>

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

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-brand-ink-50 p-10 text-center">
          <div className="text-5xl">✨</div>
          <p className="text-sm text-brand-ink-500">
            Thùng rác trống. Sản phẩm bị xoá sẽ xuất hiện ở đây.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((p) => (
            <article
              key={p.id}
              className="flex min-w-0 gap-3 rounded-2xl bg-white p-3 opacity-75 shadow-card ring-1 ring-brand-ink-200"
            >
              <img
                src={p.images?.[0] || 'https://placehold.co/200x200/f1f5f9/64748b?text=?'}
                alt={p.title}
                loading="lazy"
                className="h-24 w-24 shrink-0 rounded-xl object-cover grayscale"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/200x200/fee2e2/991b1b?text=No+image';
                }}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                <span className="badge w-fit bg-red-100 text-red-700">🗑 TRASH</span>
                <h3 className="line-clamp-2 break-words font-semibold leading-snug" title={p.title}>{p.title}</h3>
                <div className="text-[10px] text-brand-ink-500">
                  {p.trashedAt
                    ? `Vào thùng rác: ${formatDate(p.trashedAt)}`
                    : `Cập nhật: ${formatDate(p.updatedAt)}`}
                </div>
                <div className="font-bold text-brand-ink-500">
                  {p.price ? formatVND(p.price) : '—'}
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => restore(p)}
                    disabled={busyId === p.id}
                    className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700 hover:bg-green-200 disabled:opacity-50"
                  >
                    ♻️ Khôi phục
                  </button>
                  <button
                    onClick={() => permanentDelete(p)}
                    disabled={busyId === p.id}
                    className="rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    💥 Xoá vĩnh viễn
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
