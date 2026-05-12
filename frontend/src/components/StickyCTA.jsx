import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from './icons';
import { useSiteSettings } from '../hooks/useSiteSettings';

/**
 * Sticky CTA chỉ hiện trên mobile sau khi cuộn quá 400px.
 * Dùng follow button từ site settings (admin có thể đổi text/link).
 */
export default function StickyCTA({ href, label }) {
  const { settings } = useSiteSettings();
  const follow = settings.buttons?.follow || {};
  const resolvedHref = href || follow.url;
  const resolvedLabel = label || follow.text || 'Theo dõi mình';
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && resolvedHref && (
        <motion.a
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          href={resolvedHref}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-16 left-3 right-3 z-30 flex items-center justify-between rounded-full bg-gradient-brand px-5 py-3 text-sm font-extrabold text-white shadow-cta sm:hidden"
        >
          <span>{resolvedLabel}</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25">
            <ArrowRight className="h-4 w-4" />
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
