// ============================================================================
//  PRODUCT SCHEMA — Single source of truth cho mọi field của product.
//
//  Mục đích: tránh duplicate logic giữa 3 chỗ:
//    1. backend/src/services/googleSheetService.js (CSV import column aliases)
//    2. backend/src/store/products.js (Supabase rowToProduct mapping)
//    3. backend/src/routes/products.js (validation request body)
//
//  Thêm field mới → chỉ sửa file này → mọi nơi tự pick up.
// ============================================================================

/**
 * Danh sách field của product. Mỗi entry:
 *  - field:   tên field nội bộ (camelCase) — backend dùng
 *  - type:    'string' | 'number' | 'boolean' | 'array' | 'date'
 *  - required: bắt buộc khi save? (true → reject nếu thiếu)
 *  - default: giá trị mặc định khi vắng mặt
 *  - aliases: tên cột Google Sheet chấp nhận (lowercase, không dấu, có thể nhiều)
 *  - sheet:   field hiển thị trong Sheet header (Vietnamese)
 */
export const PRODUCT_FIELDS = [
  {
    field: 'id',
    type: 'string',
    required: false, // backend tự gen nếu thiếu
    default: '',
    aliases: ['id', 'product_id', 'productid'],
    sheet: 'ID',
  },
  {
    field: 'title',
    type: 'string',
    required: true,
    default: '',
    aliases: ['title', 'name', 'tên', 'ten', 'tên sản phẩm', 'tên'],
    sheet: 'Tên sản phẩm',
  },
  {
    field: 'sourceUrl',
    type: 'string',
    required: false,
    default: '',
    aliases: [
      'sourceurl', 'source_url', 'source', 'link gốc', 'linkgoc',
      'link gốc (shopee/tiktok)', 'link goc', 'link goc (shopee/tiktok)',
    ],
    sheet: 'Link gốc (Shopee/TikTok)',
  },
  {
    field: 'affiliateUrl',
    type: 'string',
    required: true,
    default: '',
    aliases: [
      'affiliateurl', 'affiliate_url', 'affiliate', 'link affiliate',
      'buyurl', 'buy_url', 'link affiliate (nút mua)', 'link affiliate (nut mua)',
      'link mua', 'link aff',
    ],
    sheet: 'Link affiliate (nút Mua)',
  },
  {
    field: 'category',
    type: 'string',
    required: false,
    default: 'gia-dung',
    aliases: ['category', 'cat', 'danh mục', 'danhmuc', 'danh muc'],
    sheet: 'Danh mục',
  },
  {
    field: 'price',
    type: 'number',
    required: false,
    default: null,
    aliases: ['price', 'giá', 'gia', 'giá (vnd)', 'gia (vnd)'],
    sheet: 'Giá (VND)',
  },
  {
    field: 'originalPrice',
    type: 'number',
    required: false,
    default: null,
    aliases: [
      'oldprice', 'old_price', 'originalprice', 'original_price',
      'giá gốc', 'giagoc', 'gia goc', 'giá gốc (gạch ngang)',
    ],
    sheet: 'Giá gốc',
  },
  { field: 'priceMin',       type: 'number', required: false, default: null, aliases: ['pricemin', 'price_min', 'giá min'],     sheet: 'Giá Min' },
  { field: 'priceMax',       type: 'number', required: false, default: null, aliases: ['pricemax', 'price_max', 'giá max'],     sheet: 'Giá Max' },
  { field: 'oldPriceMin',    type: 'number', required: false, default: null, aliases: ['oldpricemin', 'old_price_min'],         sheet: 'Giá gốc Min' },
  { field: 'oldPriceMax',    type: 'number', required: false, default: null, aliases: ['oldpricemax', 'old_price_max'],         sheet: 'Giá gốc Max' },
  { field: 'discountPercent',type: 'number', required: false, default: null, aliases: ['discount', 'discountpercent', 'giảm giá'], sheet: 'Discount %' },
  {
    field: 'description',
    type: 'string',
    required: false,
    default: '',
    aliases: ['description', 'desc', 'mô tả', 'mota', 'mô tả ngắn', 'mo ta', 'mo ta ngan'],
    sheet: 'Mô tả ngắn',
  },
  {
    field: 'image',
    type: 'string',
    required: false,
    default: '',
    aliases: ['image', 'img', 'cover', 'ảnh chính', 'anhchinh', 'anh chinh', 'ảnh', 'anh'],
    sheet: 'Ảnh chính',
  },
  {
    field: 'gallery',
    type: 'array',
    required: false,
    default: [],
    aliases: ['gallery', 'images', 'gallery (ảnh phụ)', 'gallery (anh phu)', 'ảnh phụ', 'anh phu'],
    sheet: 'Gallery (ảnh phụ)',
  },
  {
    field: 'video',
    type: 'string',
    required: false,
    default: '',
    aliases: ['video', 'video_url', 'videourl'],
    sheet: 'Video',
  },
  {
    field: 'rating',
    type: 'number',
    required: false,
    default: 4.8,
    aliases: ['rating', 'star', 'sao'],
    sheet: 'Rating',
  },
  {
    field: 'tags',
    type: 'array',
    required: false,
    default: [],
    aliases: ['tags', 'tag'],
    sheet: 'Tags',
  },
  {
    field: 'isHot',
    type: 'boolean',
    required: false,
    default: false,
    aliases: ['ishot', 'is_hot', 'hot', 'hot deal'],
    sheet: 'Hot',
  },
  {
    field: 'isBestSeller',
    type: 'boolean',
    required: false,
    default: false,
    aliases: ['isbestseller', 'is_bestseller', 'bestseller', 'best_seller', 'best seller'],
    sheet: 'Best Seller',
  },
  {
    field: 'status',
    type: 'string',
    required: false,
    default: 'active',
    aliases: ['status', 'trạng thái', 'trangthai', 'trang thai'],
    sheet: 'Trạng thái',
  },
];

