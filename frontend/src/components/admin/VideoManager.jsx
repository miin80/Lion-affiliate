import { useEffect, useState } from 'react';
import { videosApi } from '../../services/resources';
import { fetchAdminProducts } from '../../services/api';
import VideoPreview from './previews/VideoPreview';
import DragSortable, { DragHandle } from './DragSortable';
import { ManagerCardListSkeleton } from '../Skeletons';
import { useFormDraft } from '../../hooks/useFormDraft';
import DraftBanner from './DraftBanner';
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

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
      // Filter out trash — chỉ hiện trong VideoTrash tab
      setItems(vs.filter((v) => v.status !== 'trash').sort((a, b) => (a.order ?? 999) - (b.order ?? 999)));
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

  const safeTimeout = useSafeTimeout();
  const flash = (type, msg) => {
    setToast({ type, msg });
    safeTimeout(() => setToast({ type: '', msg: '' }), 2500);
  };

  const startEdit = (item) => setEditing(item ? { ...item } : { ...EMPTY, order: items.length });
  const cancelEdit = () => setEditing(null);

  // Auto-save draft theo video.id (hoặc 'new')
  const draftKey = `video_${editing?.id || 'new'}`;
  const videoDraft = useFormDraft(draftKey, editing, { enabled: Boolean(editing) });

  const save = async () => {
    if (!editing.title?.trim()) return flash('error', 'Cần nhập tiêu đề video');
    if (!editing.thumb?.trim()) return flash('error', 'Cần URL thumbnail');
    try {
      const saved = editing.id
        ? await videosApi.update(editing.id, editing)
        : await videosApi.save(editing);
      flash('success', `✓ Đã lưu "${saved.title}"`);
      videoDraft.clearDraft();
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

  const moveToTrash = async (item) => {
    if (!window.confirm(`Đưa video "${item.title}" vào thùng rác?\n\nCó thể khôi phục từ tab "🗑 Thùng rác Video".`)) return;
    try {
      await videosApi.setStatus(item.id, 'trash');
      load();
      flash('success', `🗑 Đã đưa "${item.title}" vào thùng rác`);
    } catch (err) {
      flash('error', err.message);
    }
  };

  const handleReorder = async (newOrder) => {
    setItems(newOrder); // optimistic
    try {
      await videosApi.reorder(newOrder.map((v, i) => ({ id: v.id, order: i })));
      flash('success', '✓ Đã sắp xếp lại video');
    } catch (err) {
      flash('error', `Lỗi: ${err.message}`);
      load(); // rollback
    }
  };

  if (loading) {
    return <ManagerCardListSkeleton count={4} columns={2} />;
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

          {videoDraft.hasSavedDraft && (
            <div className="mt-3">
              <DraftBanner
                savedAt={videoDraft.savedAt}
                onRestore={() => {
                  const saved = videoDraft.loadSavedDraft();
                  if (saved) setEditing(saved);
                  videoDraft.dismissBanner();
                }}
                onDiscard={videoDraft.clearDraft}
              />
            </div>
          )}

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

          {/* Realtime preview với switch Desktop/Mobile */}
          <div className="mt-4">
            <VideoPreview video={editing} />
          </div>

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
        <div className="space-y-3">
          <div className="rounded-2xl bg-blue-50 px-3 py-2 text-[11px] text-blue-700 ring-1 ring-blue-200">
            💡 Kéo icon <span className="inline-block rounded bg-white px-1.5 py-0.5 font-bold">⋮⋮</span> bên trái card để sắp xếp lại thứ tự video.
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DragSortable items={items} onReorder={handleReorder} layout="grid"
              renderItem={(v, dragProps) => (
                <article className={`flex gap-3 rounded-2xl bg-white p-3 shadow-card ring-1 ${v.status === 'hidden' ? 'ring-amber-200 opacity-70' : 'ring-brand-ink-100'}`}>
                  <DragHandle dragProps={dragProps} className="self-start" />
                  <img src={v.thumb} alt="" loading="lazy" className="h-28 w-20 shrink-0 rounded-lg object-cover" />
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
                      <button onClick={() => moveToTrash(v)} className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700" title="Đưa vào thùng rác (có thể khôi phục)">🗑 Thùng rác</button>
                    </div>
                  </div>
                </article>
              )}
            />
          </div>
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
