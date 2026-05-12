import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { login, isAuthenticated } from '../services/auth';
import { useSiteSettings } from '../hooks/useSiteSettings';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSiteSettings();
  const profile = settings.profile || {};
  const from = location.state?.from || '/admin';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Đã login rồi → vào thẳng admin
  if (isAuthenticated()) {
    navigate(from, { replace: true });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="Đăng nhập" />
      <div className="relative min-h-[80vh] overflow-hidden bg-gradient-soft px-4 py-12">
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand-orange-200/60 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-brand-pink-200/60 blur-3xl" />

        <div className="relative mx-auto flex max-w-md flex-col items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            {profile.avatar && (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-soft"
              />
            )}
            <span className="text-xl font-extrabold">{profile.name}</span>
          </Link>

          <div className="mt-8 w-full rounded-3xl bg-white p-6 shadow-card ring-1 ring-brand-ink-100 sm:p-8">
            <h1 className="text-2xl font-extrabold">🔐 Đăng nhập quản trị</h1>
            <p className="mt-1 text-sm text-brand-ink-500">
              Chỉ admin được vào trang quản trị sản phẩm và cài đặt website.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-bold">Tên đăng nhập</label>
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-base mt-1.5"
                  placeholder="admin"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-bold">Mật khẩu</label>
                <div className="relative mt-1.5">
                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-base pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-orange-600 hover:text-brand-orange-700"
                  >
                    {showPw ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-sm disabled:opacity-50"
              >
                {loading ? '⏳ Đang đăng nhập...' : '🔓 Đăng nhập'}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-brand-ink-500">
              ← <Link to="/" className="hover:text-brand-orange-600">Quay về trang chủ</Link>
            </p>
          </div>

          <p className="mt-4 max-w-sm text-center text-[11px] text-brand-ink-400">
            Tài khoản được cấu hình trong biến môi trường backend.
            Đặt <code className="rounded bg-white px-1.5 py-0.5">ADMIN_USERNAME</code> và{' '}
            <code className="rounded bg-white px-1.5 py-0.5">ADMIN_PASSWORD</code> trong file <code>.env</code>.
          </p>
        </div>
      </div>
    </>
  );
}
