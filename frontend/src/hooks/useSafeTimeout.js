import { useEffect, useRef, useCallback } from 'react';

/**
 * useSafeTimeout — setTimeout với cleanup tự động khi component unmount.
 * Tránh "Can't perform state update on unmounted component" warning + memory leak.
 *
 * Usage:
 *   const safeTimeout = useSafeTimeout();
 *   safeTimeout(() => setToast(''), 2500);
 *
 * Hook tự cancel mọi timer khi unmount. Cũng cancel timer cũ nếu gọi lại
 * (debounce-style — chỉ 1 timer active tại 1 thời điểm).
 */
export function useSafeTimeout() {
  const timerRef = useRef(null);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback((fn, ms) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(fn, ms);
  }, []);
}
