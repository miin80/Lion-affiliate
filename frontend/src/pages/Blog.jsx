import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import LazyImage from '../components/LazyImage';
import { formatDate } from '../utils/format';
import { isAuthenticated } from '../services/auth';
import { useResource } from '../hooks/useResource';
import { blogsApi } from '../services/resources';
import { BLOG_POSTS as MOCK_BLOG } from '../data/blogPosts';
import { SHOW_DEMO_DATA } from '../utils/demoFlag';

export default function Blog() {
  // Production: rỗng = empty state. Dev: mock fallback.
  const fallback = SHOW_DEMO_DATA ? MOCK_BLOG : [];
  const { items } = useResource(blogsApi, fallback, 'lion_affiliate_blogs_v2');
  return (
    <>
      <Seo title="Blog Review" description="Top sản phẩm nên mua, review chi tiết, so sánh." />
      <section className="container-page mt-8">
        <h1 className="text-2xl font-extrabold sm:text-3xl">📝 Blog Review</h1>
        <p className="mt-1 text-sm text-brand-ink-500">
          Top sản phẩm nên mua · Review chi tiết · So sánh
        </p>
      </section>

      {items.length === 0 && (
        <section className="container-page mt-6">
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-brand-ink-50 p-10 text-center">
            <div className="text-5xl">📝</div>
            <p className="max-w-md text-sm text-brand-ink-500">
              Chưa có bài viết nào. Hãy thêm bài review trong trang quản trị.
            </p>
            <Link
              to={isAuthenticated() ? '/admin' : '/admin/login'}
              className="btn-primary mt-2 text-xs"
            >
              🚪 Vào trang quản trị
            </Link>
          </div>
        </section>
      )}

      <section className="container-page mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((post) => (
          <Link
            key={post.slug || post.id}
            to={`/blog/${post.slug}`}
            className="group overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-brand-ink-100 transition hover:-translate-y-1 hover:shadow-card-hover"
          >
            <LazyImage
              src={post.cover}
              alt={post.title}
              aspect="aspect-[16/9]"
              className="transition-transform duration-500 group-hover:scale-105"
            />
            <div className="p-4">
              <span className="badge bg-brand-orange-100 text-brand-orange-700">{post.tag}</span>
              <h3 className="mt-2 line-clamp-2 text-base font-extrabold">{post.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-brand-ink-500">{post.excerpt}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-brand-ink-400">
                <span>{post.author}</span>
                <span>{formatDate(post.publishedAt)} · {post.readTime} phút đọc</span>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </>
  );
}