// ============================================================================
//  HELPERS (dùng từ scrapers, routes, store)
// ============================================================================

/** Map { camelCaseField: [aliases...] } — dùng trong CSV column matching. */
export const COL_ALIASES = Object.fromEntries(
  PRODUCT_FIELDS.map((f) => [f.field, f.aliases])
);

/** Map { camelCaseField: sheet header text } — dùng khi Apps Script tạo Sheet. */
export const SHEET_HEADERS = PRODUCT_FIELDS.map((f) => ({
  field: f.field,
  display: f.sheet,
}));

/** Required fields list — dùng validate trong saveRoute / bulkSave. */
export const REQUIRED_FIELDS = PRODUCT_FIELDS
  .filter((f) => f.required)
  .map((f) => f.field);

/**
 * Validate product object. Return:
 *  - { ok: true } khi pass
 *  - { ok: false, errors: ['Thiếu title', ...] } khi fail
 */
export function validateProduct(product) {
  if (!product || typeof product !== 'object') {
    return { ok: false, errors: ['product không phải object hợp lệ'] };
  }
  const errors = [];
  for (const f of PRODUCT_FIELDS) {
    if (f.required) {
      const v = product[f.field];
      const isEmpty =
        v === null || v === undefined ||
        (typeof v === 'string' && v.trim() === '') ||
        (Array.isArray(v) && v.length === 0);
      if (isEmpty) errors.push(`Thiếu ${f.field} (${f.sheet}).`);
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}

/**
 * Normalize raw product input về schema chuẩn.
 * Convert kiểu (number/boolean), apply defaults, trim string.
 */
export function normalizeProduct(input) {
  if (!input || typeof input !== 'object') return null;
  const out = {};
  for (const f of PRODUCT_FIELDS) {
    let v = input[f.field];
    if (v === undefined || v === null || v === '') {
      // Apply default chỉ với primitive — array/object default tạo mới mỗi lần
      if (f.type === 'array') out[f.field] = Array.isArray(input[f.field]) ? input[f.field] : [];
      else out[f.field] = f.default;
      continue;
    }
    switch (f.type) {
      case 'number': {
        const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.-]/g, ''));
        out[f.field] = Number.isFinite(n) ? n : f.default;
        break;
      }
      case 'boolean': {
        if (typeof v === 'boolean') out[f.field] = v;
        else {
          const s = String(v).trim().toLowerCase();
          out[f.field] = ['true', '1', 'yes', 'có', 'co', 'x'].includes(s);
        }
        break;
      }
      case 'array': {
        if (Array.isArray(v)) out[f.field] = v;
        else if (typeof v === 'string') {
          out[f.field] = v.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
        } else out[f.field] = f.default;
        break;
      }
      default:
        out[f.field] = typeof v === 'string' ? v.trim() : String(v);
    }
  }
  // Preserve các field schema-less (vd badges, source, platform, createdAt) — không lọc.
  for (const k of Object.keys(input)) {
    if (!(k in out)) out[k] = input[k];
  }
  return out;
}
