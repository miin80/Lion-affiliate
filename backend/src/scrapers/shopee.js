// Shopee scraper.
// Cách 1 (ưu tiên): gọi internal API JSON từ URL /product/{shopId}/{itemId}.
// Cách 2: dùng Puppeteer đọc DOM/meta.
import axios from 'axios';
import { scrapeWithPuppeteer } from './puppeteer-meta.js';

const UA_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0 Safari/537.36';

function parseIds(url) {
  // /product/SHOPID/ITEMID hoặc i.SHOPID.ITEMID.html
  let m = url.match(/-i\.(\d+)\.(\d+)/i);
  if (m) return { shopId: m[1], itemId: m[2] };
  m = url.match(/\/product\/(\d+)\/(\d+)/);
  if (m) return { shopId: m[1], itemId: m[2] };
  return null;
}

async function tryShopeeApi(url) {
  const ids = parseIds(url);
  if (!ids) return null;
  const host = new URL(url).host;
  const apiUrl = `https://${host}/api/v4/item/get?itemid=${ids.itemId}&shopid=${ids.shopId}`;
  try {
    const { data } = await axios.get(apiUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': UA_DESKTOP,
        'X-API-SOURCE': 'pc',
        Accept: 'application/json',
        Referer: url,
      },
    });
    const item = data?.data;
    if (!item) return null;
    const cdn = 'https://cf.shopee.vn/file/';
    const images = (item.images || []).map((id) => `${cdn}${id}`);
    // Shopee giá nhân với 1e5
    const price = item.price ? item.price / 1e5 : null;
    const priceBefore = item.price_before_discount
      ? item.price_before_discount / 1e5
      : null;
    return {
      title: item.name || '',
      description: item.description || '',
      images,
      video: item.video_info_list?.[0]?.default_format?.url || null,
      price,
      originalPrice: priceBefore,
    };
  } catch (err) {
    return null;
  }
}

export async function scrapeShopee(url) {
  const apiData = await tryShopeeApi(url);
  if (apiData?.title) return apiData;
  // Fallback Puppeteer
  return scrapeWithPuppeteer(url, { waitMs: 4000 });
}
