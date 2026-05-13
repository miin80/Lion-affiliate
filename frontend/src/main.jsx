import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import { isChunkLoadError, reloadOnceForChunkError } from './utils/chunkReload';
import './index.css';

// Global listener: Vite emit 'vite:preloadError' khi modulepreload chunk fail.
// Xử lý sớm trước cả khi React thấy lỗi → reload mượt hơn.
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault();
  reloadOnceForChunkError();
});

// Backup listener: bắt mọi unhandled promise rejection match pattern chunk load.
window.addEventListener('unhandledrejection', (e) => {
  if (isChunkLoadError(e.reason)) {
    e.preventDefault();
    reloadOnceForChunkError();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
