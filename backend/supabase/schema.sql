-- ============================================================================
-- Lion Affiliate — Supabase Schema
--
-- Run trong: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Sau khi chạy xong, set 2 env trên Render:
--   SUPABASE_URL=https://<project>.supabase.co
--   SUPABASE_SERVICE_ROLE_KEY=<service_role key>
-- Rồi redeploy backend.
-- ============================================================================

-- ============ 1. PRODUCTS ============
-- Lưu full object trong data jsonb. Các cột thường query (status/slug/category)
-- là indexed columns riêng để filter nhanh.
CREATE TABLE IF NOT EXISTS products (
  id              text PRIMARY KEY,
  data            jsonb NOT NULL,
  status          text NOT NULL DEFAULT 'active',
  slug            text,
  category        text,
  source          text NOT NULL DEFAULT 'manual',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  trashed_at      timestamptz
);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- ============ 2. VIDEOS ============
CREATE TABLE IF NOT EXISTS videos (
  id              text PRIMARY KEY,
  data            jsonb NOT NULL,
  status          text NOT NULL DEFAULT 'active',
  "order"         integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  trashed_at      timestamptz
);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_order ON videos("order");

-- ============ 3. CATEGORIES ============
CREATE TABLE IF NOT EXISTS categories (
  id              text PRIMARY KEY,
  data            jsonb NOT NULL,
  status          text NOT NULL DEFAULT 'active',
  "order"         integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  trashed_at      timestamptz
);
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories("order");

-- ============ 4. COLLECTIONS ============
CREATE TABLE IF NOT EXISTS collections (
  id              text PRIMARY KEY,
  data            jsonb NOT NULL,
  status          text NOT NULL DEFAULT 'active',
  "order"         integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  trashed_at      timestamptz
);
CREATE INDEX IF NOT EXISTS idx_collections_status ON collections(status);
CREATE INDEX IF NOT EXISTS idx_collections_order ON collections("order");

-- ============ 5. BLOGS ============
CREATE TABLE IF NOT EXISTS blogs (
  id              text PRIMARY KEY,
  data            jsonb NOT NULL,
  status          text NOT NULL DEFAULT 'active',
  "order"         integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  trashed_at      timestamptz
);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_order ON blogs("order");

-- ============ 6. SITE SETTINGS ============
-- Singleton row (id='singleton') chứa toàn bộ object settings dạng jsonb.
CREATE TABLE IF NOT EXISTS site_settings (
  id              text PRIMARY KEY DEFAULT 'singleton',
  data            jsonb NOT NULL,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============ 7. GOOGLE SHEET SETTINGS ============
CREATE TABLE IF NOT EXISTS google_sheet_settings (
  id              text PRIMARY KEY DEFAULT 'singleton',
  data            jsonb NOT NULL,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============ 8. ANALYTICS STATE ============
-- Singleton blob — giữ tương thích logic cũ (clicks, totalClicks, byDay).
CREATE TABLE IF NOT EXISTS analytics_state (
  id              text PRIMARY KEY DEFAULT 'singleton',
  data            jsonb NOT NULL DEFAULT '{"clicks":{},"totalClicks":0,"lastUpdated":null}'::jsonb,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- Default seed cho categories (sẽ KHÔNG ghi đè nếu đã có data).
-- ============================================================================
INSERT INTO categories (id, data, status, "order") VALUES
  ('cat_all',       '{"id":"cat_all","slug":"all","name":"Tất cả","icon":"✨","status":"active","order":0}'::jsonb, 'active', 0),
  ('cat_deal',      '{"id":"cat_deal","slug":"deal","name":"Deal hot","icon":"🔥","status":"active","order":1}'::jsonb, 'active', 1),
  ('cat_gia_dung',  '{"id":"cat_gia_dung","slug":"gia-dung","name":"Gia dụng","icon":"🏠","status":"active","order":2}'::jsonb, 'active', 2),
  ('cat_lam_dep',   '{"id":"cat_lam_dep","slug":"lam-dep","name":"Làm đẹp","icon":"💄","status":"active","order":3}'::jsonb, 'active', 3),
  ('cat_do_bep',    '{"id":"cat_do_bep","slug":"do-bep","name":"Đồ bếp","icon":"🍳","status":"active","order":4}'::jsonb, 'active', 4),
  ('cat_cong_nghe', '{"id":"cat_cong_nghe","slug":"cong-nghe","name":"Công nghệ","icon":"📱","status":"active","order":5}'::jsonb, 'active', 5),
  ('cat_me_be',     '{"id":"cat_me_be","slug":"me-be","name":"Mẹ & Bé","icon":"🍼","status":"active","order":6}'::jsonb, 'active', 6),
  ('cat_an_vat',    '{"id":"cat_an_vat","slug":"an-vat","name":"Đồ ăn vặt","icon":"🍿","status":"active","order":7}'::jsonb, 'active', 7)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- RLS (Row Level Security) — backend dùng service_role key đã bypass RLS.
-- Nếu sau này muốn cho phép anonymous client đọc trực tiếp, có thể enable:
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "public read active" ON products FOR SELECT USING (status='active');
-- ============================================================================
