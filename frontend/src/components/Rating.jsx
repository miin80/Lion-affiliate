export default function Rating({ value = 0, count, size = 'sm' }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const stars = Array.from({ length: 5 }, (_, i) => {
    if (i < full) return 'full';
    if (i === full && half) return 'half';
    return 'empty';
  });
  const sz = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex items-center">
        {stars.map((s, i) => (
          <Star key={i} type={s} className={sz} />
        ))}
      </div>
      <span className="text-xs font-semibold text-brand-ink-700">{value.toFixed(1)}</span>
      {typeof count === 'number' && (
        <span className="text-xs text-brand-ink-500">({count.toLocaleString('vi-VN')})</span>
      )}
    </div>
  );
}

function Star({ type, className }) {
  const fill =
    type === 'full' ? '#f97316' : type === 'half' ? 'url(#half)' : '#e2e8f0';
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id="half" x1="0" x2="1" y1="0" y2="0">
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="50%" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>
      <path
        fill={fill}
        d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7L12 17.3 5.7 21.2l1.7-7L2 9.5l7.1-.6L12 2z"
      />
    </svg>
  );
}
