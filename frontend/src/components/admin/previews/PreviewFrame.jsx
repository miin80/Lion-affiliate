import { useState } from 'react';

/**
 * PreviewFrame — khung wrapper preview với switch Desktop/Mobile.
 * Mobile = 390px (iPhone 14), Desktop = 100% width.
 *
 * Props:
 *  - children: nội dung preview (component card public)
 *  - title (optional): tiêu đề preview
 */
export default function PreviewFrame({ children, title = 'Xem trước' }) {
  const [mode, setMode] = useState('mobile'); // 'mobile' | 'desktop'

  return (
    <div className="rounded-2xl bg-brand-ink-50 p-3 ring-1 ring-brand-ink-100 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-wide text-brand-ink-500">
          👁 {title}
        </div>
        <div className="inline-flex rounded-full bg-white p-0.5 shadow-soft ring-1 ring-brand-ink-200">
          <button
            type="button"
            onClick={() => setMode('mobile')}
            className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
              mode === 'mobile'
                ? 'bg-brand-ink-900 text-white'
                : 'text-brand-ink-500 hover:text-brand-ink-700'
            }`}
          >
            📱 Mobile
          </button>
          <button
            type="button"
            onClick={() => setMode('desktop')}
            className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
              mode === 'desktop'
                ? 'bg-brand-ink-900 text-white'
                : 'text-brand-ink-500 hover:text-brand-ink-700'
            }`}
          >
            🖥 Desktop
          </button>
        </div>
      </div>

      <div
        className={
          mode === 'mobile'
            ? 'mx-auto w-[390px] max-w-full overflow-hidden rounded-2xl bg-white p-4 shadow-card ring-2 ring-brand-ink-200'
            : 'w-full rounded-2xl bg-white p-4 shadow-card ring-1 ring-brand-ink-200'
        }
      >
        {children}
      </div>
    </div>
  );
}
