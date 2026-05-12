import { useEffect, useState } from 'react';
import { blogsApi } from '../../services/resources';
import { fetchAdminProducts } from '../../services/api';

const EMPTY = {
  id: null, slug: '', title: '', excerpt: '', cover: '', author: 'Admin',
  publishedAt: new Date().toISOString().slice(0, 10),
  readTime: 5, tag: 'Review', productSlugs: [], content: '', status: 'active',
};

export default function BlogsManager() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ type: '', msg: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [bs, ps] = await Promise.all([
        blogsApi.listAdmin(),
        fetchAdminProducts().catch(() => []),
      ]);
      setItems(bs);
      setProducts(ps);
    } catch (err) { flash('error', err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const flash = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast({ type: '', msg: '' }), 2500);
  };

  const save = async () => {
    if (!editing.title?.trim() || !editing.slug?.trim()) return flash('error', 'Cần slug + tiêu đề');
    try {
      editing.id ? await blogsApi.update(editing.id, editing) : await blogsApi.save(editing);
      flash('success', '✓ Đã lưu bài viết');
      setEditing(null);
      load();
    } catch (err) { flash('error', err.message); }
  };
  const toggleStatus = async (item) => {
    try { await blogsApi.setStatus(item.id, item.status === 'active' ? 'hidden' : 'active'); load(); }
    catch (err) { flash('error', err.message); }
  };
  const remove = async (item) => {
    if (!window.confirm(`Xoá bài viết "${item.title}"?`)) return;
    try { await blogsApi.remove(item.id); load(); }
    catch (err) { flash('error', err.message); }
  };

  if (loading) return <div className="rounded-3xl bg-brand-ink-50 p-10 text-center text-sm">Đang tải...</div>;

  return (
    <div className="space-y-4">
      {toast.msg && (
        <div className={`rounded-2xl px-4 py-2.5 text-sm ring-1 ${
          toast.type === 'success' ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-red-50 text-red-700 ring-red-200'
        }`}>{toast.msg}</div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-brand-ink-500">{items.length} bài viết</div>
        <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary text-xs">
          ➕ Viết bài mới
        </button>
      </div>

      {editing && (
        <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-brand-ink-100">
          <h3 className="text-base font-extrabold">{editing.id ? '✏️ Sửa bài' : '➕ Bài mới'}</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Slug *">
              <input className="input-base" value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                placeholder="top-do-bep-2026" />
            </Field>
            <Field label="Tag">
              <input className="input-base" value={editing.tag}
                onChange={(e) => setEditing({ ...editing, tag: e.target.value })}
                placeholder="Top sản phẩm / Review / So sánh" />
            </Field>
            <Field label="Tiêu đề *">
              <input className="input-base" value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </Field>
            <Field label="Tác giả">
              <input className="input-base" value={editing.author}
                onChange={(e) => setEditing({ ...editing, author: e.target.value })} />
            </Field>
            <Field label="Cover URL">
              <input className="input-base" value={editing.cover}
                onChange={(e) => setEditing({ ...editing, cover: e.target.value })}
                placeholder="https://..." />
            </Field>
            <Field label="Phút đọc">
              <input type="number" className="input-base" value={editing.readTime}
                onChange={(e) => setEditing({ ...editing, readTime: Number(e.target.value) })} />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Tóm tắt (excerpt)">
              <textarea className="input-base resize-none" rows={2} value={editing.excerpt}
                onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Nội dung (Markdown đơn giản: ## heading, - list, **bold**)">
              <textarea className="input-base resize-y" rows={10} value={editing.content}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                placeholder="## Tiêu đề chính&#10;&#10;Đoạn văn..." />
            </Field>
          </div>
          <div className="mt-3">
            <label className="text-sm font-bold">Sản phẩm liên quan (hiển thị cuối bài)</label>
            <div className="mt-2 max-h-48 overflow-y-auto rounded-2xl border border-brand-ink-200 p-3">
              {products.length === 0 ? (
                <div className="text-xs text-brand-ink-500">Chưa có sản phẩm nào.</div>
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
          <div className="mt-4 flex gap-2">
            <button onClick={save} className="btn-primary text-sm">💾 Lưu bài</button>
            <button onClick={() => setEditing(null)} className="btn-ghost text-sm">Huỷ</button>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((b) => (
          <div key={b.id} className={`flex gap-3 rounded-2xl bg-white p-3 shadow-card ring-1 ${b.status === 'hidden' ? 'ring-amber-200 opacity-70' : 'ring-brand-ink-100'}`}>
            {b.cover && <img src={b.cover} alt="" className="h-20 w-32 shrink-0 rounded-lg object-cover" />}
            <div className="flex flex-1 flex-col gap-1 text-sm">
              <span className="badge w-fit bg-brand-orange-100 text-brand-orange-700">{b.tag}</span>
              <div className="line-clamp-2 font-semibold">{b.title}</div>
              <div className="text-[10px] text-brand-ink-500">
                {b.author} · {b.publishedAt?.slice(0, 10)} · {b.status}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                <button onClick={() => setEditing({ ...b })} className="rounded-full bg-brand-ink-100 px-2.5 py-1 text-[11px] font-semibold">✏️</button>
                <button onClick={() => toggleStatus(b)} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${b.status === 'hidden' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>
                  {b.status === 'hidden' ? '👁' : '🙈'}
                </button>
                <button onClick={() => remove(b)} className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700">🗑</button>
              </div>
            </div>
          </div>
        ))}
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
