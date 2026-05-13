import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CloseIcon } from '../icons';
import { saveProductApi } from '../../services/api';
import { CATEGORIES } from '../../data/categories';
import MediaListEditor from './MediaListEditor';
import TagsInput from './TagsInput';
import ProductPreview from './previews/ProductPreview';
import { useFormDraft } from '../../hooks/useFormDraft';
import DraftBanner from './DraftBanner';
import { parseShopeePriceText } from '../../utils/parseShopeePrice';

const BADGE_OPTIONS = [
  { key: 'hot', label: '🔥 Hot' },
  { key: 'bestseller', label: '👑 Best seller' },
  { key: 'reviewed', label: '✓ Đã review' },
  { key: 'new', label: '🆕 Mới' },
  { key: 'deal', label: '💰 Deal hot' },
  { key: 'featured', label: '⭐ Nổi bật' },
];

/**
 * EditProductModal — sửa nhanh 1 sản phẩm trong admin.
 * Props:
 *  - product: sản phẩm cần sửa
 *  - onClose(): đóng modal
 *  - onSaved(updatedProduct): callback sau khi save thành công
 */
export default function EditProductModal({ product, onClose, onSaved }) {
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Auto-save draft. Key theo product.id (hoặc 'new' khi tạo mới).
  const draftKey = `product_${product?.id || 'new'}`;
  const { hasSavedDraft, savedAt, loadSavedDraft, clearDraft, dismissBanner } = useFormDraft(
    draftKey,
    draft,
    { enabled: Boolean(product) }
  );

  useEffect(() => {
    if (!product) {
      setDraft(null);
      return;
    }
    setDraft({
      ...product,
      images: Array.isArray(product.images) ? product.images : [],
      videos: Array.isArray(product.videos)
        ? product.videos
        : product.video
        ? [product.video]
        : [],
      tags: Array.isArray(product.tags) ? product.tags : [],
      badges: Array.isArray(product.badges) ? product.badges : [],
      price: product.price || '',
      originalPrice: product.originalPrice || '',
      priceMin: product.priceMin || '',
      priceMax: product.priceMax || '',
      oldPriceMin: product.oldPriceMin || '',
      oldPriceMax: product.oldPriceMax || '',
      discountPercent: product.discountPercent || '',
      soldText: product.soldText || '',
      rating: product.rating || 4.8,
      startDate: product.startDate ? product.startDate.slice(0, 10) : '',
      endDate: product.endDate ? product.endDate.slice(0, 10) : '',
      autoHideExpired: product.autoHideExpired ?? true,
    });
    setError('');
  }, [product]);

  useEffect(() => {
    if (!product) return;
    document.body.style.overflow = 'hidden';
    const esc = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', esc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', esc);
    };
  }, [product, onClose]);

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const toggleBadge = (key) =>
    update({
      badges: draft.badges.includes(key)
        ? draft.badges.filter((b) => b !== key)
        : [...draft.badges, key],
    });

  const handleSave = async () => {
    setError('');
    if (!draft.title?.trim()) {
      setError('Bắt buộc nhập tên sản phẩm.');
      return;
    }
    if (!draft.affiliateUrl?.trim()) {
      setError('Bắt buộc nhập affiliate URL.');
      return;
    }
    if (!draft.images.length) {
      setError('Bắt buộc có ít nhất 1 ảnh.');
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
        startDate: draft.startDate || null,
        endDate: draft.endDate || null,
        autoHideExpired: draft.autoHideExpired ?? true,
      };
      const saved = await saveProductApi(payload);
      clearDraft(); // xoá draft sau khi save thành công
      onSaved?.(saved);
      onClose?.();
    } catch (err) {
      setError(`Lỗi lưu: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {product && draft && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <motion.div
            key="sheet"
            initial={{ y: 60, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl"
          >
            {/* Header — không co lại khi body dài, luôn nhìn thấy */}
            <div className="flex shrink-0 items-center justify-between border-b border-brand-ink-100 p-4 sm:p-5">
              <div>
                <h2 className="text-lg font-extrabold">✏️ Chỉnh sửa sản phẩm</h2>
                <p className="text-[11px] text-brand-ink-500">
                  ID: <code className="text-brand-ink-700">{draft.id}</code> · Nguồn:{' '}
                  <strong>{draft.source === 'sheet' ? '📊 Google Sheet' : '✍️ Manual'}</strong>
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-ink-100 hover:bg-brand-ink-200"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Body — flex-1 chiếm phần còn lại, tự scroll khi tràn */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
              {/* Draft banner — khôi phục nội dung chưa lưu */}
              {hasSavedDraft && (
                <DraftBanner
                  savedAt={savedAt}
                  onRestore={() => {
                    const saved = loadSavedDraft();
                    if (saved) setDraft(saved);
                    dismissBanner();
                  }}
                  onDiscard={() => clearDraft()}
                />
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Tên sản phẩm *">
                  <input
                    className="input-base"
                    value={draft.title}
                    onChange={(e) => update({ title: e.target.value })}
                  />
                </Field>
                <Field label="Danh mục">
                  <select
                    className="input-base"
                    value={draft.category || 'gia-dung'}
                    onChange={(e) => update({ category: e.target.value })}
                  >
                    {CATEGORIES.filter((c) => c.slug !== 'all' && c.slug !== 'deal').map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                {/* Quick paste giá từ Shopee */}
                <div className="sm:col-span-2 rounded-2xl bg-blue-50 p-3 ring-1 ring-blue-200">
                  <label className="text-xs font-bold text-blue-700">
                    📋 Dán giá nhanh từ Shopee
                  </label>
                  <textarea
                    rows={2}
                    placeholder={'VD: 91.000đ - 238.000đ\\n105.000đ - 276.000đ\\n-13%'}
                    onChange={(e) => {
                      const parsed = parseShopeePriceText(e.target.value);
                      if (!parsed) return;
                      const patch = {};
                      if (parsed.priceMin) { patch.priceMin = parsed.priceMin; patch.price = parsed.priceMin; }
                      if (parsed.priceMax) patch.priceMax = parsed.priceMax;
                      if (parsed.oldPriceMin) { patch.oldPriceMin = parsed.oldPriceMin; patch.originalPrice = parsed.oldPriceMin; }
                      if (parsed.oldPriceMax) patch.oldPriceMax = parsed.oldPriceMax;
                      if (parsed.discountPercent) patch.discountPercent = parsed.discountPercent;
                      update(patch);
                    }}
                    className="input-base mt-1.5 resize-none text-sm"
                  />
                </div>
                <Field label="Giá Min (VND)" hint="Giá thấp nhất / current price">
                  <input
                    type="number"
                    className="input-base"
                    value={draft.priceMin || draft.price}
                    onChange={(e) => update({ priceMin: e.target.value, price: e.target.value })}
                  />
                </Field>
                <Field label="Giá Max" hint="Bỏ trống nếu chỉ 1 giá">
                  <input
                    type="number"
                    className="input-base"
                    value={draft.priceMax || ''}
                    onChange={(e) => update({ priceMax: e.target.value })}
                  />
                </Field>
                <Field label="Giá gốc Min (gạch ngang)">
                  <input
                    type="number"
                    className="input-base"
                    value={draft.oldPriceMin || draft.originalPrice}
                    onChange={(e) => update({ oldPriceMin: e.target.value, originalPrice: e.target.value })}
                  />
                </Field>
                <Field label="Giá gốc Max" hint="Bỏ trống nếu chỉ 1 giá gốc">
                  <input
                    type="number"
                    className="input-base"
                    value={draft.oldPriceMax || ''}
                    onChange={(e) => update({ oldPriceMax: e.target.value })}
                  />
                </Field>
                <Field label="Discount %" hint="Badge -X%; để trống = tự tính">
                  <input
                    type="number"
                    min="0" max="100"
                    className="input-base"
                    value={draft.discountPercent || ''}
                    onChange={(e) => update({ discountPercent: e.target.value })}
                  />
                </Field>
                <Field label="Affiliate URL *" hint="Link nút Mua. Khách bấm = bạn ăn hoa hồng.">
                  <input
                    type="url"
                    className="input-base"
                    value={draft.affiliateUrl || ''}
                    onChange={(e) => update({ affiliateUrl: e.target.value })}
                  />
                </Field>
                <Field label="Source URL (chỉ để scrape)">
                  <input
                    type="url"
                    className="input-base"
                    value={draft.sourceUrl || ''}
                    onChange={(e) => update({ sourceUrl: e.target.value })}
                  />
                </Field>
                <Field label="Rating (0-5)">
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    className="input-base"
                    value={draft.rating}
                    onChange={(e) => update({ rating: e.target.value })}
                  />
                </Field>
                <div>
                  <TagsInput value={draft.tags} onChange={(v) => update({ tags: v })} />
                </div>
              </div>

              <Field label="Mô tả ngắn">
                <textarea
                  rows={2}
                  className="input-base resize-none"
                  value={draft.description || ''}
                  onChange={(e) => update({ description: e.target.value })}
                />
              </Field>

              <MediaListEditor
                label="🖼️ Ảnh sản phẩm * (ảnh đầu = cover)"
                type="image"
                value={draft.images}
                onChange={(v) => update({ images: v })}
              />

              <MediaListEditor
                label="🎬 Video sản phẩm (tuỳ chọn)"
                type="video"
                value={draft.videos}
                onChange={(v) => update({ videos: v })}
              />

              {/* Deal expiry — startDate / endDate / autoHide */}
              <div className="rounded-2xl bg-brand-ink-50 p-3 ring-1 ring-brand-ink-100">
                <div className="text-sm font-bold">⏰ Deal hết hạn (tuỳ chọn)</div>
                <p className="mt-0.5 text-[11px] text-brand-ink-500">
                  Để trống nếu sản phẩm không có deadline. Nếu set: trước startDate → SP chưa hiện public. Sau endDate → tự ẩn (nếu bật).
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Field label="Ngày bắt đầu">
                    <input
                      type="date"
                      className="input-base"
                      value={draft.startDate || ''}
                      onChange={(e) => update({ startDate: e.target.value })}
                    />
                  </Field>
                  <Field label="Ngày kết thúc">
                    <input
                      type="date"
                      className="input-base"
                      value={draft.endDate || ''}
                      onChange={(e) => update({ endDate: e.target.value })}
                    />
                  </Field>
                  <Field label="Auto-hide khi hết hạn">
                    <label className="mt-2 flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={draft.autoHideExpired ?? true}
                        onChange={(e) => update({ autoHideExpired: e.target.checked })}
                        className="h-4 w-4 accent-brand-orange-500"
                      />
                      <span className="text-xs">
                        {draft.autoHideExpired === false
                          ? 'Tắt — vẫn hiện kèm badge "Hết hạn"'
                          : 'Bật — tự ẩn khỏi public'}
                      </span>
                    </label>
                  </Field>
                </div>
              </div>

              <div>
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

              <div>
                <label className="text-sm font-bold">Trạng thái</label>
                <div className="mt-2 flex gap-2">
                  {[
                    { key: 'active', label: '✅ Đang hiển thị', cls: 'bg-green-100 text-green-700' },
                    { key: 'hidden', label: '🙈 Đã ẩn', cls: 'bg-amber-100 text-amber-800' },
                  ].map((s) => {
                    const on = (draft.status || 'active') === s.key;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => update({ status: s.key })}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          on ? s.cls + ' ring-2 ring-offset-1 ring-brand-ink-900' : s.cls + ' opacity-50'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
                  ⚠️ {error}
                </div>
              )}

              {/* Realtime preview */}
              <ProductPreview product={draft} />
            </div>

            {/* Footer — không co lại, luôn nhìn thấy nút Save/Huỷ ở dưới cùng */}
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-brand-ink-100 bg-white p-4 sm:p-5">
              <button onClick={onClose} className="btn-ghost text-sm">
                Huỷ
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
                {saving ? '⏳ Đang lưu...' : '💾 Lưu thay đổi'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
