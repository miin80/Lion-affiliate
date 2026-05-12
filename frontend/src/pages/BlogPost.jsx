import { Link, useParams } from 'react-router-dom';
import Seo from '../components/Seo';
import LazyImage from '../components/LazyImage';
import ProductCard from '../components/ProductCard';
import { getBlogPost } from '../data/blogPosts';
import { getProductsByIds } from '../data/products';
import { formatDate } from '../utils/format';

export default function BlogPost() {
  const { slug } = useParams();
  const post = getBlogPost(slug);
  if (!post) {
    return (
      <div className="container-page py-20 text-center">
        <Seo title="Không tìm thấy bài viết" />
        <h1 className="text-2xl font-extrabold">Không tìm thấy bài viết</h1>
        <Link to="/blog" className="btn-primary mt-6">← Về Blog</Link>
      </div>
    );
  }
  const products = getProductsByIds(post.productSlugs);

  return (
    <>
      <Seo title={post.title} description={post.excerpt} image={post.cover} type="article" />

      <article className="container-page mx-auto mt-8 max-w-3xl">
        <span className="badge bg-brand-orange-100 text-brand-orange-700">{post.tag}</span>
        <h1 className="mt-3 text-2xl font-extrabold leading-tight sm:text-4xl">{post.title}</h1>
        <div className="mt-2 text-xs text-brand-ink-500">
          {post.author} · {formatDate(post.publishedAt)} · {post.readTime} phút đọc
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl">
          <LazyImage src={post.cover} alt={post.title} aspect="aspect-[16/9]" eager />
        </div>

        <div className="prose prose-slate mt-6 max-w-none text-base leading-relaxed text-brand-ink-700">
          {post.content.split('\n').map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return null;
            if (trimmed.startsWith('## ')) {
              return <h2 key={i} className="mt-8 text-xl font-extrabold sm:text-2xl">{trimmed.replace('## ', '')}</h2>;
            }
            if (trimmed.startsWith('- ')) {
              return <li key={i} className="ml-5 list-disc">{trimmed.replace('- ', '')}</li>;
            }
            return <p key={i} className="mt-3" dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
          })}
        </div>

        {products.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-extrabold">🛒 Sản phẩm trong bài</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
