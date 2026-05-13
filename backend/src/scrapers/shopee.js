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

async function tryShopeeApi(url) {
  const ids = parseIds(url);
  if (!ids) {
    console.warn('[shopee] Cannot parse shopId/itemId from URL:', url);
    return null;
  }
  const host = new URL(url).host;
  const apiUrl = `https://${host}/api/v4/item/get?itemid=${ids.itemId}&shopid=${ids.shopId}`;
  console.log(`[shopee] API: ${apiUrl}`);
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
    const item = data?.data;
    if (!item) {
      console.warn('[shopee] API response không có data field');
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
      description: (item.description || '').slice(0, 800),
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
    console.warn('[shopee] API call failed:', err.response?.status, err.message);
    return null;
  }
}

/**
 * Fallback: fetch HTML page và parse OG meta + __INITIAL_STATE__ + JSON-LD.
 * Hỗ trợ khi API trả thiếu / bị chặn.
 */
async function tryShopeeHtml(url) {
  console.log(`[shopee-html] Fetch: ${url}`);
  try {
    const { data: html } = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': UA_DESKTOP,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
      },
      maxRedirects: 5,
    });
    const $ = cheerio.load(html);

    // 1. Open Graph
    const og = {
      title: $('meta[property="og:title"]').attr('content') || '',
      description: $('meta[property="og:description"]').attr('content') || '',
      image: $('meta[property="og:image"]').attr('content') || '',
    };

    // 2. <title> tag fallback (Shopee thường dạng "Title | Shopee Việt Nam")
    const docTitle = ($('title').text() || '').split('|')[0].trim();

    // 3. JSON-LD structured data
    const ldImages = [];
    let ldPrice = null;
    let ldRating = null;
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const parsed = JSON.parse($(el).html());
        const nodes = Array.isArray(parsed) ? parsed : [parsed];
        nodes.forEach((n) => {
          if (!n) return;
          if (n['@type'] === 'Product' || n.image) {
            if (Array.isArray(n.image)) ldImages.push(...n.image);
            else if (typeof n.image === 'string') ldImages.push(n.image);
          }
          if (n.offers?.price) ldPrice = Number(n.offers.price) || null;
          if (n.aggregateRating?.ratingValue) {
            ldRating = Math.round(Number(n.aggregateRating.ratingValue) * 10) / 10;
          }
        });
      } catch {}
    });

    const images = [og.image, ...ldImages].filter(Boolean);
    const title = og.title || docTitle || '';

    return {
      title,
      description: og.description || '',
      images,
      price: ldPrice,
      rating: ldRating,
    };
  } catch (err) {
    console.warn('[shopee-html] Fetch failed:', err.response?.status, err.message);
    return null;
  }
}

// Merge 2 partial results — ưu tiên field nào có giá trị thật (truthy).
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
    priceMin: primary.priceMin ?? null,
    priceMax: primary.priceMax ?? null,
    oldPriceMin: primary.oldPriceMin ?? null,
    oldPriceMax: primary.oldPriceMax ?? null,
    discountPercent: primary.discountPercent ?? null,
    rating: primary.rating ?? fallback.rating ?? null,
    ratingCount: primary.ratingCount ?? null,
    sold: primary.sold ?? null,
    soldText: primary.soldText || null,
    category: primary.category || null,
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
  // 1. Shopee internal API — retry tới 3 lần vì Shopee chặn chập chờn.
  // Lần 1 fail → đợi 1.5s → lần 2 → đợi 2.5s → lần 3.
  let apiData = await tryShopeeApi(url);
  if (isIncomplete(apiData)) {
    console.log('[shopee] API attempt 1 failed/incomplete, retrying after 1.5s...');
    await wait(1500);
    apiData = await tryShopeeApi(url);
  }
  if (isIncomplete(apiData)) {
    console.log('[shopee] API attempt 2 failed/incomplete, retrying after 2.5s...');
    await wait(2500);
    apiData = await tryShopeeApi(url);
  }

  // 2. Nếu API vẫn thiếu title/ảnh → fallback HTML
  let htmlData = null;
  if (isIncomplete(apiData)) {
    console.log('[shopee] API exhausted 3 attempts, trying HTML fallback...');
    htmlData = await tryShopeeHtml(url);
  }

  // 3. Merge — API là source chính, HTML chỉ bù fields thiếu.
  let merged = mergeResults(apiData, htmlData);

  // 4. Slug URL fallback cho title (nếu cả 2 trên vẫn không có)
  if (merged && !merged.title) {
    merged.title = titleFromUrl(url) || '';
  }
  if (!merged && (apiData || htmlData)) {
    merged = apiData || htmlData;
    if (!merged.title) merged.title = titleFromUrl(url) || '';
  }

  if (merged?.title || merged?.images?.length) {
    console.log(
      `[shopee] ✅ Final: title="${merged.title?.slice(0, 50)}" imgs=${merged.images?.length || 0} price=${merged.price ?? '-'} range=${merged.priceMin ?? '-'}-${merged.priceMax ?? '-'} disc=${merged.discountPercent ?? '-'}`
    );
    return merged;
  }

  // 5. Puppeteer (chỉ khi enabled)
  if (USE_PUPPETEER) {
    const { scrapeWithPuppeteer } = await import('./puppeteer-meta.js');
    return scrapeWithPuppeteer(url, { waitMs: 4000 });
  }

  return null;
}
