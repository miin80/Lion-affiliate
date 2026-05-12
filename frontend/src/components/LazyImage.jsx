import { useEffect, useRef, useState } from 'react';

/**
 * LazyImage — lazy load + fade-in.
 * - Sử dụng IntersectionObserver để chỉ tải khi vào viewport.
 * - Fallback nếu lỗi: hiển thị placeholder gradient.
 */
export default function LazyImage({
  src,
  alt = '',
  className = '',
  wrapperClassName = '',
  aspect = 'aspect-square',
  fallback = 'https://placehold.co/600x600/f1f5f9/64748b?text=No+image',
  eager = false,
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState(eager);
  const ref = useRef(null);

  useEffect(() => {
    if (eager || visible) return;
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [eager, visible]);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${aspect} ${wrapperClassName}`}
    >
      {!loaded && (
        <div className="absolute inset-0 skeleton" aria-hidden />
      )}
      {visible && (
        <img
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          src={error ? fallback : src}
          alt={alt}
          data-loaded={loaded}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setError(true);
            setLoaded(true);
          }}
          className={`lazy-img absolute inset-0 h-full w-full object-cover ${className}`}
          {...rest}
        />
      )}
    </div>
  );
}
