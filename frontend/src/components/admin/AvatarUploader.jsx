import { useRef, useState } from 'react';

/**
 * AvatarUploader — click vào avatar hoặc nút "Đổi ảnh" để upload.
 * - Resize ảnh xuống max 400x400 (square)
 * - Compress JPEG 70% quality → ~30-60KB base64
 * - Lưu data URL vào value (không cần upload server)
 *
 * Props:
 *  - value: avatar URL hiện tại (có thể là https://... hoặc data:image/...)
 *  - onChange(newUrl): callback khi user pick file mới
 */
export default function AvatarUploader({ value, onChange, size = 96 }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset để chọn lại file cùng tên vẫn trigger
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('File phải là ảnh (JPG/PNG/WebP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Ảnh quá lớn (>8MB). Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const dataUrl = await compressToSquare(file, 400, 0.7);
      onChange(dataUrl);
    } catch (err) {
      setError(`Không xử lý được ảnh: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const isDataUrl = typeof value === 'string' && value.startsWith('data:');

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <button
          type="button"
          onClick={pick}
          disabled={busy}
          aria-label="Đổi avatar"
          className="group relative h-full w-full overflow-hidden rounded-full ring-2 ring-white shadow-soft transition hover:ring-brand-orange-300 disabled:cursor-wait"
        >
          <img
            src={value || 'https://placehold.co/200x200/f1f5f9/64748b?text=?'}
            alt="avatar preview"
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/200x200/fee2e2/991b1b?text=URL+lỗi';
            }}
          />
          {/* Hover overlay */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100">
            <CameraIcon />
            <span className="mt-0.5 text-[10px] font-bold uppercase">Đổi ảnh</span>
          </div>
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-orange-200 border-t-brand-orange-500" />
            </div>
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={pick}
          disabled={busy}
          className="rounded-full bg-brand-ink-900 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-brand-ink-800 disabled:opacity-50"
        >
          📷 Đổi ảnh
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="rounded-full bg-brand-ink-100 px-3 py-1.5 text-[11px] font-semibold text-brand-ink-700 hover:bg-brand-ink-200"
          >
            🗑 Xoá
          </button>
        )}
      </div>

      {isDataUrl && (
        <div className="text-[10px] text-brand-ink-500">
          📦 Ảnh đã upload (~{Math.round(value.length / 1024)}KB inline)
        </div>
      )}
      {error && (
        <div className="text-[10px] font-semibold text-red-600">⚠️ {error}</div>
      )}
    </div>
  );
}

/**
 * Resize ảnh xuống square <maxSize>x<maxSize>, crop center, compress JPEG.
 * Trả về data URL (base64).
 */
function compressToSquare(file, maxSize = 400, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Crop center to square
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;

          const targetSize = Math.min(maxSize, minSide);
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetSize, targetSize);
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Không đọc được ảnh'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Không đọc được file'));
    reader.readAsDataURL(file);
  });
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
