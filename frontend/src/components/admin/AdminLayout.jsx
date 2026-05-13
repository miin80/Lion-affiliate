import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getUser } from '../../services/auth';

const MENU = [
  { key: 'dashboard',   icon: '📊', label: 'Dashboard' },
  { key: 'import',      icon: '📥', label: 'Import sản phẩm' },
  { key: 'manage',      icon: '🛍',  label: 'Sản phẩm' },
  { key: 'videos',      icon: '🎬', label: 'Video review' },
  { key: 'collections', icon: '📚', label: 'Bộ sưu tập' },
  { key: 'categories',  icon: '🏷', label: 'Danh mục' },
  { key: 'blogs',       icon: '📝', label: 'Blog' },
  { key: 'sheet',       icon: '📊', label: 'Google Sheet' },
  { key: 'settings',    icon: '⚙️', label: 'Cài đặt website' },
  { divider: true, label: 'Thùng rác' },
  { key: 'trash',       icon: '🗑',  label: 'SP đã xoá' },
  { key: 'video-trash', icon: '🗑',  label: 'Video đã xoá' },
  { key: 'coll-trash',  icon: '🗑',  label: 'BST đã xoá' },
  { key: 'blog-trash',  icon: '🗑',  label: 'Blog đã xoá' },
  { key: 'cat-trash',   icon: '🗑',  label: 'Danh mục đã xoá' },
];

/**
 * Sidebar layout cho /admin.
 *  - Desktop: sidebar cố định bên trái 240px
 *  - Mobile: sidebar drawer (toggle bằng hamburger)
 */
export default function AdminLayout({ activeTab, onTabChange, children }) {
  const navigate = useNavigate();
  const user = getUser();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false); // close drawer khi đổi tab
  }, [activeTab]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-brand-ink-50">
      {/* MOBILE HEADER (sm:hidden) — gọn: chỉ hamburger + tiêu đề. Logout chuyển hẳn vào sidebar để tránh public-ish action ở góc trên. */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center gap-3 border-b border-brand-ink-200 bg-white px-4 py-3 sm:hidden">
        <button
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-ink-100"
          aria-label="Mở menu quản trị"
        >
          ☰
        </button>
        <div className="text-sm font-bold">⚙️ Quản trị</div>
      </header>

      {/* SIDEBAR — desktop fixed, mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto border-r border-brand-ink-200 bg-white transition-transform sm:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="border-b border-brand-ink-100 p-5">
          <div className="text-base font-extrabold">⚙️ Lion Admin</div>
          <div className="text-[11px] text-brand-ink-500">
            👤 {user?.username || 'admin'}
          </div>
        </div>

        {/* Menu */}
        <nav className="p-3">
          {MENU.map((item, i) => {
            if (item.divider) {
              return (
                <div
                  key={`div-${i}`}
                  className="mt-3 mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-brand-ink-400"
                >
                  ─ {item.label} ─
                </div>
              );
            }
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                  isActive
                    ? 'bg-brand-orange-500 text-white shadow-cta'
                    : 'text-brand-ink-700 hover:bg-brand-ink-100'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {isActive && <span className="text-xs">→</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto border-t border-brand-ink-100 p-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-brand-ink-700 hover:bg-brand-ink-100"
          >
            🌐 Xem website
          </a>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      {/* Backdrop mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm sm:hidden"
        />
      )}

      {/* MAIN */}
      <main className="flex-1 overflow-x-hidden pt-14 sm:ml-64 sm:pt-0">
        <div className="container-page py-5 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
