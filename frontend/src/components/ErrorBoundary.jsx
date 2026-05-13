import { Component } from 'react';
import { isChunkLoadError, reloadOnceForChunkError } from '../utils/chunkReload';

/**
 * ErrorBoundary — bắt mọi error từ children → render fallback UI thay vì trắng trang.
 * Production safety: khi 1 component crash, các phần khác vẫn hoạt động.
 *
 * Safety net cho chunk-load error (stale sau deploy): nếu error là chunk load,
 * tự reload trang 1 lần. lazyWithRetry trong App.jsx đã handle case này, đây là
 * lớp dự phòng nếu lỗi đến từ render path khác.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (isChunkLoadError(error)) {
      // Stale chunk sau deploy → reload 1 lần. Có sessionStorage flag chống loop.
      if (reloadOnceForChunkError()) return;
    }
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="text-6xl">⚠️</div>
        <h1 className="mt-4 text-2xl font-extrabold">Có lỗi xảy ra</h1>
        <p className="mt-2 max-w-md text-sm text-brand-ink-500">
          Trang này gặp lỗi không mong muốn. Bạn có thể thử lại hoặc về trang chủ.
        </p>
        {this.state.error?.message && (
          <pre className="mt-4 max-w-xl overflow-auto rounded-xl bg-brand-ink-50 p-3 text-left text-xs text-brand-ink-700">
            {this.state.error.message}
          </pre>
        )}
        <div className="mt-6 flex gap-2">
          <button onClick={this.reset} className="btn-ghost text-sm">
            🔄 Thử lại
          </button>
          <a href="/" className="btn-primary text-sm">
            🏠 Về trang chủ
          </a>
        </div>
      </div>
    );
  }
}
