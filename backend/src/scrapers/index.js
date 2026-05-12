import { detectPlatform } from '../utils/detect.js';
import { scrapeGeneric } from './generic.js';
import { scrapeShopee } from './shopee.js';
import { scrapeTiktok } from './tiktok.js';
import { scrapeLazada } from './lazada.js';
import { scrapeTiki } from './tiki.js';

const USE_PUPPETEER = String(process.env.USE_PUPPETEER ?? 'true') === 'true';

/**
 * Dispatch theo platform.
 * Trả về schema chuẩn:
 * { title, description, price, originalPrice, images[], video, platform, affiliateUrl, ok }
 */
export async function scrape(url) {
  const platform = detectPlatform(url);

  let data;
  try {
    if (platform === 'shopee' && USE_PUPPETEER) data = await scrapeShopee(url);
    else if (platform === 'tiktok' && USE_PUPPETEER) data = await scrapeTiktok(url);
    else if (platform === 'lazada' && USE_PUPPETEER) data = await scrapeLazada(url);
    else if (platform === 'tiki') data = await scrapeTiki(url);
    else data = await scrapeGeneric(url);
  } catch (err) {
    console.warn(`[scrape] ${platform} fail, fallback generic:`, err.message);
    try {
      data = await scrapeGeneric(url);
    } catch (err2) {
      console.warn(`[scrape] generic also fail:`, err2.message);
      data = null;
    }
  }

  if (!data) {
    return {
      ok: false,
      platform,
      affiliateUrl: url,
      title: '',
      description: '',
      price: null,
      originalPrice: null,
      images: [],
      video: null,
      fallback: true,
      message: 'Không lấy được metadata. Vui lòng tự nhập thông tin sản phẩm.',
    };
  }

  return {
    ok: true,
    platform,
    affiliateUrl: url,
    title: data.title || '',
    description: data.description || '',
    price: data.price ?? null,
    originalPrice: data.originalPrice ?? null,
    images: Array.isArray(data.images) ? data.images.filter(Boolean) : [],
    video: data.video || null,
  };
}
