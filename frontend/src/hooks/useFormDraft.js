import { useEffect, useRef, useState } from 'react';

const STORAGE_PREFIX = 'lion_affiliate_draft_';

/**
 * useFormDraft — auto-save form draft vào localStorage.
 *
 * Workflow:
 *  1. Mount: check localStorage có draft chưa → trả về hasSavedDraft=true
 *  2. User chọn restore → loadSavedDraft() trả về data đã lưu
 *  3. Trong khi edit → debounce 500ms → tự save vào localStorage
 *  4. Save form thành công → gọi clearDraft() để xoá
 *
 * Params:
 *  - key: unique key (vd 'product_new', 'product_p123')
 *  - draft: object đang edit
 *  - enabled: bật/tắt auto-save (vd false khi modal đóng)
 *
 * Returns:
 *  - hasSavedDraft: boolean — có draft cũ chưa restore
 *  - savedAt: ISO timestamp lúc draft được lưu
 *  - loadSavedDraft(): trả về object draft đã lưu
 *  - clearDraft(): xoá draft khỏi localStorage
 *  - dismissBanner(): chỉ ẩn banner, không xoá draft
 */
export function useFormDraft(key, draft, { enabled = true, debounceMs = 500 } = {}) {
  const storageKey = STORAGE_PREFIX + key;
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const timeoutRef = useRef(null);
  const initRef = useRef(false);

  // Check on mount
  useEffect(() => {
    if (!enabled) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.savedAt && parsed?.data) {
          setHasSavedDraft(true);
          setSavedAt(parsed.savedAt);
        }
      }
    } catch {
      /* ignore */
    }
    initRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, enabled]);

  // Auto-save với debounce
  useEffect(() => {
    if (!enabled || !initRef.current || !draft) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ data: draft, savedAt: new Date().toISOString() })
        );
      } catch {
        /* quota / disabled */
      }
    }, debounceMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [draft, storageKey, enabled, debounceMs]);

  const loadSavedDraft = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw).data;
    } catch {}
    return null;
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setHasSavedDraft(false);
    setSavedAt(null);
  };

  const dismissBanner = () => setBannerDismissed(true);

  return {
    hasSavedDraft: hasSavedDraft && !bannerDismissed,
    savedAt,
    loadSavedDraft,
    clearDraft,
    dismissBanner,
  };
}
