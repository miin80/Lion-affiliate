/**
 * Skeleton components — placeholder loading animation cho mọi list.
 * Dùng class .skeleton (đã định nghĩa trong index.css với shimmer animation).
 */

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-brand-ink-100">
          <div className="aspect-square skeleton" />
          <div className="space-y-2 p-3">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
            <div className="skeleton h-5 w-2/3 rounded" />
            <div className="skeleton h-7 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function VideoReelsSkeleton({ count = 4 }) {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-hide sm:mx-0 sm:px-0">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-40 shrink-0 overflow-hidden rounded-2xl bg-brand-ink-900 shadow-card sm:w-48"
        >
          <div className="aspect-[9/16] skeleton" />
        </div>
      ))}
    </div>
  );
}

export function CollectionsSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-brand-ink-100">
          <div className="aspect-[4/5] skeleton" />
        </div>
      ))}
    </div>
  );
}

export function ManagerCardListSkeleton({ count = 4, columns = 2 }) {
  const grid = columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3';
  return (
    <div className={`grid gap-3 ${grid}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex gap-3 rounded-2xl bg-white p-3 shadow-card ring-1 ring-brand-ink-100"
        >
          <div className="skeleton h-24 w-24 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-1/4 rounded" />
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
            <div className="skeleton h-5 w-1/3 rounded" />
            <div className="flex gap-1.5">
              <div className="skeleton h-6 w-14 rounded-full" />
              <div className="skeleton h-6 w-14 rounded-full" />
              <div className="skeleton h-6 w-14 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BlogListSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-brand-ink-100">
          <div className="aspect-[16/9] skeleton" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-4 w-20 rounded-full" />
            <div className="skeleton h-5 w-full rounded" />
            <div className="skeleton h-3 w-2/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
