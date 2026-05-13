// Shopee scraper.
// Fallback chain:
//  1. Internal API JSON (/api/v4/item/get) — không cần Puppeteer.
//  2. HTML page fetch + parse Open Graph + __INITIAL_STATE__ + JSON-LD.
//  3. URL slug decode (lấy title từ slug nếu pattern là /<slug>-i.<shop>.<item>).
//  4. Puppeteer (chỉ chạy nếu USE_PUPPETEER=true).
// Trả null nếu tất cả fail → frontend cho admin nhập tay.
import axios from 'axios';
import * as cheerio from 'cheerio';

const USE_PUPPETEER = String(process.env.USE_PUPPETEER ?? 'true') === 'true';

const UA_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0 Safari/537.36';
const UA_MOBILE =
  'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0 Mobile Safari/537.36';
const UA_FACEBOOK = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';

function parseIds(url) {
  // Pattern 1: /product/SHOPID/ITEMID
  let m = url.match(/\/product\/(\d+)\/(\d+)/);
  if (m) return { shopId: m[1], itemId: m[2] };
  // Pattern 2: name-i.SHOPID.ITEMID hoặc name-i.SHOPID.ITEMID.html
  m = url.match(/-i\.(\d+)\.(\d+)/i);
  if (m) return { shopId: m[1], itemId: m[2] };
  // Pattern 3: query string ?shopid=X&itemid=Y
  try {
    const u = new URL(url);
    const shopId = u.searchParams.get('shopid') || u.searchParams.get('shop_id');
    const itemId = u.searchParams.get('itemid') || u.searchParams.get('item_id');
    if (shopId && itemId) return { shopId, itemId };
  } catch {}
  return null;
}

// Shopee giá nhân với 1e5 — chia ra đồng VND.
function priceFrom(raw) {
  if (typeof raw !== 'number' || raw <= 0) return null;
  return raw / 1e5;
}

// "20800" → "20k+", "1500000" → "1M+", "150" → "150".
function formatSold(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) {
    const x = v / 1_000_000;
    return `${x >= 10 ? Math.floor(x) : x.toFixed(1).replace('.0', '')}M+`;
  }
  if (v >= 1000) return `${Math.floor(v / 1000)}k+`;
  return String(v);
}

// Lấy title từ slug URL: ...Tinh-Dau-Tram-i.123.456 → "Tinh Dau Tram"
function titleFromUrl(url) {
  try {
    const path = decodeURIComponent(new URL(url).pathname);
    const m = path.match(/\/([^/]+)-i\.\d+\.\d+/i);
    if (!m) return null;
    return m[1].replace(/-+/g, ' ').trim();
  } catch {
    return null;
  }
}

