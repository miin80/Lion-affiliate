import { NavLink } from 'react-router-dom';
import { HomeIcon, GridIcon, VideoIcon, HeartIcon } from './icons';
import { SITE } from '../config/site';

/**
 * Bottom navigation chỉ hiển thị trên mobile (<sm).
 * 4 tabs: Home, Products, Videos (TikTok external), Follow.
 */
export default function BottomNav() {
  const items = [
    { to: '/', icon: HomeIcon, label: 'Home', end: true },
    { to: '/products', icon: GridIcon, label: 'Sản phẩm' },
    { href: SITE.socials.tiktok || SITE.followUrl, icon: VideoIcon, label: 'Video', external: true },
    { href: SITE.followUrl, icon: HeartIcon, label: 'Theo dõi', external: true },
  ];

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-ink-100 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <ul className="grid grid-cols-4">
        {items.map((it, i) => {
          const Icon = it.icon;
          const content = (
            <div className="flex flex-col items-center gap-0.5">
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{it.label}</span>
            </div>
          );
          return (
            <li key={i} className="flex items-stretch justify-center">
              {it.external ? (
                <a
                  href={it.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center py-2.5 text-brand-ink-500"
                >
                  {content}
                </a>
              ) : (
                <NavLink
                  to={it.to}
                  end={it.end}
                  className={({ isActive }) =>
                    `flex flex-1 items-center justify-center py-2.5 transition ${
                      isActive ? 'text-brand-orange-600' : 'text-brand-ink-500'
                    }`
                  }
                >
                  {content}
                </NavLink>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
