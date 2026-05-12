import { CATEGORIES as MOCK_CATS } from '../data/categories';
import { useResource } from '../hooks/useResource';
import { categoriesApi } from '../services/resources';

export default function CategoryTabs({ active, onChange, sort, onSortChange }) {
  const { items } = useResource(categoriesApi, MOCK_CATS, 'lion_affiliate_categories_v2');
  return (
    <div className="container-page mt-6 sm:mt-8">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-brand-ink-700">Danh mục</h3>
        <SortDropdown value={sort} onChange={onSortChange} />
      </div>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:px-0">
        {items.map((c) => {
          const isActive = active === c.slug;
          return (
            <button
              key={c.slug || c.id}
              onClick={() => onChange(c.slug)}
              className={[
                'flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all',
                isActive
                  ? 'border-transparent bg-brand-ink-900 text-white shadow'
                  : 'border-brand-ink-200 bg-white text-brand-ink-700 hover:border-brand-orange-300 hover:text-brand-orange-600',
              ].join(' ')}
            >
              <span>{c.icon}</span>
              {c.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SortDropdown({ value, onChange }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-full border border-brand-ink-200 bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-brand-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-orange-300"
      >
        <option value="hot">🔥 Hot nhất</option>
        <option value="new">✨ Mới nhất</option>
        <option value="price-asc">💸 Giá thấp → cao</option>
        <option value="price-desc">💸 Giá cao → thấp</option>
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-ink-400">▾</span>
    </div>
  );
}