// Thử endpoint API. `pdp` = endpoint mới PDP (/api/v4/pdp/get_pc), `item` = endpoint cũ (/api/v4/item/get).
async function tryShopeeApi(url, variant = 'item') {
  const ids = parseIds(url);
  if (!ids) {
    console.warn('[shopee] Cannot parse shopId/itemId from URL:', url);
    return null;
  }
  const host = new URL(url).host;
  const apiUrl =
    variant === 'pdp'
      ? `https://${host}/api/v4/pdp/get_pc?item_id=${ids.itemId}&shop_id=${ids.shopId}&detail_level=0`
      : `https://${host}/api/v4/item/get?itemid=${ids.itemId}&shopid=${ids.shopId}`;
  console.log(`[shopee] API (${variant}): ${apiUrl}`);
  try {
    const { data } = await axios.get(apiUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': UA_DESKTOP,
        'X-API-SOURCE': 'pc',
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
        Referer: url,
        Origin: `https://${host}`,
      },
    });
    // PDP endpoint nest data dưới data.data.item
    const item = variant === 'pdp' ? data?.data?.item : data?.data;
    if (!item) {
      console.warn(`[shopee] API (${variant}) response không có data field`);
      return null;
    }

    const cdn = 'https://cf.shopee.vn/file/';
    const images = (item.images || []).map((id) => `${cdn}${id}`);

    const price = priceFrom(item.price);
    const priceMin = priceFrom(item.price_min);
    const priceMax = priceFrom(item.price_max);
    const originalPrice = priceFrom(item.price_before_discount);
    const oldPriceMin = priceFrom(item.price_min_before_discount);
    const oldPriceMax = priceFrom(item.price_max_before_discount);

    const discountPercent =
      typeof item.raw_discount === 'number' && item.raw_discount > 0
        ? item.raw_discount
        : null;

    const ratingStar = item.item_rating?.rating_star;
    const rating =
      typeof ratingStar === 'number' && ratingStar > 0
        ? Math.round(ratingStar * 10) / 10
        : null;
    const rcArr = item.item_rating?.rating_count || [];
    const ratingCount = Array.isArray(rcArr) && rcArr.length ? rcArr[0] || 0 : 0;

    const sold = item.historical_sold ?? item.sold ?? 0;
    const soldText = sold ? formatSold(sold) : null;

    const cats = item.categories || [];
    const category = cats.length ? cats[cats.length - 1]?.display_name || null : null;

    const videoUrl =
      item.video_info_list?.[0]?.default_format?.url ||
      item.video_info_list?.[0]?.formats?.[0]?.url ||
      null;

    return {
      title: item.name || '',
      description: (item.description || '').slice(0, 4000),
      images,
      video: videoUrl,
      price,
      originalPrice,
      priceMin,
      priceMax,
      oldPriceMin,
      oldPriceMax,
      discountPercent,
      rating,
      ratingCount,
      sold,
      soldText,
      category,
    };
  } catch (err) {
    console.warn(`[shopee] API (${variant}) failed:`, err.response?.status, err.message);
    return null;
  }
}

// Build URL ảnh từ Shopee image ID. Shopee CDN serve WebP — append .webp
// để browser load đúng MIME type (giống F12 hiện trên trang Shopee).
const CDN = 'https://down-vn.img.susercontent.com/file/';
function imageUrlFromId(id) {
  if (!id || typeof id !== 'string') return null;
  if (id.startsWith('http')) {
    // URL đã có sẵn → append .webp nếu chưa có extension
    return /\.(jpe?g|png|webp|gif)$/i.test(id) ? id : id + '.webp';
  }
  return CDN + id + '.webp';
}

/**
 * Fetch HTML mobile Shopee (m.shopee.vn) → parse <script type="text/mfe-initial-data">
 * → cachedMap chứa FULL product JSON (title, ảnh, rating, mô tả, brand, ...).
 *
 * Phát hiện: Shopee mobile site SSR data dạng JSON inline cho SEO + share.
 * Là cách auto-grab data đáng tin nhất khi API trực tiếp bị 403.
 *
 * Note: Shopee deliberately strip `product_price.price` / `historical_sold` khỏi
 * BFF response public — 2 field này admin phải nhập tay.
 */
// Multiple mobile UAs để retry — Shopee đôi khi serve khác cho UA khác.
const UA_MOBILES = [
  'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0 Mobile Safari/537.36',
];

async function fetchMobileHtml(url) {
  for (let i = 0; i < UA_MOBILES.length; i++) {
    const ua = UA_MOBILES[i];
    try {
      const res = await axios.get(url, {
        timeout: 20000,
        headers: {
          'User-Agent': ua,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
          Referer: 'https://shopee.vn/',
        },
        maxRedirects: 5,
        validateStatus: () => true,
      });
      if (
        res.status === 200 &&
        typeof res.data === 'string' &&
        res.data.includes('mfe-initial-data')
      ) {
        console.log(`[shopee-mobile-bff] UA #${i} success, html=${res.data.length}`);
        return res.data;
      }
      console.warn(
        `[shopee-mobile-bff] UA #${i} (${ua.includes('iPhone') ? 'iPhone' : ua.includes('Pixel') ? 'Pixel' : 'Samsung'}) status=${res.status} len=${res.data?.length || 0} has-mfe=${typeof res.data === 'string' && res.data.includes('mfe-initial-data')}`
      );
    } catch (err) {
      console.warn(`[shopee-mobile-bff] UA #${i} error:`, err.message);
    }
  }
  return null;
}

