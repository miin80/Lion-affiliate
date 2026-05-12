// Shopee scraper.
// Cách 1 (ưu tiên): gọi internal API JSON từ URL /product/{shopId}/{itemId}.
//                   Hoạt động KHÔNG cần Puppeteer (chỉ axios) — phù hợp Render Free.
// Cách 2 (fallback): Puppeteer đọc DOM/meta — chỉ chạy nếu USE_PUPPETEER=true.
import axios from 'axios';

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

async function tryShopeeApi(url) {
  const ids = parseIds(url);
  if (!ids) {
    console.warn('[shopee] Cannot parse shopId/itemId from URL:', url);
    return null;
  }
  const host = new URL(url).host;
  const apiUrl = `https://${host}/api/v4/item/get?itemid=${ids.itemId}&shopid=${ids.shopId}`;
  console.log(`[shopee] Calling API: ${apiUrl}`);
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
    // Shopee giá nhân với 1e5
    const price = item.price ? item.price / 1e5 : null;
    const priceBefore = item.price_before_discount
      ? item.price_before_discount / 1e5
      : null;
    const videoUrl =
      item.video_info_list?.[0]?.default_format?.url ||
      item.video_info_list?.[0]?.formats?.[0]?.url ||
      null;
    console.log(`[shopee] ✅ Got product: ${item.name?.slice(0, 50)}`);
    return {
      title: item.name || '',
      description: (item.description || '').slice(0, 800),
      images,
      video: videoUrl,
      price,
      originalPrice: priceBefore,
    };
  } catch (err) {
    console.warn('[shopee] API call failed:', err.response?.status, err.message);
    return null;
  }
}

export async function scrapeShopee(url) {
  // 1. Shopee internal API (không cần Puppeteer)
  const apiData = await tryShopeeApi(url);
  if (apiData?.title) return apiData;

  // 2. Fallback Puppeteer (chỉ khi enabled)
  if (USE_PUPPETEER) {
    const { scrapeWithPuppeteer } = await import('./puppeteer-meta.js');
    return scrapeWithPuppeteer(url, { waitMs: 4000 });
  }

  // 3. Không có gì
  return null;
}
