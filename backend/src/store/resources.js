// Khởi tạo store cho 4 resources: videos, categories, collections, blogs.
// Mỗi store hỗ trợ dual impl: Supabase (production) hoặc JSON file (dev fallback).
import { createStore } from './genericStore.js';

const DEFAULT_CATEGORIES = [
  { id: 'cat_all',       slug: 'all',       name: 'Tất cả',    icon: '✨', order: 0, status: 'active' },
  { id: 'cat_deal',      slug: 'deal',      name: 'Deal hot',  icon: '🔥', order: 1, status: 'active' },
  { id: 'cat_gia_dung',  slug: 'gia-dung',  name: 'Gia dụng',  icon: '🏠', order: 2, status: 'active' },
  { id: 'cat_lam_dep',   slug: 'lam-dep',   name: 'Làm đẹp',   icon: '💄', order: 3, status: 'active' },
  { id: 'cat_do_bep',    slug: 'do-bep',    name: 'Đồ bếp',    icon: '🍳', order: 4, status: 'active' },
  { id: 'cat_cong_nghe', slug: 'cong-nghe', name: 'Công nghệ', icon: '📱', order: 5, status: 'active' },
  { id: 'cat_me_be',     slug: 'me-be',     name: 'Mẹ & Bé',   icon: '🍼', order: 6, status: 'active' },
  { id: 'cat_an_vat',    slug: 'an-vat',    name: 'Đồ ăn vặt', icon: '🍿', order: 7, status: 'active' },
];

export const videosStore = createStore({
  filename: 'videos.json',
  table: 'videos',
  defaults: [],
});

export const categoriesStore = createStore({
  filename: 'categories.json',
  table: 'categories',
  defaults: DEFAULT_CATEGORIES,
});

export const collectionsStore = createStore({
  filename: 'collections.json',
  table: 'collections',
  defaults: [],
});

export const blogsStore = createStore({
  filename: 'blogs.json',
  table: 'blogs',
  defaults: [],
});
