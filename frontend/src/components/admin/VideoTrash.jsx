import { videosApi } from '../../services/resources';
import ResourceTrash from './ResourceTrash';

export default function VideoTrash() {
  return (
    <ResourceTrash
      api={videosApi}
      resourceName="video"
      title="Thùng rác Video"
      renderThumb={(v) => (
        <img
          src={v.thumb || 'https://placehold.co/100x180/f1f5f9/64748b?text=?'}
          alt=""
          className="h-28 w-20 rounded-lg object-cover grayscale"
        />
      )}
      renderMeta={(v) => (
        <div className="text-[10px] text-brand-ink-500">
          {v.views || '—'} · {v.duration || '—'}
        </div>
      )}
    />
  );
}