async function tryShopeeMobileBff(url) {
  console.log(`[shopee-mobile-bff] Fetch: ${url}`);
  try {
    const html = await fetchMobileHtml(url);
    if (!html) return null;
    const scriptMatch = html.match(
      /<script[^>]*type="text\/mfe-initial-data"[^>]*>([\s\S]*?)<\/script>/
    );
    if (!scriptMatch) {
      console.warn('[shopee-mobile-bff] Không tìm thấy mfe-initial-data script');
      return null;
    }

    let json;
    try {
      json = JSON.parse(scriptMatch[1]);
    } catch (e) {
      console.warn('[shopee-mobile-bff] JSON parse fail:', e.message);
      return null;
    }

    const cachedMap = json?.initialState?.DOMAIN_PDP?.data?.PDP_BFF_DATA?.cachedMap;
    if (!cachedMap) {
      console.warn('[shopee-mobile-bff] cachedMap rỗng');
      return null;
    }
    const firstKey = Object.keys(cachedMap)[0];
    if (!firstKey) return null;
    const inner = cachedMap[firstKey];
    const item = inner.item || {};
    const productImages = inner.product_images || {};
    const productReview = inner.product_review || inner.item?.item_rating || {};
    const productPrice = inner.product_price || {};

    // Title
    const title = (item.title || '').trim();

    // Images: ưu tiên product_images.images (full gallery), fallback item.image
    const imageIds = Array.isArray(productImages.images)
      ? productImages.images
      : item.image
      ? [item.image]
      : [];
    const images = imageIds.map(imageUrlFromId).filter(Boolean);

    // Video
    const videoUrl =
      productImages.video?.default_format?.url ||
      productImages.video?.formats?.[0]?.url ||
      null;

    // Description — Shopee dạng:
    //  - string thuần (Maybelline, ...)
    //  - JSON string {"paragraph_list":[{"type":0,"text":"..."}, ...]} (Sachi, ...)
    //  - object trực tiếp paragraph_list
    // Parse paragraph_list → join text từng đoạn = newline (giống bố cục Shopee).
    function stringifyDesc(raw) {
      if (!raw) return '';
      let val = raw;
      // Nếu là string thử parse JSON paragraph_list
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed.startsWith('{') && trimmed.includes('paragraph_list')) {
          try { val = JSON.parse(trimmed); } catch {}
        } else {
          return val;
        }
      }
      // Nếu là object có paragraph_list → join text
      if (val && typeof val === 'object') {
        if (Array.isArray(val.paragraph_list)) {
          return val.paragraph_list
            .map((p) => (typeof p?.text === 'string' ? p.text : ''))
            .filter(Boolean)
            .join('\n');
        }
        if (Array.isArray(val)) {
          return val.map((p) => (typeof p?.text === 'string' ? p.text : '')).filter(Boolean).join('\n');
        }
        if (typeof val.content === 'string') return val.content;
        if (typeof val.text === 'string') return val.text;
        try { return JSON.stringify(val); } catch { return ''; }
      }
      return String(val || '');
    }
    const description = stringifyDesc(item.rich_text_description || item.description).slice(0, 4000);

    // Rating + count
    const rs = productReview.rating_star || item.item_rating?.rating_star;
    const rating = typeof rs === 'number' && rs > 0 ? Math.round(rs * 10) / 10 : null;
    const rcArr = productReview.rating_count || item.item_rating?.rating_count || [];
    const ratingCount = Array.isArray(rcArr) && rcArr.length ? rcArr[0] || 0 : 0;

    // Sold — usually null (Shopee strip)
    const sold = productReview.historical_sold || productReview.global_sold || null;

    // Price — usually null (Shopee strip) — vẫn check phòng khi có
    const priceFrom = (raw) => (typeof raw === 'number' && raw > 0 ? raw / 1e5 : null);
    const price = priceFrom(productPrice.price);
    const originalPrice = priceFrom(productPrice.price_before_discount);

    // Brand → label
    const brand = item.brand || null;

    console.log(
      `[shopee-mobile-bff] ✅ title="${title.slice(0, 40)}" imgs=${images.length} rating=${rating} brand=${brand}`
    );

    return {
      title,
      description,
      images,
      video: videoUrl,
      price,
      originalPrice,
      rating,
      ratingCount,
      sold,
      soldText: null,
      brand,
      category: null,
    };
  } catch (err) {
    console.warn('[shopee-mobile-bff] failed:', err.message);
    return null;
  }
}

