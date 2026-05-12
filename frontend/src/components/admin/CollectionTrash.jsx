import { collectionsApi } from '../../services/resources';
import ResourceTrash from './ResourceTrash';

export default function CollectionTrash() {
  return (
    <ResourceTrash
      api={collectionsApi}
      resourceName="collection"
      title="Thùng rác Bộ sưu tập"
      renderThumb={(c) => (
        c.cover ? (
          <img src={c.cover} alt="" className="h-24 w-24 rounded-lg object-cover grayscale" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-brand-ink-100 text-2xl">
            {c.emoji || '📦'}
          </div>
        )
      )}
      renderMeta={(c) => (
        <div className="text-[10px] text-brand-ink-500">
          {c.productSlugs?.length || 0} sản phẩm
        </div>
      )}
    />
  );
}
