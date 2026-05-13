import { useEffect, useState } from 'react';
import { categoriesApi } from '../../services/resources';
import DragSortable, { DragHandle } from './DragSortable';
import { ManagerCardListSkeleton } from '../Skeletons';
import { useSafeTimeout } from '../../hooks/useSafeTimeout';

const EMPTY = { id: null, slug: '', name: '', icon: '✨', order: 99, status: 'active' };

export default function CategoriesManager() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ type: '', msg: '' });

  const load = async () => {
    setLoading(true);
    try {
      const data = await categoriesApi.listAdmin();
      setItems(data.filter((c) => c.status !== 'trash').sort((a, b) => (a.order ?? 999) - (b.order ?? 999)));
    } catch (err) {
      flash('error', err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const safeTimeout = useSafeTimeout();
  const flash = (type, msg) => {
    setToast({ type, msg });
    safeTimeout(() => setToast({ type: '', msg: '' }), 2500);
  };

  const save = async () => {
    if (!editing.name?.trim() || !editing.slug?.trim()) return flash('error', 'Cần slug + tên');
    try {
      editing.id
        ? await categoriesApi.update(editing.id, editing)
        : await categoriesApi.save(editing);
      flash('success', '✓ Đã lưu');
      setEditing(null);
      load();
    } catch (err) { flash('error', err.message); }
  };

  const toggleStatus = async (item) => {
    try { await categoriesApi.setStatus(item.id, item.status === 'active' ? 'hidden' : 'active'); load(); }
    catch (err) { flash('error', err.message); }
  };
  const moveToTrash = async (item) => {
    if (!window.confirm(`Đưa danh mục "${item.name}" vào thùng rác?`)) return;
    try {
      await categoriesApi.setStatus(item.id, 'trash');
      load();
      flash('success', `🗑 Đã đưa "${item.name}" vào thùng rác`);
    } catch (err) { flash('error', err.message); }
  };

  const handleReorder = async (newOrder) => {
    setItems(newOrder);
    try {
      await categoriesApi.reorder(newOrder.map((c, i) => ({ id: c.id, order: i })));
      flash('success', '✓ Đã sắp xếp lại danh mục');
    } catch (err) {
      flash('error', err.message);
      load();
    }
  };

  if (loading) return <ManagerCardListSkeleton count={6} columns={2} />;

  return (
    <div className="space-y-4">
      {toast.msg && (
        <div className={`rounded-2xl px-4 py-2.5 text-sm ring-1 ${
          toast.type === 'success' ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-red-50 text-red-700 ring-red-200'
        }`}>{toast.msg}</div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-brand-ink-500">{items.length} danh mục</div>
        <button onClick={() => setEditing({ ...EMPTY, order: items.length })} className="btn-primary text-xs">
          ➕ Thêm danh mục
        </button>
      </div>

      {editing && (
        <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-brand-ink-100">
          <h3 className="text-base font-extrabold">
            {editing.id ? '✏️ Sửa danh mục' : '➕ Thêm danh mục'}
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Slug (không dấu, kebab-case) *">
              <input className="input-base" value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                placeholder="do-bep" />
            </Field>
            <Field label="Tên hiển thị *">
              <input className="input-base" value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="Đồ bếp" />
            </Field>
            <Field label="Icon (emoji)">
              <input className="input-base" value={editing.icon}
                onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                placeholder="🍳" />
            </Field>
            <Field label="Thứ tự (số càng nhỏ càng lên đầu)">
              <input type="number" className="input-base" value={editing.order || 0}
                onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })} />
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={save} className="btn-primary text-sm">💾 Lưu</button>
            <button onClick={() => setEditing(null)} className="btn-ghost text-sm">Huỷ</button>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="rounded-2xl bg-blue-50 px-3 py-2 text-[11px] text-blue-700 ring-1 ring-blue-200">
          💡 Kéo icon <span className="rounded bg-white px-1.5 py-0.5 font-bold">⋮⋮</span> để sắp xếp lại thứ tự danh mục.
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <DragSortable items={items} onReorder={handleReorder} layout="grid"
          renderItem={(c, dragProps) => (
          <div className={`flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card ring-1 ${c.status === 'hidden' ? 'ring-amber-200 opacity-70' : 'ring-brand-ink-100'}`}>
            <DragHandle dragProps={dragProps} />
            <span className="text-2xl">{c.icon}</span>
            <div className="flex-1 text-sm">
              <div className="font-semibold">{c.name}</div>
              <div className="text-[10px] text-brand-ink-500">{c.slug} · #{c.order ?? 0} · {c.status}</div>
            </div>
            <button onClick={() => setEditing({ ...c })} className="rounded-full bg-brand-ink-100 px-2.5 py-1 text-[11px] font-semibold">✏️</button>
            <button onClick={() => toggleStatus(c)} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${c.status === 'hidden' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>
              {c.status === 'hidden' ? '👁' : '🙈'}
            </button>
            <button onClick={() => moveToTrash(c)} className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700" title="Vào thùng rác">🗑</button>
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
