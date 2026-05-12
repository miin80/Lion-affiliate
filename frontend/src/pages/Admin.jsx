import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Seo from '../components/Seo';
import PlatformBadge from '../components/PlatformBadge';
import ProductCard from '../components/ProductCard';
import MediaListEditor from '../components/admin/MediaListEditor';
import TagsInput from '../components/admin/TagsInput';
import ProductManager from '../components/admin/ProductManager';
import SettingsManager from '../components/admin/SettingsManager';
import VideoManager from '../components/admin/VideoManager';
import CategoriesManager from '../components/admin/CategoriesManager';
import CollectionsManager from '../components/admin/CollectionsManager';
import BlogsManager from '../components/admin/BlogsManager';
import GoogleSheetManager from '../components/admin/GoogleSheetManager';
import { detectPlatform } from '../config/affiliate';
import { importProductApi, saveProductApi } from '../services/api';
import { logout, getUser } from '../services/auth';
import { formatVND } from '../utils/format';
import { CATEGORIES } from '../data/categories';

const EMPTY = {
  sourceUrl: '',         // KHÔNG render thành link click - chỉ để scrape
  affiliateUrl: '',      // Link khách bấm mua
  title: '',
  description: '',
  price: '',
  originalPrice: '',
  images: [],
  videos: [],
  category: 'gia-dung',
  tags: [],
  rating: 4.8,
  badges: ['reviewed'],
  isHot: false,
};

const BADGE_OPTIONS = [
  { key: 'reviewed', label: '✓ Đã review' },
  { key: 'hot', label: '🔥 Hot deal' },
  { key: 'bestseller', label: '👑 Best seller' },
  { key: 'new', label: '🆕 Mới' },
  { key: 'deal', label: '💰 Deal hot' },
  { key: 'featured', label: '⭐ Nổi bật' },
];

