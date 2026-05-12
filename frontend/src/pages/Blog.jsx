import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import LazyImage from '../components/LazyImage';
import { BLOG_POSTS } from '../data/blogPosts';
import { formatDate } from '../utils/format';

export default function Blog() {
  return (
    <>
      <Seo title="Blog Review" description="Top sản phẩm nên mua, review chi tiết, so sánh." />
      <section className="container-page mt-8">
        <h1 className="text-2xl font-extrabold sm:text-3xl">📝 Blog Review</h1>
        <p className="mt-1 text-sm text-brand-ink-500">
          Top sản phẩm nên mua · Review chi tiết · So sánh
        </p>
      </section>

      <section className="container-page mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {BLOG_POSTS.map((post) => (
          <Link
            key={post.slug}
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
              <span className="badge bg-brand-orange-100 text-brand-orange-700">
                {post.tag}
              </span>
              <h3 className="mt-2 line-clamp-2 text-base font-extrabold">
                {post.title}
              </h3>
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
