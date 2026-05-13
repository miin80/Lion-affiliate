// Supabase client — singleton.
// Khởi tạo từ env SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// Nếu thiếu env → USE_SUPABASE = false, store fallback về JSON file (dev mode).
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let client = null;
if (url && key) {
  try {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    console.log('✅ [supabase] Client initialized:', url);
  } catch (err) {
    console.error('❌ [supabase] Init failed:', err.message);
  }
} else {
  console.log('ℹ️  [supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — using JSON file fallback (dev mode).');
}

export const supabase = client;
export const USE_SUPABASE = !!client;
