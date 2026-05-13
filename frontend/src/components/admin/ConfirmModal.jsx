import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

/**
 * ConfirmModal — modal xác nhận hành động nguy hiểm.
 *
 * Props:
 *  - open: boolean
 *  - title: tiêu đề (vd "Xoá vĩnh viễn?")
 *  - message: mô tả hành động sẽ làm
 *  - confirmText: text nút confirm (default "Đồng ý")
 *  - cancelText: text nút huỷ (default "Huỷ")
 *  - danger: bool — nút confirm màu đỏ (default true)
 *  - onConfirm: callback
 *  - onCancel: callback
 *  - busy: bool — disable trong khi xử lý
 */
export default function ConfirmModal({
  open,
  title = 'Xác nhận?',
  message,
  confirmText = 'Đồng ý',
  cancelText = 'Huỷ',
  danger = true,
  onConfirm,
  onCancel,
  busy = false,
}) {
  useEffect(() => {
    if (!open) return;
    const esc = (e) => e.key === 'Escape' && onCancel?.();
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', esc);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <motion.div
            key="sheet"
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-card"
          >
            <h3 className="text-lg font-extrabold">{title}</h3>
            {message && (
              <p className="mt-2 whitespace-pre-line text-sm text-brand-ink-600">{message}</p>
            )}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={onCancel}
                disabled={busy}
                className="rounded-full bg-brand-ink-100 px-5 py-2 text-sm font-semibold text-brand-ink-700 hover:bg-brand-ink-200 disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={busy}
                className={`rounded-full px-5 py-2 text-sm font-bold text-white shadow-cta disabled:opacity-50 ${
                  danger
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-brand-orange-500 hover:bg-brand-orange-600'
                }`}
              >
                {busy ? '⏳ Đang xử lý...' : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
