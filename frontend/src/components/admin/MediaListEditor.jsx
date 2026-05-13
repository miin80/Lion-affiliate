import { useState } from 'react';
import CloudinaryUploader from './CloudinaryUploader';

/**
 * Editor cho mảng URL (ảnh hoặc video).
 * - List: thumbnail + nút xoá.
 * - Input dưới cùng để thêm URL mới.
 * - Reorder bằng nút lên/xuống.
 * - Cloudinary upload nếu đã cấu hình env.
 */
export default function MediaListEditor({
  label,
  type = 'image', // 'image' | 'video'
  value = [],
  onChange,
  placeholder = 'Dán URL ảnh / video...',
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const text = input.trim();
    if (!text) return;
    // Hỗ trợ paste nhiều URL cùng lúc: tách theo newline / dấu phẩy / dấu chấm phẩy.
    // User flow điển hình: copy-paste địa chỉ ảnh Shopee từng cái → mỗi cái 1 dòng → bấm Thêm 1 lần.
    const parts = text
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const urls = parts.length > 1 ? parts : [text];
    onChange([...value, ...urls]);
    setInput('');
  };
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const next = [...value];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold">{label}</label>
        <span className="text-xs text-brand-ink-500">{value.length} item</span>
      </div>

      {value.length > 0 && (
        <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((url, i) => (
            <li
              key={url + i}
              className="group relative overflow-hidden rounded-xl ring-1 ring-brand-ink-200"
            >
              {type === 'image' ? (
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.background = '#fee2e2';
                    e.currentTarget.alt = 'lỗi tải';
                  }}
                />
              ) : (
                <video
                  src={url}
                  className="aspect-square w-full bg-black object-cover"
                  muted
                  playsInline
                />
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    className="rounded bg-white/90 px-1.5 text-[10px] font-bold"
                    title="Di chuyển lên"
                  >↑</button>
                  <button
                    type="button"
                    onClick={() => move(i, +1)}
                    className="rounded bg-white/90 px-1.5 text-[10px] font-bold"
                    title="Di chuyển xuống"
                  >↓</button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded bg-red-500 px-1.5 text-[10px] font-bold text-white"
                  title="Xoá"
                >✕</button>
              </div>
              {i === 0 && type === 'image' && (
                <span className="badge absolute left-1 top-1 bg-brand-orange-500 text-white">Cover</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex items-start gap-2">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            // Enter (không Shift) = thêm. Shift+Enter = xuống dòng (paste nhiều URL).
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1 resize-y rounded-2xl border border-brand-ink-200 bg-white px-4 py-2 text-sm focus:border-brand-orange-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-200"
        />
        <button type="button" onClick={add} className="btn-ghost shrink-0 text-xs">
          + Thêm
        </button>
      </div>
      <p className="mt-1 text-[11px] text-brand-ink-400">
        💡 Mẹo: chuột phải ảnh trên Shopee → "Sao chép địa chỉ hình ảnh" → dán vào đây. Hỗ trợ paste nhiều URL cùng lúc (mỗi URL 1 dòng hoặc cách nhau bằng dấu phẩy).
      </p>

      {/* Cloudinary uploader — luôn render. Component tự xử lý 2 trạng thái:
          - CLOUDINARY_ENABLED=true → box xám "📤 Upload từ máy" (drag-drop + click)
          - CLOUDINARY_ENABLED=false → hint vàng hướng dẫn setup ENV trên Vercel.
          Paste URL ở trên luôn hoạt động độc lập với Cloudinary. */}
      <div className="mt-2">
        <CloudinaryUploader
          multiple
          accept={type === 'video' ? 'video/*' : 'image/*'}
          label={type === 'video' ? '📤 Upload video từ máy' : '📤 Upload ảnh từ máy'}
          hint={
            type === 'video'
              ? 'Kéo thả MP4/MOV vào đây hoặc click để chọn (video < 100MB)'
              : 'Kéo thả file ảnh vào đây hoặc click để chọn'
          }
          onUpload={(urls) => onChange([...(value || []), ...urls])}
        />
      </div>
    </div>
  );
}
