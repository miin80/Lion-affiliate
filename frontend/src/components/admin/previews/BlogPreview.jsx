import PreviewFrame from './PreviewFrame';
import { formatDate } from '../../../utils/format';

/**
 * BlogPreview — card bài viết giống public /blog.
 */
export default function BlogPreview({ blog }) {
  const cover = blog.cover || 'https://placehold.co/800x450/f1f5f9/64748b?text=Cover';
  return (
    <PreviewFrame title="Xem trước Blog card">
      <div className="mx-auto max-w-md">
        <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-brand-ink-100">
          <img
            src={cover}
            alt=""
            className="aspect-[16/9] w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/800x450/fee2e2/991b1b?text=Lỗi+cover';
            }}
          />
          <div className="p-4">
            {blog.tag && (
              <span className="badge bg-brand-orange-100 text-brand-orange-700">
                {blog.tag}
              </span>
            )}
            <h3 className="mt-2 line-clamp-2 text-base font-extrabold">
              {blog.title || '(Tiêu đề bài viết)'}
            </h3>
            {blog.excerpt && (
              <p className="mt-1 line-clamp-2 text-sm text-brand-ink-500">{blog.excerpt}</p>
            )}
            <div className="mt-3 flex items-center justify-between text-xs text-brand-ink-400">
              <span>{blog.author || 'Tác giả'}</span>
              <span>
                {blog.publishedAt ? formatDate(blog.publishedAt) : '—'} ·{' '}
                {blog.readTime || 5} phút đọc
              </span>
            </div>
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}
