import { useState } from 'react';
import CloudinaryUploader from './CloudinaryUploader';
import { CLOUDINARY_ENABLED } from '../../services/cloudinary';

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
    const v = input.trim();
    if (!v) return;
    onChange([...value, v]);
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

      <div className="mt-2 flex gap-2">
        <input
          type="url"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 rounded-full border border-brand-ink-200 bg-white px-4 py-2 text-sm focus:border-brand-orange-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-200"
        />
        <button type="button" onClick={add} className="btn-ghost text-xs">
          + Thêm
        </button>
      </div>

      {/* Cloudinary upload — chỉ cho ảnh, ẩn nếu chưa config env */}
      {type === 'image' && CLOUDINARY_ENABLED && (
        <div className="mt-2">
          <CloudinaryUploader
            multiple
            label="📤 Upload ảnh từ máy"
            onUpload={(urls) => onChange([...(value || []), ...urls])}
          />
        </div>
      )}
    </div>
  );
}
