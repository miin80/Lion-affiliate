import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PlatformBadge from '../PlatformBadge';
import ProductCard from '../ProductCard';
import MediaListEditor from './MediaListEditor';
import TagsInput from './TagsInput';
import { detectPlatform } from '../../config/affiliate';
import { importProductApi, saveProductApi } from '../../services/api';
import { formatVND } from '../../utils/format';
import { CATEGORIES } from '../../data/categories';
import { parseShopeePriceText } from '../../utils/parseShopeePrice';

const EMPTY = {
  sourceUrl: '',
  affiliateUrl: '',
  title: '',
  description: '',
  price: '',
  originalPrice: '',
  priceMin: '',
  priceMax: '',
  oldPriceMin: '',
  oldPriceMax: '',
  discountPercent: '',
  soldText: '',
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

/**
 * ImportPanel — flow import 1 sản phẩm affiliate qua scrape Source URL.
 * Tách từ Admin.jsx khi refactor sang route-based navigation.
 */
export default function ImportPanel() {
  const [draft, setDraft] = useState(EMPTY);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Bookmarklet auto-fill: nếu có ?prefill=<base64-json>, decode + setDraft.
  useEffect(() => {
    const prefill = searchParams.get('prefill');
    if (!prefill) return;
    try {
      const json = decodeURIComponent(escape(atob(prefill)));
      const data = JSON.parse(json);
      setDraft((d) => ({
        ...d,
        sourceUrl: data.sourceUrl || d.sourceUrl,
        affiliateUrl: data.affiliateUrl || d.affiliateUrl,
        title: data.title || d.title,
        images: Array.isArray(data.images) && data.images.length ? data.images : d.images,
        priceMin: data.priceMin || d.priceMin,
        priceMax: data.priceMax || d.priceMax,
        price: data.priceMin || d.price,
        oldPriceMin: data.oldPriceMin || d.oldPriceMin,
        oldPriceMax: data.oldPriceMax || d.oldPriceMax,
        originalPrice: data.oldPriceMin || d.originalPrice,
        discountPercent: data.discountPercent || d.discountPercent,
        rating: typeof data.rating === 'number' ? data.rating : d.rating,
        soldText: data.soldText || d.soldText,
      }));
      setPreviewOpen(true);
      // Xoá param khỏi URL để reload không re-trigger
      const next = new URLSearchParams(searchParams);
      next.delete('prefill');
      setSearchParams(next, { replace: true });
    } catch (err) {
      // Chỉ log trong dev mode (Vite import.meta.env.DEV). Production silent.
      if (import.meta.env.DEV) {
        console.warn('[ImportPanel] prefill decode fail:', err.message);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
      const resp = await importProductApi(draft.sourceUrl.trim(), draft.affiliateUrl.trim());
      const p = resp.product || {};
      const merged = {
        ...draft,
        title: p.title || draft.title,
        description: p.description || draft.description,
        price: p.price || draft.price || '',
        originalPrice: p.originalPrice || draft.originalPrice || '',
        // Range giá Shopee variant
        priceMin: p.priceMin ?? draft.priceMin ?? '',
        priceMax: p.priceMax ?? draft.priceMax ?? '',
        oldPriceMin: p.oldPriceMin ?? draft.oldPriceMin ?? '',
        oldPriceMax: p.oldPriceMax ?? draft.oldPriceMax ?? '',
        discountPercent: p.discountPercent ?? draft.discountPercent ?? '',
        rating: typeof p.rating === 'number' ? p.rating : draft.rating,
        soldText: p.soldText || draft.soldText || '',
        sold: typeof p.sold === 'number' ? p.sold : draft.sold,
        reviewCount: typeof p.ratingCount === 'number' ? p.ratingCount : draft.reviewCount,
        images: p.images?.length ? p.images : draft.images,
        videos: p.videos?.length ? p.videos : draft.videos,
      };
      setDraft(merged);
      setPreviewOpen(true);

      const missing = [];
      if (!p.title) missing.push('tên');
      if (!p.images?.length) missing.push('ảnh');
      // Coi là thiếu giá khi cả single price LẪN range đều không có
      const hasPrice = p.price || p.priceMin || p.priceMax;
      if (!hasPrice) missing.push('giá');
      if (missing.length > 0 || resp.fallback) {
        setWarning(
          missing.includes('giá')
            ? 'Shopee chặn request lần này (chập chờn). Bấm "Import dữ liệu sản phẩm" lại 1-2 lần (đợi ~5s/lần) — backend tự retry 3 lần. Hoặc nhập tay các trường còn thiếu.'
            : `Không tự lấy đủ dữ liệu: thiếu ${missing.join(', ') || 'một số trường'}. Vui lòng nhập / sửa thủ công bên dưới — bạn vẫn lưu sản phẩm được.`
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
        priceMin: Number(draft.priceMin) || null,
        priceMax: Number(draft.priceMax) || null,
        oldPriceMin: Number(draft.oldPriceMin) || null,
        oldPriceMax: Number(draft.oldPriceMax) || null,
        discountPercent: Number(draft.discountPercent) || null,
        rating: Number(draft.rating) || 0,
        platform: platform?.key || 'other',
      };
      const saved = await saveProductApi(payload);
      setSuccess(`✓ Đã lưu "${saved.title}". Sang tab "Sản phẩm" để xem/ẩn/xoá.`);
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
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">📥 Import sản phẩm affiliate</h1>
        <p className="mt-1 text-sm text-brand-ink-500">
          Dán Source URL + Affiliate URL → backend tự lấy ảnh/giá → bạn chỉnh sửa → Lưu.
        </p>
      </div>
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

          {/* 📋 Quick paste giá từ Shopee — vì Shopee chặn API server-side, giá không thể auto.
              User mở Shopee, copy chuỗi giá đã thấy → paste vào đây → backend parse tự động. */}
          <div className="mb-4 rounded-2xl bg-blue-50 p-3 ring-1 ring-blue-200">
            <label className="text-xs font-bold text-blue-700">
              📋 Dán giá nhanh từ Shopee
              <span className="ml-1 font-normal text-blue-600">
                (mở Shopee → bôi đen dòng giá → Ctrl+C → paste vào đây)
              </span>
            </label>
            <textarea
              rows={3}
              placeholder={'VD dán nguyên 3 dòng:\n91.000đ - 238.000đ\n105.000đ - 276.000đ\n-13%'}
              onChange={(e) => {
                const parsed = parseShopeePriceText(e.target.value);
                if (!parsed) return;
                const patch = {};
                if (parsed.priceMin) {
                  patch.priceMin = parsed.priceMin;
                  patch.price = parsed.priceMin;
                }
                if (parsed.priceMax) patch.priceMax = parsed.priceMax;
                if (parsed.oldPriceMin) {
                  patch.oldPriceMin = parsed.oldPriceMin;
                  patch.originalPrice = parsed.oldPriceMin;
                }
                if (parsed.oldPriceMax) patch.oldPriceMax = parsed.oldPriceMax;
                if (parsed.discountPercent) patch.discountPercent = parsed.discountPercent;
                update(patch);
              }}
              className="input-base mt-1.5 resize-none text-sm"
            />
            <p className="mt-1 text-[10px] text-blue-600">
              💡 Backend tự parse: 1-2 số đầu = giá hiện tại (min/max), 1-2 số tiếp = giá gốc, có "-X%" = discount.
            </p>
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
            <Field label="Giá Min (VND)" hint="Giá thấp nhất nếu có nhiều biến thể">
              <input
                type="number"
                value={draft.priceMin || draft.price}
                onChange={(e) => update({ priceMin: e.target.value, price: e.target.value })}
                className="input-base"
                placeholder="91000"
              />
              {(draft.priceMin || draft.price) > 0 && (
                <div className="mt-1 text-xs text-brand-orange-600">
                  Hiển thị: {formatVND(Number(draft.priceMin || draft.price))}
                </div>
              )}
            </Field>
            <Field label="Giá Max (VND)" hint="Để trống nếu chỉ 1 giá">
              <input
                type="number"
                value={draft.priceMax || ''}
                onChange={(e) => update({ priceMax: e.target.value })}
                className="input-base"
                placeholder="238000"
              />
              {Number(draft.priceMax) > Number(draft.priceMin || draft.price) && (
                <div className="mt-1 text-xs text-brand-orange-600">
                  Range: {formatVND(Number(draft.priceMin || draft.price))} - {formatVND(Number(draft.priceMax))}
                </div>
              )}
            </Field>
            <Field label="Giá gốc Min (gạch ngang)">
              <input
                type="number"
                value={draft.oldPriceMin || draft.originalPrice}
                onChange={(e) => update({ oldPriceMin: e.target.value, originalPrice: e.target.value })}
                className="input-base"
                placeholder="105000"
              />
            </Field>
            <Field label="Giá gốc Max" hint="Để trống nếu chỉ 1 giá gốc">
              <input
                type="number"
                value={draft.oldPriceMax || ''}
                onChange={(e) => update({ oldPriceMax: e.target.value })}
                className="input-base"
                placeholder="276000"
              />
            </Field>
            <Field label="Discount %" hint="Badge -X% (Shopee tự scrape)">
              <input
                type="number"
                min="0" max="100"
                value={draft.discountPercent || ''}
                onChange={(e) => update({ discountPercent: e.target.value })}
                className="input-base"
                placeholder="13"
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
                  price: Number(draft.price) || Number(draft.priceMin) || 0,
                  originalPrice: Number(draft.originalPrice) || Number(draft.oldPriceMin) || 0,
                  priceMin: Number(draft.priceMin) || null,
                  priceMax: Number(draft.priceMax) || null,
                  oldPriceMin: Number(draft.oldPriceMin) || null,
                  oldPriceMax: Number(draft.oldPriceMax) || null,
                  discountPercent: Number(draft.discountPercent) || null,
                  rating: Number(draft.rating) || 0,
                  reviewCount: Number(draft.reviewCount) || 0,
                  sold: Number(draft.sold) || 0,
                  soldText: draft.soldText || '',
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
