import { useEffect, useState } from 'react';
import { fetchSiteSettings, saveSiteSettingsApi } from '../../services/api';
import { DEFAULT_SITE_SETTINGS } from '../../hooks/useSiteSettings';

/**
 * Form chỉnh site settings: profile, socials, buttons, hero.
 * Lưu PUT /api/site-settings (deep merge).
 */
export default function SettingsManager() {
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ type: '', msg: '' });

  useEffect(() => {
    (async () => {
      try {
        const s = await fetchSiteSettings();
        if (s) setSettings({ ...DEFAULT_SITE_SETTINGS, ...s });
      } catch (err) {
        setToast({ type: 'error', msg: `Không tải được settings: ${err.message}` });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = (path, value) => {
    setSettings((s) => {
      const next = JSON.parse(JSON.stringify(s));
      const keys = path.split('.');
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = cur[keys[i]] || {};
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const flash = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast({ type: '', msg: '' }), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await saveSiteSettingsApi(settings);
      setSettings({ ...DEFAULT_SITE_SETTINGS, ...saved });
      flash('success', '✓ Đã lưu cài đặt thành công — refresh trang chủ để xem.');
    } catch (err) {
      flash('error', `Lỗi: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-brand-ink-50 p-10 text-center text-sm text-brand-ink-500">
        Đang tải cài đặt...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {toast.msg && (
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm ring-1 ${
            toast.type === 'success'
              ? 'bg-green-50 text-green-700 ring-green-200'
              : 'bg-red-50 text-red-700 ring-red-200'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* PROFILE */}
      <Section title="👤 Profile header" desc="Avatar, tên, mô tả, thống kê">
        <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
          <div>
            <label className="text-sm font-bold">Avatar preview</label>
            <img
              src={settings.profile?.avatar || 'https://placehold.co/200x200/f1f5f9/64748b?text=?'}
              alt="avatar"
              className="mt-2 h-24 w-24 rounded-full object-cover ring-2 ring-white shadow-soft"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/200x200/fee2e2/991b1b?text=URL+lỗi';
              }}
            />
          </div>
          <div className="grid gap-3">
            <Field label="Avatar URL">
              <input
                className="input-base"
                value={settings.profile?.avatar || ''}
                onChange={(e) => update('profile.avatar', e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="Tên thương hiệu / KOL">
              <input
                className="input-base"
                value={settings.profile?.name || ''}
                onChange={(e) => update('profile.name', e.target.value)}
                placeholder="Mira Reviews"
              />
            </Field>
            <Field label="Tagline (footer)">
              <input
                className="input-base"
                value={settings.profile?.tagline || ''}
                onChange={(e) => update('profile.tagline', e.target.value)}
                placeholder="Review chuyên sâu — Deal tốt nhất"
              />
            </Field>
            <Field label="Mô tả ngắn (dưới avatar)">
              <textarea
                className="input-base resize-none"
                rows={2}
                value={settings.profile?.shortBio || ''}
                onChange={(e) => update('profile.shortBio', e.target.value)}
              />
            </Field>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="Followers">
            <input
              className="input-base"
              value={settings.profile?.stats?.followers || ''}
              onChange={(e) => update('profile.stats.followers', e.target.value)}
              placeholder="128K"
            />
          </Field>
          <Field label="Đã review">
            <input
              className="input-base"
              value={settings.profile?.stats?.reviewed || ''}
              onChange={(e) => update('profile.stats.reviewed', e.target.value)}
              placeholder="320+"
            />
          </Field>
          <Field label="Hài lòng">
            <input
              className="input-base"
              value={settings.profile?.stats?.happy || ''}
              onChange={(e) => update('profile.stats.happy', e.target.value)}
              placeholder="98%"
            />
          </Field>
        </div>
      </Section>

      {/* SOCIALS */}
      <Section title="📱 Social links" desc="Để trống = ẩn icon đó">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="TikTok URL">
            <input
              className="input-base"
              value={settings.socials?.tiktok || ''}
              onChange={(e) => update('socials.tiktok', e.target.value)}
              placeholder="https://tiktok.com/@..."
            />
          </Field>
          <Field label="Facebook URL">
            <input
              className="input-base"
              value={settings.socials?.facebook || ''}
              onChange={(e) => update('socials.facebook', e.target.value)}
              placeholder="https://facebook.com/..."
            />
          </Field>
          <Field label="Instagram URL">
            <input
              className="input-base"
              value={settings.socials?.instagram || ''}
              onChange={(e) => update('socials.instagram', e.target.value)}
              placeholder="https://instagram.com/..."
            />
          </Field>
          <Field label="YouTube URL">
            <input
              className="input-base"
              value={settings.socials?.youtube || ''}
              onChange={(e) => update('socials.youtube', e.target.value)}
              placeholder="https://youtube.com/@..."
            />
          </Field>
          <Field label="Shopee / TikTok Shop URL">
            <input
              className="input-base"
              value={settings.socials?.shopee || ''}
              onChange={(e) => update('socials.shopee', e.target.value)}
              placeholder="https://shopee.vn/..."
            />
          </Field>
        </div>
      </Section>

      {/* BUTTONS */}
      <Section title="🎯 Buttons (CTA)" desc="Text + link cho 3 nút lớn trên trang chủ">
        <ButtonEditor
          title="Nút Theo dõi (hiển thị dưới avatar + sticky mobile)"
          settings={settings}
          path="buttons.follow"
          update={update}
          textPlaceholder="➕ Theo dõi mình"
          urlPlaceholder="https://tiktok.com/@..."
        />
        <ButtonEditor
          title="Nút Xem deal HOT (hero)"
          settings={settings}
          path="buttons.dealHot"
          update={update}
          textPlaceholder="🔥 Xem deal HOT hôm nay"
          urlPlaceholder="Để trống = scroll xuống grid filter Deal Hot"
          urlOptional
        />
        <ButtonEditor
          title="Nút Xem video review (hero)"
          settings={settings}
          path="buttons.videoReview"
          update={update}
          textPlaceholder="🎬 Xem video review"
          urlPlaceholder="#video-reviews"
        />
      </Section>

      {/* HERO */}
      <Section title="🌟 Hero section" desc="Tiêu đề, subtitle, badge, placeholder search">
        <div className="grid gap-3">
          <Field label="Badge (chip phía trên tiêu đề)">
            <input
              className="input-base"
              value={settings.hero?.badge || ''}
              onChange={(e) => update('hero.badge', e.target.value)}
              placeholder="🔥 Top recommend 2026"
            />
          </Field>
          <Field
            label="Tiêu đề chính"
            hint='Phần text "mình recommend" / "recommend" sẽ được tô gradient tự động.'
          >
            <input
              className="input-base"
              value={settings.hero?.title || ''}
              onChange={(e) => update('hero.title', e.target.value)}
              placeholder="Top sản phẩm mình recommend"
            />
          </Field>
          <Field label="Subtitle">
            <textarea
              className="input-base resize-none"
              rows={2}
              value={settings.hero?.subtitle || ''}
              onChange={(e) => update('hero.subtitle', e.target.value)}
            />
          </Field>
          <Field label="Placeholder ô search">
            <input
              className="input-base"
              value={settings.hero?.searchPlaceholder || ''}
              onChange={(e) => update('hero.searchPlaceholder', e.target.value)}
            />
          </Field>
        </div>
      </Section>

      {/* MISC */}
      <Section title="📝 Khác" desc="Email + disclosure (footer)">
        <div className="grid gap-3">
          <Field label="Email liên hệ">
            <input
              className="input-base"
              value={settings.email || ''}
              onChange={(e) => update('email', e.target.value)}
              placeholder="contact@yourdomain.com"
            />
          </Field>
          <Field label="Affiliate disclosure (footer)">
            <textarea
              className="input-base resize-none"
              rows={3}
              value={settings.disclosure || ''}
              onChange={(e) => update('disclosure', e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <div className="sticky bottom-20 z-10 flex justify-end gap-2 rounded-2xl bg-white/95 p-3 shadow-card ring-1 ring-brand-ink-100 backdrop-blur sm:static sm:bg-transparent sm:p-0 sm:shadow-none sm:ring-0">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {saving ? '⏳ Đang lưu...' : '💾 Lưu cài đặt'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, desc, children }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-brand-ink-100 sm:p-6">
      <h3 className="text-base font-extrabold">{title}</h3>
      {desc && <p className="text-xs text-brand-ink-500">{desc}</p>}
      <div className="mt-4">{children}</div>
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

function ButtonEditor({ title, settings, path, update, textPlaceholder, urlPlaceholder, urlOptional }) {
  const keys = path.split('.');
  const btn = keys.reduce((acc, k) => acc?.[k], settings) || {};
  return (
    <div className="mt-3 rounded-2xl bg-brand-ink-50 p-3">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-ink-700">
        {title}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Text">
          <input
            className="input-base"
            value={btn.text || ''}
            onChange={(e) => update(`${path}.text`, e.target.value)}
            placeholder={textPlaceholder}
          />
        </Field>
        <Field label={`Link ${urlOptional ? '(tuỳ chọn)' : ''}`}>
          <input
            className="input-base"
            value={btn.url || ''}
            onChange={(e) => update(`${path}.url`, e.target.value)}
            placeholder={urlPlaceholder}
          />
        </Field>
      </div>
    </div>
  );
}
