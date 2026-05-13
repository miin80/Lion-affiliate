import { blogsApi } from '../../services/resources';
import ResourceTrash from './ResourceTrash';

export default function BlogTrash() {
  return (
    <ResourceTrash
      api={blogsApi}
      resourceName="blog"
      title="Thùng rác Blog"
      renderThumb={(b) => (
        b.cover ? (
          <img src={b.cover} alt="" loading="lazy" className="h-20 w-32 rounded-lg object-cover grayscale" />
        ) : (
          <div className="flex h-20 w-32 items-center justify-center rounded-lg bg-brand-ink-100 text-xl">📝</div>
        )
      )}
      renderMeta={(b) => (
        <div className="text-[10px] text-brand-ink-500">
          {b.tag || '—'} · {b.author || '—'}
        </div>
      )}
    />
  );
}
