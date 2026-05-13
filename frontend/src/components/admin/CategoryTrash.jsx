import { categoriesApi } from '../../services/resources';
import ResourceTrash from './ResourceTrash';

export default function CategoryTrash() {
  return (
    <ResourceTrash
      api={categoriesApi}
      resourceName="category"
      title="Thùng rác Danh mục"
      itemNameField="name"
      renderThumb={(c) => (
        <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-brand-ink-100 text-3xl">
          {c.icon || '🏷'}
        </div>
      )}
      renderMeta={(c) => (
        <div className="text-[10px] text-brand-ink-500">slug: {c.slug}</div>
      )}
    />
  );
}
