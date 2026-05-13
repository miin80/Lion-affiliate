import { Link } from 'react-router-dom';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { isAuthenticated } from '../services/auth';
import {
  TikTokIcon,
  FacebookIcon,
  InstagramIcon,
  YouTubeIcon,
  ShopeeIcon,
} from './icons';

const SOCIAL_ICONS = {
  tiktok: TikTokIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  youtube: YouTubeIcon,
  shopee: ShopeeIcon,
};

export default function Footer() {
  const { settings } = useSiteSettings();
  const profile = settings.profile || {};
  const socials = settings.socials || {};
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-brand-ink-100 bg-brand-ink-50 pb-24 sm:pb-10">
      <div className="container-page py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-white"
              />
              <div>
                <div className="text-base font-extrabold">{profile.name}</div>
                <div className="text-xs text-brand-ink-500">{profile.tagline}</div>
              </div>
            </div>
            {settings.email && (
              <p className="mt-3 text-sm text-brand-ink-500">
                Liên hệ hợp tác: <a href={`mailto:${settings.email}`} className="font-semibold text-brand-orange-600 hover:underline">{settings.email}</a>
              </p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-brand-ink-700">
              Khám phá
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/" className="hover:text-brand-orange-600">Trang chủ</Link></li>
              <li><Link to="/products" className="hover:text-brand-orange-600">Tất cả sản phẩm</Link></li>
              <li><Link to="/blog" className="hover:text-brand-orange-600">Blog Review</Link></li>
              <li><Link to="/contact" className="hover:text-brand-orange-600">Liên hệ</Link></li>
              {isAuthenticated() && (
                <li><Link to="/admin" className="hover:text-brand-orange-600">Quản trị</Link></li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-brand-ink-700">
              Pháp lý
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/affiliate-disclosure" className="hover:text-brand-orange-600">Tiết lộ liên kết tiếp thị</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-brand-orange-600">Chính sách bảo mật</Link></li>
              <li><Link to="/terms" className="hover:text-brand-orange-600">Điều khoản sử dụng</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-brand-ink-700">
              Theo dõi mình
            </h4>
            <div className="mt-3 flex gap-2">
              {Object.entries(socials)
                .filter(([, url]) => url && url.trim())
                .map(([k, url]) => {
                  const Icon = SOCIAL_ICONS[k];
                  if (!Icon) return null;
                  return (
                    <a
                      key={k}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={k}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-ink-700 shadow-soft ring-1 ring-brand-ink-200 transition hover:-translate-y-0.5 hover:text-brand-orange-600"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
            </div>
          </div>
        </div>

        {settings.disclosure && (
          <div className="mt-10 rounded-2xl bg-white p-4 ring-1 ring-brand-ink-100">
            <div className="text-xs font-bold uppercase tracking-wide text-brand-ink-700">
              🔔 Tiết lộ liên kết tiếp thị (Affiliate Disclosure)
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-brand-ink-500">
              {settings.disclosure}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col items-center justify-between gap-2 text-xs text-brand-ink-400 sm:flex-row">
          <div>© {year} {profile.name}. All rights reserved.</div>
          <div>Made with ❤️ for content creators</div>
        </div>
      </div>
    </footer>
  );
}
