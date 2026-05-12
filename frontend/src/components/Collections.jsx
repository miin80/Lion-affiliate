import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import LazyImage from './LazyImage';
import { COLLECTIONS as MOCK_COLLECTIONS } from '../data/collections';
import { useResource } from '../hooks/useResource';
import { collectionsApi } from '../services/resources';
import { ArrowRight } from './icons';

export default function Collections() {
  const { items } = useResource(collectionsApi, MOCK_COLLECTIONS);
  if (!items.length) return null;
  return (
    <section className="container-page mt-10 sm:mt-14">
      <div className="mb-4">
        <h2 className="text-xl font-extrabold sm:text-2xl">📚 Bộ sưu tập của mình</h2>
        <p className="text-xs text-brand-ink-500 sm:text-sm">
          Các bundle mình tự curate theo chủ đề — gọn ý, dễ chọn.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {items.map((c, i) => (
          <motion.div
            key={c.slug || c.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Link
              to={`/collection/${c.slug}`}
              className="group relative block overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-brand-ink-100 transition hover:-translate-y-1 hover:shadow-card-hover"
            >
              <LazyImage
                src={c.cover}
                alt={c.title}
                aspect="aspect-[4/5]"
                className="transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-4">
                <div className="text-xl">{c.emoji}</div>
                <h3 className="mt-0.5 line-clamp-1 text-sm font-extrabold sm:text-base">{c.title}</h3>
                <p className="mt-0.5 line-clamp-2 text-[10px] text-white/80 sm:text-xs">{c.desc}</p>
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-brand-ink-900 sm:text-xs">
                  Xem bộ sưu tập <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
