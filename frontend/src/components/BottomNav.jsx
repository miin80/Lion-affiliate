import { NavLink } from 'react-router-dom';
import { HomeIcon, GridIcon, VideoIcon, FireIcon } from './icons';
import { useSiteSettings } from '../hooks/useSiteSettings';

/**
 * Bottom navigation chỉ hiển thị trên mobile (<sm).
 * 4 tabs ưu tiên shopper-flow: Home | Danh mục | Video | Deal hot.
 * Bỏ "Theo dõi" vì người mua affiliate ít follow — Deal hot tăng conversion.
 */
export default function BottomNav() {
  const { settings } = useSiteSettings();
  const tiktokUrl = settings.socials?.tiktok || '';
  const followUrl = settings.buttons?.follow?.url || tiktokUrl;
  const items = [
    { to: '/', icon: HomeIcon, label: 'Home', end: true },
    { to: '/products', icon: GridIcon, label: 'Danh mục' },
    { href: tiktokUrl || followUrl, icon: VideoIcon, label: 'Video', external: true },
    { to: '/products', icon: FireIcon, label: 'Deal hot' },
  ].filter((it) => it.to || it.href);

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-ink-100 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <ul className="grid grid-cols-4">
        {items.map((it, i) => {
          const Icon = it.icon;
          const renderContent = (isActive) => (
            <div className="flex flex-col items-center gap-0.5">
              <Icon className={`transition ${isActive ? 'h-[22px] w-[22px]' : 'h-[19px] w-[19px]'}`} />
              <span className={`text-[10px] ${isActive ? 'font-extrabold' : 'font-semibold'}`}>
                {it.label}
              </span>
            </div>
          );
          return (
            <li key={i} className="flex items-stretch justify-center">
              {it.external ? (
                <a
                  href={it.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center py-2 text-brand-ink-500"
                >
                  {renderContent(false)}
                </a>
              ) : (
                <NavLink
                  to={it.to}
                  end={it.end}
                  className={({ isActive }) =>
                    `flex flex-1 items-center justify-center py-2 transition ${
                      isActive ? 'text-brand-orange-600' : 'text-brand-ink-500'
                    }`
                  }
                >
                  {({ isActive }) => renderContent(isActive)}
                </NavLink>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
