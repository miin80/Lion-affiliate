import { useEffect, useState } from 'react';
import { formatDate } from '../../utils/format';

/**
 * Generic Trash tab cho Videos / Collections / Blogs.
 * Props:
 *  - api: { listAdmin, setStatus, remove }
 *  - resourceName: 'video' | 'collection' | 'blog'
 *  - title: tên hiển thị
 *  - renderThumb(item): function return <img> hoặc element thumb
 *  - renderMeta(item): function return additional meta line
 */
export default function ResourceTrash({ api, resourceName, title, renderThumb, renderMeta }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const all = await api.listAdmin();
      setList(all.filter((it) => it.status === 'trash'));
    } catch (err) {
      setError(`Lỗi: ${err.message}`);
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

  const restore = async (item) => {
    setBusyId(item.id);
    try {
      await api.setStatus(item.id, 'hidden');
      setList((arr) => arr.filter((it) => it.id !== item.id));
      flashToast(`👁 Đã khôi phục "${item.title}" (status: hidden)`);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const permanentDelete = async (item) => {
    if (!window.confirm(`Bạn chắc chắn muốn xoá VĨNH VIỄN "${item.title}"?\n\nHành động này KHÔNG THỂ KHÔI PHỤC.`))
      return;
    setBusyId(item.id);
    try {
      await api.remove(item.id);
      setList((arr) => arr.filter((it) => it.id !== item.id));
      flashToast(`💥 Đã xoá vĩnh viễn "${item.title}"`);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const emptyTrash = async () => {
    if (!list.length) return;
    if (!window.confirm(`Xoá VĨNH VIỄN tất cả ${list.length} ${resourceName} trong thùng rác?\n\nKHÔNG thể khôi phục.`))
      return;
    setBusyId('all');
    try {
      for (const it of list) await api.remove(it.id);
      setList([]);
      flashToast(`💥 Đã dọn thùng rác`);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-brand-ink-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">🗑 {title}</h1>
          <p className="text-sm text-brand-ink-500">
            {resourceName} đã đưa vào thùng rác. Có thể khôi phục về "hidden" hoặc xoá vĩnh viễn.
          </p>
        </div>
        {list.length > 0 && (
          <button
            onClick={emptyTrash}
            disabled={busyId === 'all'}
            className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
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
          <p className="text-sm text-brand-ink-500">Thùng rác trống.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((item) => (
            <article
              key={item.id}
              className="flex gap-3 rounded-2xl bg-white p-3 opacity-75 shadow-card ring-1 ring-brand-ink-200"
            >
              {renderThumb && <div className="shrink-0">{renderThumb(item)}</div>}
              <div className="flex flex-1 flex-col gap-1 text-sm">
                <span className="badge w-fit bg-red-100 text-red-700">🗑 TRASH</span>
                <h3 className="line-clamp-2 font-semibold leading-snug">{item.title || item.name}</h3>
                <div className="text-[10px] text-brand-ink-500">
                  {item.trashedAt ? `Vào thùng rác: ${formatDate(item.trashedAt)}` : `Cập nhật: ${formatDate(item.updatedAt)}`}
                </div>
                {renderMeta && renderMeta(item)}
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => restore(item)}
                    disabled={busyId === item.id}
                    className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700 hover:bg-green-200 disabled:opacity-50"
                  >
                    ♻️ Khôi phục
                  </button>
                  <button
                    onClick={() => permanentDelete(item)}
                    disabled={busyId === item.id}
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