// Phân biệt ảnh promo/banner vs ảnh sản phẩm thật.
// Shopee đặt og:image = banner marketing (file/promo-dim-..., voucher graphic) chứ không phải
// ảnh chai/hộp sản phẩm. Filter cứng để không cho fallback ra ảnh banner.
function isPromoImageUrl(url) {
  if (!url) return false;
  const s = url.toLowerCase();
  return /promo-dim|sourcebanner|banner|voucher|coupon|ssfe|cms-banner/i.test(s);
}

// Phát hiện Shopee SEO blurb auto-gen ("Mua X giá tốt. Mua hàng qua mạng uy tín... XEM NGAY!")
// Đây KHÔNG phải mô tả thật của sản phẩm — bỏ qua.
function isSeoBlurb(text) {
  if (!text) return false;
  const s = text.trim();
  // Mẫu: "Mua <title> giá tốt. Mua hàng qua mạng uy tín, tiện lợi. Shopee đảm bảo..."
  return (
    /^Mua\s.+giá tốt\.\s*Mua hàng qua mạng/i.test(s) ||
    /Shopee đảm bảo nhận hàng/i.test(s) ||
    /XEM NGAY!?\s*$/i.test(s)
  );
}

/**
 * Open Graph fallback — chỉ dùng khi mobile BFF không work.
 * Trả về kèm flag `isPromo` + `isSeoBlurb` để merge step quyết định:
 *  - Nếu mobile BFF succeed có ảnh/desc thật → skip promo/blurb (filter strict).
 *  - Nếu mobile BFF fail hoàn toàn → vẫn dùng promo banner + blurb làm fallback
 *    (còn hơn form trắng — user có thể xoá tay).
 */
async function tryShopeeHtml(url) {
  console.log(`[shopee-html] Fetch as fb-bot: ${url}`);
  try {
    const res = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': UA_FACEBOOK,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
      },
      maxRedirects: 5,
      validateStatus: () => true,
    });
    if (res.status !== 200 || typeof res.data !== 'string') return null;
    const html = res.data;
    const $ = cheerio.load(html);
    const og = {
      title: $('meta[property="og:title"]').attr('content') || '',
      description: $('meta[property="og:description"]').attr('content') || '',
      image: $('meta[property="og:image"]').attr('content') || '',
    };
    const docTitle = ($('title').text() || '').split('|')[0].trim();
    const cleanTitle = (t) =>
      (t || '').replace(/\s*[|·-]\s*Shopee.*$/i, '').replace(/\s*Mua ngay tại Shopee.*$/i, '').trim();
    const title = cleanTitle(og.title) || cleanTitle(docTitle) || '';
    const images = og.image ? [og.image] : [];
    const imagePromo = images.length > 0 && isPromoImageUrl(images[0]);
    const description = og.description || '';
    const descSeoBlurb = isSeoBlurb(description);
    console.log(
      `[shopee-html] title="${title?.slice(0, 40)}" img=${og.image ? (imagePromo ? 'promo' : 'real') : 'none'} desc=${descSeoBlurb ? 'SEO-blurb' : 'real'}`
    );
    return { title, description, images, _imagePromo: imagePromo, _descSeoBlurb: descSeoBlurb };
  } catch (err) {
    console.warn('[shopee-html] failed:', err.message);
    return null;
  }
}

