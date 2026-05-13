import { useEffect, useState } from 'react';
import { collectionsApi } from '../../services/resources';
import { fetchAdminProducts } from '../../services/api';
import CollectionPreview from './previews/CollectionPreview';
import DragSortable, { DragHandle } from './DragSortable';
import { ManagerCardListSkeleton } from '../Skeletons';
import { useFormDraft } from '../../hooks/useFormDraft';
import DraftBanner from './DraftBanner';
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

const EMPTY = {
  id: null, slug: '', title: '', emoji: '✨', cover: '', desc: '',
  productSlugs: [], order: 99, status: 'active',
};

export default function CollectionsManager() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ type: '', msg: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [cs, ps] = await Promise.all([
        collectionsApi.listAdmin(),
        fetchAdminProducts().catch(() => []),
      ]);
      setItems(cs.filter((c) => c.status !== 'trash').sort((a, b) => (a.order ?? 999) - (b.order ?? 999)));
      setProducts(ps);
    } catch (err) { flash('error', err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const safeTimeout = useSafeTimeout();
  const flash = (type, msg) => {
    setToast({ type, msg });
    safeTimeout(() => setToast({ type: '', msg: '' }), 2500);
  };

  const draftKey = `collection_${editing?.id || 'new'}`;
  const collDraft = useFormDraft(draftKey, editing, { enabled: Boolean(editing) });

  const save = async () => {
    if (!editing.title?.trim() || !editing.slug?.trim()) return flash('error', 'Cần slug + tiêu đề');
    try {
      editing.id ? await collectionsApi.update(editing.id, editing) : await collectionsApi.save(editing);
      flash('success', '✓ Đã lưu');
      collDraft.clearDraft();
      setEditing(null);
      load();
    } catch (err) { flash('error', err.message); }
  };
  const toggleStatus = async (item) => {
    try { await collectionsApi.setStatus(item.id, item.status === 'active' ? 'hidden' : 'active'); load(); }
    catch (err) { flash('error', err.message); }
  };
  const moveToTrash = async (item) => {
    if (!window.confirm(`Đưa "${item.title}" vào thùng rác?\n\nCó thể khôi phục từ tab "🗑 Thùng rác BST".`)) return;
    try {
      await collectionsApi.setStatus(item.id, 'trash');
      load();
      flash('success', `🗑 Đã đưa "${item.title}" vào thùng rác`);
    } catch (err) { flash('error', err.message); }
  };

  const handleReorder = async (newOrder) => {
    setItems(newOrder);
    try {
      await collectionsApi.reorder(newOrder.map((c, i) => ({ id: c.id, order: i })));
      flash('success', '✓ Đã sắp xếp lại bộ sưu tập');
    } catch (err) {
      flash('error', `Lỗi: ${err.message}`);
      load();
    }
  };

  if (loading) return <ManagerCardListSkeleton count={4} columns={2} />;

  return (
    <div className="space-y-4">
      {toast.msg && (
        <div className={`rounded-2xl px-4 py-2.5 text-sm ring-1 ${
          toast.type === 'success' ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-red-50 text-red-700 ring-red-200'
        }`}>{toast.msg}</div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-brand-ink-500">{items.length} bộ sưu tập</div>
        <button onClick={() => setEditing({ ...EMPTY, order: items.length })} className="btn-primary text-xs">
          ➕ Thêm bộ sưu tập
        </button>
      </div>

      {editing && (
        <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-brand-ink-100">
          <h3 className="text-base font-extrabold">{editing.id ? '✏️ Sửa' : '➕ Thêm'} bộ sưu tập</h3>
          {collDraft.hasSavedDraft && (
            <div className="mt-3">
              <DraftBanner
                savedAt={collDraft.savedAt}
                onRestore={() => {
                  const saved = collDraft.loadSavedDraft();
                  if (saved) setEditing(saved);
                  collDraft.dismissBanner();
                }}
                onDiscard={collDraft.clearDraft}
              />
            </div>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Slug *">
              <input className="input-base" value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                placeholder="do-hot-tiktok" />
            </Field>
            <Field label="Tiêu đề *">
              <input className="input-base" value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="Đồ hot trên TikTok" />
            </Field>
            <Field label="Emoji">
              <input className="input-base" value={editing.emoji}
                onChange={(e) => setEditing({ ...editing, emoji: e.target.value })}
                placeholder="🎵" />
            </Field>
            <Field label="Cover URL">
              <input className="input-base" value={editing.cover}
                onChange={(e) => setEditing({ ...editing, cover: e.target.value })}
                placeholder="https://..." />
            </Field>
            <Field label="Thứ tự">
              <input type="number" className="input-base" value={editing.order || 0}
                onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })} />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Mô tả ngắn">
              <textarea className="input-base resize-none" rows={2} value={editing.desc}
                onChange={(e) => setEditing({ ...editing, desc: e.target.value })} />
            </Field>
          </div>
          <div className="mt-3">
            <label className="text-sm font-bold">Sản phẩm trong bộ sưu tập</label>
            <p className="text-[11px] text-brand-ink-500">Tick các sản phẩm cần đưa vào</p>
            <div className="mt-2 max-h-60 overflow-y-auto rounded-2xl border border-brand-ink-200 p-3">
              {products.length === 0 ? (
                <div className="text-xs text-brand-ink-500">Chưa có sản phẩm nào. Hãy import trước.</div>
              ) : products.map((p) => {
                const slugOrId = p.slug || p.id;
                const checked = editing.productSlugs?.includes(slugOrId);
                return (
                  <label key={p.id} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
                    <input type="checkbox" checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...(editing.productSlugs || []), slugOrId]
                          : (editing.productSlugs || []).filter((s) => s !== slugOrId);
                        setEditing({ ...editing, productSlugs: next });
                      }} />
                    <span className="line-clamp-1">{p.title}</span>
                  </label>
                );
              })}
            </div>
          </div>
          {/* Realtime preview */}
          <div className="mt-4">
            <CollectionPreview collection={editing} />
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={save} className="btn-primary text-sm">💾 Lưu</button>
            <button onClick={() => setEditing(null)} className="btn-ghost text-sm">Huỷ</button>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="rounded-2xl bg-blue-50 px-3 py-2 text-[11px] text-blue-700 ring-1 ring-blue-200">
          💡 Kéo icon <span className="rounded bg-white px-1.5 py-0.5 font-bold">⋮⋮</span> để sắp xếp lại thứ tự bộ sưu tập.
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <DragSortable items={items} onReorder={handleReorder} layout="grid"
          renderItem={(c, dragProps) => (
            <div className={`flex min-w-0 gap-3 rounded-2xl bg-white p-3 shadow-card ring-1 ${c.status === 'hidden' ? 'ring-amber-200 opacity-70' : 'ring-brand-ink-100'}`}>
              <DragHandle dragProps={dragProps} className="self-start" />
              {c.cover && <img src={c.cover} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-lg object-cover" />}
              <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                <div className="break-words font-semibold" title={c.title}>{c.emoji} {c.title}</div>
                <div className="text-[11px] text-brand-ink-500">{c.productSlugs?.length || 0} sản phẩm · #{c.order ?? 0} · {c.status}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  <button onClick={() => setEditing({ ...c })} className="rounded-full bg-brand-ink-100 px-2.5 py-1 text-[11px] font-semibold">✏️ Sửa</button>
                  <button onClick={() => toggleStatus(c)} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${c.status === 'hidden' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>
                    {c.status === 'hidden' ? '👁 Hiện' : '🙈 Ẩn'}
                  </button>
                  <button onClick={() => moveToTrash(c)} className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700" title="Vào thùng rác">🗑</button>
                </div>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-bold">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
