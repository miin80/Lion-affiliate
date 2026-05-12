// Lazada — Puppeteer + window.runParams (Lazada nhúng JSON state vào HTML).
import { withPage } from '../utils/browser.js';
import { scrapeWithPuppeteer } from './puppeteer-meta.js';
import { parseVND } from '../utils/detect.js';

async function tryLazadaState(url) {
  try {
    return await withPage(async (page) => {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2500));
      return page.evaluate(() => {
        const run = window.__moduleData__ || window.runParams || null;
        if (!run) return null;
        try {
          const data = run.data || run;
          const skuModule = data?.skuModule || {};
          const skuBase = skuModule?.skuBase || {};
          const skuInfo = skuModule?.skuInfos || {};
          const first = Object.values(skuInfo)[0];
          return {
            title: data?.pageModule?.title || skuBase?.name || '',
            description:
              data?.descModule?.description ||
              data?.descModule?.html?.replace(/<[^>]+>/g, ' ') ||
              '',
            images: data?.imageModule?.images || [],
            video: data?.imageModule?.videoUrl || null,
            priceText: first?.price?.salePrice?.text,
            originalPriceText: first?.price?.originalPrice?.text,
          };
        } catch {
          return null;
        }
      });
    });
  } catch {
    return null;
  }
}

export async function scrapeLazada(url) {
  const state = await tryLazadaState(url);
  if (state?.title) {
    return {
      title: state.title,
      description: state.description,
      images: state.images,
      video: state.video,
      price: parseVND(state.priceText),
      originalPrice: parseVND(state.originalPriceText),
    };
  }
  return scrapeWithPuppeteer(url, { waitMs: 4000 });
}
