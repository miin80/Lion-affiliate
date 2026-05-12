import { useEffect, useState } from 'react';
import { videosApi } from '../../services/resources';
import { fetchAdminProducts } from '../../services/api';

const EMPTY = {
  id: null,
  title: '',
  thumb: '',
  videoUrl: '',
  productId: '',
  affiliateUrl: '',
  views: '',
  duration: '',
  order: 0,
  status: 'active',
};

export default function VideoManager() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ type: '', msg: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [vs, ps] = await Promise.all([
        videosApi.listAdmin(),
        fetchAdminProducts().catch(() => []),
      ]);
      setItems(vs.sort((a, b) => (a.order ?? 999) - (b.order ?? 999)));
      setProducts(ps);
    } catch (err) {
      flash('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const flash = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast({ type: '', msg: '' }), 2500);
  };

  const startEdit = (item) => setEditing(item ? { ...item } : { ...EMPTY, order: items.length });
  const cancelEdit = () => setEditing(null);

  const save = async () => {
    if (!editing.title?.trim()) return flash('error', 'Cần nhập tiêu đề video');
    if (!editing.thumb?.trim()) return flash('error', 'Cần URL thumbnail');
    try {
      const saved = editing.id
        ? await videosApi.update(editing.id, editing)
        : await videosApi.save(editing);
      flash('success', `✓ Đã lưu "${saved.title}"`);
      setEditing(null);
      load();
    } catch (err) {
      flash('error', err.message);
    }
  };

  const toggleStatus = async (item) => {
    const next = item.status === 'active' ? 'hidden' : 'active';
    try {
      await videosApi.setStatus(item.id, next);
      load();
    } catch (err) {
      flash('error', err.message);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Xoá video "${item.title}"?`)) return;
    try {
      await videosApi.remove(item.id);
      load();
    } catch (err) {
      flash('error', err.message);
    }
  };

  if (loading) {
    return <div className="rounded-3xl bg-brand-ink-50 p-10 text-center text-sm text-brand-ink-500">Đang tải...</div>;
  }

  return (
    <div className="space-y-4">
      {toast.msg && (
        <div className={`rounded-2xl px-4 py-2.5 text-sm ring-1 ${
          toast.type === 'success' ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-red-50 text-red-700 ring-red-200'
        }`}>{toast.msg}</div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-brand-ink-500">{items.length} video</div>
        <button onClick={() => startEdit(null)} className="btn-primary text-xs">
          ➕ Thêm video mới
        </button>
      </div>

      {editing && (
        <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-brand-ink-100">
          <h3 className="text-base font-extrabold">
            {editing.id ? '✏️ Sửa video' : '➕ Thêm video mới'}
          </h3>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Tiêu đề video *">
              <input className="input-base" value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="Review nồi chiên không dầu 8L..." />
            </Field>
            <Field label="Số lượt xem hiển thị">
              <input className="input-base" value={editing.views}
                onChange={(e) => setEditing({ ...editing, views: e.target.value })}
                placeholder="128K" />
            </Field>
            <Field label="Thumbnail URL *" hint="Ảnh tỉ lệ 9:16 đẹp nhất">
              <input className="input-base" value={editing.thumb}
                onChange={(e) => setEditing({ ...editing, thumb: e.target.value })}
                placeholder="https://..." />
            </Field>
            <Field label="Video URL (link TikTok/YouTube)">
              <input className="input-base" value={editing.videoUrl}
                onChange={(e) => setEditing({ ...editing, videoUrl: e.target.value })}
                placeholder="https://www.tiktok.com/@.../video/..." />
            </Field>
            <Field label="Thời lượng">
              <input className="input-base" value={editing.duration}
                onChange={(e) => setEditing({ ...editing, duration: e.target.value })}
                placeholder="0:48" />
            </Field>
            <Field label="Thứ tự (số càng nhỏ càng lên đầu)">
              <input type="number" className="input-base" value={editing.order || 0}
                onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })} />
            </Field>
            <Field label="Sản phẩm liên quan (chọn từ danh sách)">
              <select className="input-base" value={editing.productId || ''}
                onChange={(e) => {
                  const product = products.find((p) => p.id === e.target.value);
                  setEditing({
                    ...editing,
                    productId: e.target.value,
                    productSlug: product?.slug || '',
                    affiliateUrl: product?.affiliateUrl || editing.affiliateUrl,
                  });
                }}>
                <option value="">— Không gắn —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </Field>
            <Field label="Affiliate link (override, tuỳ chọn)">
              <input className="input-base" value={editing.affiliateUrl}
                onChange={(e) => setEditing({ ...editing, affiliateUrl: e.target.value })}
                placeholder="Để trống = dùng affiliate URL của sản phẩm" />
            </Field>
          </div>

          {/* Preview giống VideoReels card */}
          {editing.thumb && (
            <div className="mt-4">
              <div className="text-xs font-bold uppercase tracking-wide text-brand-ink-500">
                Xem trước
              </div>
              <div className="mt-2 w-44 overflow-hidden rounded-2xl bg-black shadow-card">
                <div className="relative">
                  <img src={editing.thumb} alt="" className="aspect-[9/16] w-full object-cover opacity-90" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  {editing.views && (
                    <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">▶ {editing.views}</div>
                  )}
                  {editing.duration && (
                    <div className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold">{editing.duration}</div>
                  )}
                  <p className="absolute inset-x-2 bottom-2 line-clamp-2 text-xs font-bold text-white">{editing.title || '(Tiêu đề)'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button onClick={save} className="btn-primary text-sm">💾 Lưu</button>
            <button onClick={cancelEdit} className="btn-ghost text-sm">Huỷ</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-3xl bg-brand-ink-50 p-10 text-center text-sm text-brand-ink-500">
          Chưa có video — bấm "Thêm video mới" ở trên để thêm.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((v) => (
            <article key={v.id} className={`flex gap-3 rounded-2xl bg-white p-3 shadow-card ring-1 ${v.status === 'hidden' ? 'ring-amber-200 opacity-70' : 'ring-brand-ink-100'}`}>
              <img src={v.thumb} alt="" className="h-28 w-20 shrink-0 rounded-lg object-cover" />
              <div className="flex flex-1 flex-col gap-1 text-sm">
                <span className={`badge w-fit ${v.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>
                  ● {v.status === 'active' ? 'Đang hiển thị' : 'Đã ẩn'} · #{v.order ?? 0}
                </span>
                <div className="line-clamp-2 font-semibold">{v.title}</div>
                <div className="text-[11px] text-brand-ink-500">{v.views} · {v.duration}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  <button onClick={() => startEdit(v)} className="rounded-full bg-brand-ink-100 px-2.5 py-1 text-[11px] font-semibold hover:bg-brand-ink-200">✏️ Sửa</button>
                  <button onClick={() => toggleStatus(v)} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${v.status === 'hidden' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>
                    {v.status === 'hidden' ? '👁 Hiện' : '🙈 Ẩn'}
                  </button>
                  <button onClick={() => remove(v)} className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700">🗑 Xoá</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="text-sm font-bold">{label}</label>
      {hint && <div className="text-[11px] text-brand-ink-500">{hint}</div>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
