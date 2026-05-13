import PreviewFrame from './PreviewFrame';
import { ArrowRight } from '../../icons';

/**
 * CollectionPreview — card bộ sưu tập giống public.
 */
export default function CollectionPreview({ collection }) {
  const cover = collection.cover || 'https://placehold.co/400x500/f1f5f9/64748b?text=Cover';
  return (
    <PreviewFrame title="Xem trước Collection card">
      <div className="mx-auto max-w-xs">
        <div className="group relative block overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-brand-ink-100">
          <img
            src={cover}
            alt=""
            className="aspect-[4/5] w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/400x500/fee2e2/991b1b?text=Lỗi+cover';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-4">
            <div className="text-xl">{collection.emoji || '✨'}</div>
            <h3 className="mt-0.5 line-clamp-1 text-sm font-extrabold sm:text-base">
              {collection.title || '(Tiêu đề bộ sưu tập)'}
            </h3>
            <p className="mt-0.5 line-clamp-2 text-[10px] text-white/80 sm:text-xs">
              {collection.desc || 'Mô tả ngắn về bộ sưu tập...'}
            </p>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-brand-ink-900 sm:text-xs">
              Xem bộ sưu tập <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        </div>
        {collection.productSlugs?.length > 0 && (
          <p className="mt-2 text-center text-[11px] text-brand-ink-500">
            Bao gồm {collection.productSlugs.length} sản phẩm
          </p>
        )}
      </div>
    </PreviewFrame>
  );
}
