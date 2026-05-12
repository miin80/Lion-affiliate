import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, checkAuth } from '../services/auth';

/**
 * Bao quanh route admin. Logic:
 *  - Chưa có token trong localStorage → redirect /admin/login
 *  - Có token → verify với backend (/api/auth/me). Hết hạn → logout + redirect.
 *  - Đang verify → loading screen ngắn.
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState(isAuthenticated() ? 'checking' : 'denied');

  useEffect(() => {
    if (status !== 'checking') return;
    let alive = true;
    (async () => {
      const user = await checkAuth();
      if (!alive) return;
      setStatus(user ? 'ok' : 'denied');
    })();
    return () => {
      alive = false;
    };
  }, [status]);

  if (status === 'denied') {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  if (status === 'checking') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-orange-200 border-t-brand-orange-500" />
      </div>
    );
  }
  return children;
}
