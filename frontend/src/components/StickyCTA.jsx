import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from './icons';
import { SITE } from '../config/site';

/**
 * Sticky CTA chỉ hiện trên mobile sau khi cuộn quá 400px.
 * Mặc định trỏ tới Follow link — user có thể đổi prop `href`/`label`.
 */
export default function StickyCTA({
  href = SITE.followUrl,
  label = 'Theo dõi mình trên TikTok',
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.a
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-16 left-3 right-3 z-30 flex items-center justify-between rounded-full bg-gradient-brand px-5 py-3 text-sm font-extrabold text-white shadow-cta sm:hidden"
        >
          <span>{label}</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25">
            <ArrowRight className="h-4 w-4" />
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
