/**
 * DraftBanner — hiển thị banner khôi phục draft chưa lưu.
 *
 * Props:
 *  - savedAt: ISO timestamp
 *  - onRestore(): callback khi user bấm Khôi phục
 *  - onDiscard(): callback khi user bấm Xoá draft
 */
export default function DraftBanner({ savedAt, onRestore, onDiscard }) {
  const timeStr = savedAt
    ? new Date(savedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
    : '—';
  return (
    <div className="rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-200 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          <div className="font-bold text-amber-800">📝 Khôi phục nội dung chưa lưu?</div>
          <div className="text-[11px] text-amber-700">
            Có 1 draft chưa lưu được tự lưu lúc <strong>{timeStr}</strong>.
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRestore}
            className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
          >
            ♻️ Khôi phục
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 hover:bg-amber-50"
          >
            🗑 Xoá draft
          </button>
        </div>
      </div>
    </div>
  );
}
