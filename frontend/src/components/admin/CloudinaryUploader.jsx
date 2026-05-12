import { useRef, useState } from 'react';
import { CLOUDINARY_ENABLED, uploadToCloudinary } from '../../services/cloudinary';

/**
 * CloudinaryUploader — drag-drop + click upload ảnh.
 *  - Single hoặc multi.
 *  - Nếu Cloudinary chưa cấu hình → ẩn nút + hiện hint.
 *  - onUpload(urls): callback sau khi upload thành công.
 */
export default function CloudinaryUploader({ onUpload, multiple = true, label = '📤 Upload từ máy' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  if (!CLOUDINARY_ENABLED) {
    return (
      <div className="rounded-2xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-amber-200">
        💡 <strong>Cloudinary chưa cấu hình.</strong> Để bật upload từ máy: setup Cloudinary
        (xem <code>ADMIN_GUIDE.md</code> §9) và thêm 2 env vars trên Vercel:
        <code>VITE_CLOUDINARY_CLOUD_NAME</code> + <code>VITE_CLOUDINARY_UPLOAD_PRESET</code>.
        <br />
        Hiện tại: paste URL ảnh thủ công.
      </div>
    );
  }

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setError('');
    setUploading(true);
    setProgress({});
    const urls = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await uploadToCloudinary(files[i], {
          onProgress: (pct) => setProgress((p) => ({ ...p, [i]: pct })),
        });
        urls.push(result.url);
      } catch (err) {
        setError(`Upload ${files[i].name} lỗi: ${err.message}`);
      }
    }
    setUploading(false);
    if (urls.length) onUpload?.(urls);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(Array.from(e.dataTransfer.files || []));
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center text-xs transition ${
          dragOver
            ? 'border-brand-orange-500 bg-brand-orange-50'
            : 'border-brand-ink-200 bg-brand-ink-50 hover:border-brand-orange-300'
        }`}
      >
        {uploading ? (
          <div>
            <div className="font-bold">⏳ Đang upload...</div>
            <div className="mt-2 space-y-1">
              {Object.entries(progress).map(([i, pct]) => (
                <div key={i} className="h-1.5 overflow-hidden rounded-full bg-brand-ink-200">
                  <div
                    className="h-full bg-brand-orange-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="text-2xl">📤</div>
            <div className="mt-1 font-bold">{label}</div>
            <div className="text-[10px] text-brand-ink-500">
              Kéo thả file vào đây hoặc click để chọn
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handleFiles(Array.from(e.target.files || []));
          e.target.value = '';
        }}
      />

      {error && (
        <div className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-[11px] text-red-700">{error}</div>
      )}
    </div>
  );
}