// Merge 2 partial results — ưu tiên field nào có giá trị thật từ primary, fallback bù field thiếu.
function mergeResults(primary, fallback) {
  if (!primary && !fallback) return null;
  if (!primary) return fallback;
  if (!fallback) return primary;
  return {
    title: primary.title || fallback.title || '',
    description: primary.description || fallback.description || '',
    images: primary.images?.length ? primary.images : fallback.images || [],
    video: primary.video || fallback.video || null,
    price: primary.price ?? fallback.price ?? null,
    originalPrice: primary.originalPrice ?? fallback.originalPrice ?? null,
    priceMin: primary.priceMin ?? fallback.priceMin ?? null,
    priceMax: primary.priceMax ?? fallback.priceMax ?? null,
    oldPriceMin: primary.oldPriceMin ?? fallback.oldPriceMin ?? null,
    oldPriceMax: primary.oldPriceMax ?? fallback.oldPriceMax ?? null,
    discountPercent: primary.discountPercent ?? fallback.discountPercent ?? null,
    rating: primary.rating ?? fallback.rating ?? null,
    ratingCount: primary.ratingCount ?? fallback.ratingCount ?? null,
    sold: primary.sold ?? fallback.sold ?? null,
    soldText: primary.soldText || fallback.soldText || null,
    category: primary.category || fallback.category || null,
    brand: primary.brand || fallback.brand || null,
  };
}

function isIncomplete(data) {
  if (!data) return true;
  if (!data.title) return true;
  if (!data.images?.length) return true;
  return false;
}

// Sleep helper
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function scrapeShopee(url) {
  // 1. Thử endpoint API /api/v4/item/get (cũ, gần đây hay 403)
  let apiData = await tryShopeeApi(url, 'item');

  // 2. Nếu fail → thử endpoint /api/v4/pdp/get_pc (mới)
  if (isIncomplete(apiData)) {
    console.log('[shopee] item endpoint incomplete, trying PDP endpoint...');
    apiData = await tryShopeeApi(url, 'pdp');
  }

  // 3. Vẫn fail → MOBILE BFF (parse script JSON từ m.shopee.vn HTML)
  //    Đây là cách reliable nhất khi API bị chặn — Shopee SSR full data inline.
  let bffData = null;
  if (isIncomplete(apiData)) {
    console.log('[shopee] API blocked, trying mobile BFF (inline JSON state)...');
    bffData = await tryShopeeMobileBff(url);
  }

  // 4. Fallback cuối: HTML Facebook bot (chỉ OG meta — không có gallery)
  let htmlData = null;
  if (isIncomplete(apiData) && isIncomplete(bffData)) {
    console.log('[shopee] Mobile BFF cũng fail, fallback HTML FB bot...');
    htmlData = await tryShopeeHtml(url);
  }

  // Merge chain: apiData (đủ giá nếu may) > bffData (gallery/rating/desc) > htmlData (OG basic)
  // Note: Shopee chặn ALL API + redirect Puppeteer sang /verify/traffic/error → KHÔNG có
  // cách nào auto lấy giá miễn phí từ server. User dùng "📋 Dán giá nhanh" (1 paste)
  // hoặc bookmarklet (1 click trong tab Shopee) để fill giá.
  let merged = mergeResults(apiData, bffData);

  if (htmlData) {
    // Smart filter: nếu bff/api đã có ảnh thật → bỏ promo image của html khỏi merge.
    //                Nếu chưa có gì → vẫn nhận promo (còn hơn form trắng — user xoá tay).
    const hasImages = (merged?.images?.length || 0) > 0;
    const hasDesc = (merged?.description || '').length > 0;
    const htmlSafe = { ...htmlData };
    if (hasImages && htmlData._imagePromo) htmlSafe.images = [];
    if (hasDesc && htmlData._descSeoBlurb) htmlSafe.description = '';
    merged = mergeResults(merged, htmlSafe);
  }

  // Slug URL fallback cho title
  if (merged && !merged.title) {
    merged.title = titleFromUrl(url) || '';
  }
  if (!merged && (apiData || bffData || htmlData)) {
    merged = apiData || bffData || htmlData;
    if (!merged.title) merged.title = titleFromUrl(url) || '';
  }

  if (merged?.title || merged?.images?.length) {
    console.log(
      `[shopee] ✅ Final: title="${merged.title?.slice(0, 50)}" imgs=${merged.images?.length || 0} price=${merged.price ?? '-'} range=${merged.priceMin ?? '-'}-${merged.priceMax ?? '-'} disc=${merged.discountPercent ?? '-'} rating=${merged.rating ?? '-'} desc=${merged.description?.length || 0}ch`
    );
    return merged;
  }

  return null;
}
