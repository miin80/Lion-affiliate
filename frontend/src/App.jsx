import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { isAuthenticated } from './services/auth';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import TrackingScripts from './components/TrackingScripts';
import { isChunkLoadError, reloadOnceForChunkError } from './utils/chunkReload';

// Wrap lazy() để auto-reload khi chunk cũ (stale sau deploy) bị 404.
// Trả promise never-resolving lúc đang reload → Suspense giữ fallback UI mượt.
function lazyWithRetry(loader) {
  return lazy(async () => {
    try {
      return await loader();
    } catch (err) {
      if (isChunkLoadError(err) && reloadOnceForChunkError()) {
        return new Promise(() => {}); // hang cho tới khi page reload
      }
      throw err;
    }
  });
}

// Code-splitting để tải nhanh hơn
const Home = lazyWithRetry(() => import('./pages/Home'));
const ProductsPage = lazyWithRetry(() => import('./pages/ProductsPage'));
const ProductDetail = lazyWithRetry(() => import('./pages/ProductDetail'));
const Collection = lazyWithRetry(() => import('./pages/Collection'));
const Blog = lazyWithRetry(() => import('./pages/Blog'));
const BlogPost = lazyWithRetry(() => import('./pages/BlogPost'));
const Admin = lazyWithRetry(() => import('./pages/Admin'));
const Login = lazyWithRetry(() => import('./pages/Login'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));
const LegalPage = lazyWithRetry(() => import('./pages/LegalPage'));

function Fallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-orange-200 border-t-brand-orange-500" />
    </div>
  );
}

/**
 * AppShell — phân chia chrome theo route.
 *  - /admin và /admin/login → KHÔNG render bất kỳ public mobile component nào
 *    (Footer, BottomNav, StickyCTA). Admin có UI riêng, độc lập hoàn toàn.
 *  - Các route khác (public) → giữ chrome đầy đủ như cũ.
 */
function AppShell() {
  const location = useLocation();
  // /admin/* + /login đều là admin-context, không render public chrome.
  const isAdminRoute =
    location.pathname.startsWith('/admin') || location.pathname === '/login';

  return (
    <>
      <ScrollToTop />
      {/* Tracking pixels — chỉ inject khi admin set ID trong Settings.
          Áp dụng cho cả public + admin để theo dõi conversion từ cả 2 phía. */}
      <TrackingScripts />
      <main className={`min-h-[60vh] ${isAdminRoute ? '' : 'pb-24 sm:pb-0'}`}>
        <ErrorBoundary>
          <Suspense fallback={<Fallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/collection/:slug" element={<Collection />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />

              {/* Legal / chính sách */}
              <Route path="/privacy-policy" element={<LegalPage pageKey="privacy" />} />
              <Route path="/terms" element={<LegalPage pageKey="terms" />} />
              <Route path="/affiliate-disclosure" element={<LegalPage pageKey="affiliate" />} />
              <Route path="/contact" element={<LegalPage pageKey="contact" />} />

              {/* Shortcut /login — chuyên nghiệp hơn, dễ nhớ hơn /admin/login.
                  Đã login → straight vào /admin. Chưa login → render Login.
                  /admin/login giữ lại cho backward compat. */}
              <Route
                path="/login"
                element={isAuthenticated() ? <Navigate to="/admin" replace /> : <Login />}
              />

              {/* Auth & Admin — KHÔNG có public chrome bao quanh.
                  /admin/* để Admin có thể nested route từng sub-page riêng. */}
              <Route path="/admin/login" element={<Login />} />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      {!isAdminRoute && (
        <>
          <Footer />
          {/* StickyCTA "Theo dõi mình" đã bỏ — che product card + nút Mua, hại
              conversion. Follow CTA giữ ở ProfileHeader (top) + tab "Theo dõi"
              trong BottomNav (bottom mobile) đã đủ entry point. */}
          <BottomNav />
        </>
      )}
    </>
  );
}

export default function App() {
  return <AppShell />;
}