export default function Admin() {
  const navigate = useNavigate();
  const user = getUser();
  const [tab, setTab] = useState('import'); // 'import' | 'manage' | 'settings'
  const [draft, setDraft] = useState(EMPTY);

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [success, setSuccess] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const platform = draft.sourceUrl ? detectPlatform(draft.sourceUrl) : null;

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const toggleBadge = (key) =>
    update({
      badges: draft.badges.includes(key)
        ? draft.badges.filter((b) => b !== key)
        : [...draft.badges, key],
    });

  const handleImport = async () => {
    setError('');
    setWarning('');
    setSuccess('');
    setPreviewOpen(false);
    if (!draft.sourceUrl.trim()) {
      setError('Vui lòng dán link gốc sản phẩm (Source URL).');
      return;
    }
    if (!draft.affiliateUrl.trim()) {
      setError('Vui lòng dán link affiliate (link khách bấm mua).');
      return;
    }
    setImporting(true);
    try {
      // POST /api/import-product { sourceUrl, affiliateUrl } → { ok, product, fallback }
      const resp = await importProductApi(
        draft.sourceUrl.trim(),
        draft.affiliateUrl.trim()
      );
      const p = resp.product || {};
      const merged = {
        ...draft,
        title: p.title || draft.title,
        description: p.description || draft.description,
        price: p.price || draft.price || '',
        originalPrice: p.originalPrice || draft.originalPrice || '',
        images: p.images?.length ? p.images : draft.images,
        videos: p.videos?.length ? p.videos : draft.videos,
      };
      setDraft(merged);
      setPreviewOpen(true);

      const missing = [];
      if (!p.title) missing.push('tên');
      if (!p.images?.length) missing.push('ảnh');
      if (!p.price) missing.push('giá');
      if (missing.length > 0 || resp.fallback) {
        setWarning(
          `Không tự lấy đủ dữ liệu: thiếu ${missing.join(', ') || 'một số trường'}. Vui lòng nhập / sửa thủ công bên dưới — bạn vẫn lưu sản phẩm được.`
        );
      }
    } catch (err) {
      setError(
        `Không kết nối được backend (${err.message}). Bạn vẫn có thể nhập thông tin sản phẩm hoàn toàn thủ công bên dưới.`
      );
      setPreviewOpen(true);
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    if (!draft.affiliateUrl.trim()) {
      setError('Bắt buộc nhập link affiliate (link khách sẽ bấm mua).');
      return;
    }
    if (!draft.title.trim()) {
      setError('Bắt buộc nhập tên sản phẩm.');
      return;
    }
    if (!draft.images.length) {
      setError('Bắt buộc có ít nhất 1 ảnh (nhập URL hoặc dùng auto-fetch).');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...draft,
        price: Number(draft.price) || null,
        originalPrice: Number(draft.originalPrice) || null,
        rating: Number(draft.rating) || 0,
        platform: platform?.key || 'other',
      };
      const saved = await saveProductApi(payload);
      setSuccess(`✓ Đã lưu "${saved.title}". Sang tab "Quản lý sản phẩm" để xem/ẩn/xoá.`);
      setDraft(EMPTY);
      setPreviewOpen(false);
    } catch (err) {
      setError(`Không lưu được: ${err.message}. Hãy đảm bảo backend đang chạy (npm run dev trong backend/).`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Seo title="Quản trị" />
      <section className="container-page mt-6 sm:mt-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">⚙️ Quản trị</h1>
            <p className="mt-1 text-sm text-brand-ink-500">
              Quản lý sản phẩm, cài đặt website — không cần sửa code.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {user && (
              <span className="hidden text-xs text-brand-ink-500 sm:inline">
                👤 {user.username}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
            >
              🚪 Đăng xuất
            </button>
          </div>
        </div>

        {/* TAB NAV */}
        <div className="mt-5 -mx-4 flex gap-1 overflow-x-auto px-4 scrollbar-hide sm:mx-0 sm:px-0">
          <div className="inline-flex shrink-0 gap-1 rounded-full bg-brand-ink-100 p-1">
            <TabButton active={tab === 'import'} onClick={() => setTab('import')}>📥 Import</TabButton>
            <TabButton active={tab === 'manage'} onClick={() => setTab('manage')}>📦 Sản phẩm</TabButton>
            <TabButton active={tab === 'videos'} onClick={() => setTab('videos')}>🎬 Video</TabButton>
            <TabButton active={tab === 'collections'} onClick={() => setTab('collections')}>📚 Bộ sưu tập</TabButton>
            <TabButton active={tab === 'categories'} onClick={() => setTab('categories')}>🏷 Danh mục</TabButton>
            <TabButton active={tab === 'blogs'} onClick={() => setTab('blogs')}>📝 Blog</TabButton>
            <TabButton active={tab === 'sheet'} onClick={() => setTab('sheet')}>📊 Google Sheet</TabButton>
            <TabButton active={tab === 'settings'} onClick={() => setTab('settings')}>⚙️ Cài đặt</TabButton>
          </div>
        </div>

        {tab === 'manage' && <div className="mt-6"><ProductManager /></div>}
        {tab === 'videos' && <div className="mt-6"><VideoManager /></div>}
        {tab === 'collections' && <div className="mt-6"><CollectionsManager /></div>}
        {tab === 'categories' && <div className="mt-6"><CategoriesManager /></div>}
        {tab === 'blogs' && <div className="mt-6"><BlogsManager /></div>}
        {tab === 'sheet' && <div className="mt-6"><GoogleSheetManager /></div>}
        {tab === 'settings' && <div className="mt-6"><SettingsManager /></div>}

        {tab === 'import' && (
        <>
        <div className="mt-3 rounded-2xl bg-brand-orange-50 p-4 text-sm ring-1 ring-brand-orange-200">
          <div className="font-bold text-brand-orange-700">⚡ Quan trọng</div>
          <ul className="mt-1 space-y-0.5 text-brand-ink-700">
            <li>• <strong>Source URL</strong>: chỉ để scrape data (ảnh, tên, giá). Không bao giờ hiển thị thành link.</li>
            <li>• <strong>Affiliate URL</strong>: gắn vào tất cả nút "Mua ngay" — bạn được tính hoa hồng.</li>
          </ul>
        </div>

        {/* FORM */}
        <div className="mt-6 rounded-3xl bg-white p-5 shadow-card ring-1 ring-brand-ink-100 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="🔗 Product Source URL (lấy data)"
              hint="VD: https://shopee.vn/product/12345/67890"
            >
              <input
                type="url"
                value={draft.sourceUrl}
                onChange={(e) => update({ sourceUrl: e.target.value })}
                placeholder="https://shopee.vn/..."
                className="input-base"
              />
              {platform && (
                <div className="mt-1.5 flex items-center gap-2 text-xs">
                  <PlatformBadge platform={platform.key} />
                  <span className="text-brand-ink-500">{platform.name} detected</span>
                </div>
              )}
            </Field>

            <Field
              label="💰 My Affiliate URL (link mua)"
              hint="Link đã có mã affiliate của BẠN. Khách bấm = bạn ăn hoa hồng."
            >
              <input
                type="url"
                value={draft.affiliateUrl}
                onChange={(e) => update({ affiliateUrl: e.target.value })}
                placeholder="https://s.shopee.vn/aff_xxx hoặc deeplink ECOMOBI/AccessTrade..."
                className="input-base"
              />
            </Field>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleImport}
              disabled={importing}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {importing ? '⏳ Đang lấy dữ liệu...' : '📥 Import dữ liệu sản phẩm'}
            </button>
          </div>

          {error && <Alert type="error">{error}</Alert>}
          {warning && <Alert type="warning">{warning}</Alert>}
          {success && <Alert type="success">{success}</Alert>}
        </div>

        {/* EDITABLE PREVIEW */}
        {previewOpen && (
          <div className="mt-6 rounded-3xl bg-white p-5 shadow-card ring-1 ring-brand-ink-100 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">📝 Chỉnh sửa & xem trước</h2>
              <span className="text-xs text-brand-ink-500">Sửa tay nếu thiếu trường nào</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tên sản phẩm *">
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => update({ title: e.target.value })}
                  className="input-base"
                  placeholder="Túi giấy lau tay siêu thấm 100 tờ..."
                />
              </Field>
              <Field label="Danh mục *">
                <select
                  value={draft.category}
                  onChange={(e) => update({ category: e.target.value })}
                  className="input-base"
                >
                  {CATEGORIES.filter((c) => c.slug !== 'all' && c.slug !== 'deal').map((c) => (
                    <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Giá (VND)">
                <input
                  type="number"
                  value={draft.price}
                  onChange={(e) => update({ price: e.target.value })}
                  className="input-base"
                  placeholder="159000"
                />
                {draft.price > 0 && (
                  <div className="mt-1 text-xs text-brand-orange-600">
                    Hiển thị: {formatVND(Number(draft.price))}
                  </div>
                )}
              </Field>
              <Field label="Giá gốc (gạch ngang)">
                <input
                  type="number"
                  value={draft.originalPrice}
                  onChange={(e) => update({ originalPrice: e.target.value })}
                  className="input-base"
                  placeholder="290000"
                />
              </Field>
              <Field label="Rating (0-5)">
                <input
                  type="number"
                  min="0" max="5" step="0.1"
                  value={draft.rating}
                  onChange={(e) => update({ rating: e.target.value })}
                  className="input-base"
                />
              </Field>
              <div>
                <TagsInput value={draft.tags} onChange={(v) => update({ tags: v })} />
              </div>
            </div>

            <div className="mt-4">
              <Field label="Mô tả ngắn">
                <textarea
                  value={draft.description}
                  onChange={(e) => update({ description: e.target.value })}
                  rows={3}
                  className="input-base resize-none"
                  placeholder="Mô tả 1-2 câu, sẽ hiển thị dưới tên sản phẩm..."
                />
              </Field>
            </div>

            <div className="mt-4">
              <MediaListEditor
                label="🖼️ Ảnh sản phẩm * (ảnh đầu = cover)"
                type="image"
                value={draft.images}
                onChange={(v) => update({ images: v })}
                placeholder="Dán URL ảnh (https://...)"
              />
            </div>

            <div className="mt-4">
              <MediaListEditor
                label="🎬 Video sản phẩm (tuỳ chọn)"
                type="video"
                value={draft.videos}
                onChange={(v) => update({ videos: v })}
                placeholder="Dán URL video MP4 (https://...mp4)"
              />
            </div>

            <div className="mt-4">
              <label className="text-sm font-bold">Badges</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {BADGE_OPTIONS.map((opt) => {
                  const on = draft.badges.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => toggleBadge(opt.key)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        on
                          ? 'border-transparent bg-brand-ink-900 text-white'
                          : 'border-brand-ink-200 bg-white text-brand-ink-700 hover:border-brand-orange-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live preview card */}
            <div className="mt-6 rounded-2xl bg-brand-ink-50 p-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-ink-500">
                Xem trước card trên website
              </div>
              <div className="grid max-w-xs">
                <ProductCard
                  product={{
                    id: 'preview',
                    slug: 'preview',
                    title: draft.title || '(Tên sản phẩm)',
                    shortDesc: draft.description?.slice(0, 80) || '',
                    price: Number(draft.price) || 0,
                    originalPrice: Number(draft.originalPrice) || 0,
                    rating: Number(draft.rating) || 0,
                    reviewCount: 0,
                    sold: 0,
                    images: draft.images.length ? draft.images : ['https://placehold.co/600x600/f1f5f9/64748b?text=No+image'],
                    video: draft.videos[0] || null,
                    affiliateUrl: draft.affiliateUrl || '#',
                    sourceUrl: draft.sourceUrl,
                    platform: platform?.key || 'other',
                    badges: draft.badges,
                  }}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
                {saving ? '⏳ Đang lưu...' : '💾 Lưu sản phẩm'}
              </button>
              <button
                onClick={() => {
                  setDraft(EMPTY);
                  setPreviewOpen(false);
                  setError('');
                  setWarning('');
                }}
                className="btn-ghost text-sm"
              >
                Huỷ
              </button>
            </div>
          </div>
        )}

        </>
        )}
      </section>
    </>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-white text-brand-ink-900 shadow-soft'
          : 'text-brand-ink-500 hover:text-brand-ink-700'
      }`}
    >
      {children}
    </button>
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

function Alert({ type, children }) {
  const cls = {
    error: 'bg-red-50 text-red-700 ring-red-200',
    warning: 'bg-amber-50 text-amber-800 ring-amber-200',
    success: 'bg-green-50 text-green-700 ring-green-200',
  }[type];
  return (
    <div className={`mt-3 rounded-xl px-4 py-2.5 text-sm ring-1 ${cls}`}>{children}</div>
  );
}

