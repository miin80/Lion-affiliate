import { NavLink } from 'react-router-dom';
import { HomeIcon, GridIcon, VideoIcon, FireIcon } from './icons';
import { useSiteSettings } from '../hooks/useSiteSettings';

/**
 * Bottom navigation chỉ hiển thị trên mobile (<sm).
 * 4 tabs shopper-flow: Home | Danh mục | Video | Deal hot.
 * Active state có thanh cam mỏng phía trên icon → cảm giác native app.
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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#eee] bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <ul className="grid grid-cols-4">
        {items.map((it, i) => {
          const Icon = it.icon;
          const renderInner = (isActive) => (
            <div className="relative flex flex-col items-center gap-0.5">
              {/* Active indicator — thanh cam mỏng phía trên icon */}
              <span
                aria-hidden
                className={`absolute -top-2 h-0.5 w-7 rounded-full bg-brand-orange-500 transition-opacity ${
                  isActive ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <Icon className="h-5 w-5" />
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
                  className="flex flex-1 items-center justify-center py-2 text-brand-ink-500 transition hover:text-brand-ink-800"
                >
                  {renderInner(false)}
                </a>
              ) : (
                <NavLink
                  to={it.to}
                  end={it.end}
                  className={({ isActive }) =>
                    `flex flex-1 items-center justify-center py-2 transition ${
                      isActive
                        ? 'text-brand-orange-600'
                        : 'text-brand-ink-500 hover:text-brand-ink-800'
                    }`
                  }
                >
                  {({ isActive }) => renderInner(isActive)}
                </NavLink>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
