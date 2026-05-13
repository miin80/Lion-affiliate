import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import StickyCTA from './components/StickyCTA';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Code-splitting để tải nhanh hơn
const Home = lazy(() => import('./pages/Home'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Collection = lazy(() => import('./pages/Collection'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Admin = lazy(() => import('./pages/Admin'));
const Login = lazy(() => import('./pages/Login'));
const NotFound = lazy(() => import('./pages/NotFound'));

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
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      <ScrollToTop />
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

              {/* Auth & Admin — KHÔNG có public chrome bao quanh */}
              <Route path="/admin/login" element={<Login />} />
              <Route
                path="/admin"
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
          <StickyCTA />
          <BottomNav />
        </>
      )}
    </>
  );
}

export default function App() {
  return <AppShell />;
}
