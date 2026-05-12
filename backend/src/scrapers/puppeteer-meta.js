// Scraper dùng Puppeteer — đợi SPA render xong rồi đọc meta + DOM.
// Hoạt động với Shopee / TikTok Shop / Lazada (các site SPA + chống bot nhẹ).
import { withPage } from '../utils/browser.js';
import { parseVND } from '../utils/detect.js';

const PRICE_SELECTORS = [
  '[class*="product-price"]',
  '[class*="ProductPrice"]',
  '[class*="price"]',
  '[itemprop="price"]',
  'meta[property="product:price:amount"]',
];

const TITLE_SELECTORS = [
  'h1',
  '[class*="product-title"]',
  '[class*="ProductTitle"]',
  'meta[property="og:title"]',
];

export async function scrapeWithPuppeteer(url, { waitMs = 3000 } = {}) {
  return withPage(async (page) => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Scroll mượt để trigger lazy load + tracker shopee
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let h = 0;
        const id = setInterval(() => {
          window.scrollBy(0, 400);
          h += 400;
          if (h > 3000) {
            clearInterval(id);
            resolve();
          }
        }, 200);
      });
    });
    await new Promise((r) => setTimeout(r, waitMs));

    const data = await page.evaluate(
      ({ PRICE_SELECTORS, TITLE_SELECTORS }) => {
        const pick = (selectors) => {
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (!el) continue;
            const content = el.getAttribute?.('content');
            const text = el.textContent?.trim();
            if (content) return content;
            if (text) return text;
          }
          return null;
        };

        const og = (prop) =>
          document.querySelector(`meta[property="${prop}"]`)?.content ||
          document.querySelector(`meta[name="${prop}"]`)?.content ||
          null;

        // Collect images
        const imgs = new Set();
        [
          'meta[property="og:image"]',
          'meta[property="og:image:secure_url"]',
          'meta[name="twitter:image"]',
        ].forEach((sel) => {
          document.querySelectorAll(sel).forEach((m) => {
            const c = m.getAttribute('content');
            if (c) imgs.add(c);
          });
        });
        // Image gallery DOM (heuristic)
        document
          .querySelectorAll(
            'img[src*="shopee"], img[src*="lzd-img"], img[src*="lazada"], img[src*="tiktokcdn"], img[src*="tiki"]'
          )
          .forEach((el) => {
            const src = el.currentSrc || el.src;
            if (src && /\.(jpg|jpeg|png|webp)/i.test(src)) imgs.add(src);
          });

        // Video — thẻ <video> hoặc og:video
        const ogVideo =
          og('og:video') ||
          og('og:video:url') ||
          og('og:video:secure_url');
        const videoEl = document.querySelector('video[src], video source[src]');
        const video =
          ogVideo || videoEl?.getAttribute('src') || videoEl?.src || null;

        return {
          title:
            og('og:title') ||
            pick(TITLE_SELECTORS) ||
            document.title ||
            '',
          description:
            og('og:description') ||
            og('description') ||
            document
              .querySelector('meta[name="description"]')
              ?.getAttribute('content') ||
            '',
          priceText: pick(PRICE_SELECTORS),
          images: Array.from(imgs).slice(0, 8),
          video,
        };
      },
      { PRICE_SELECTORS, TITLE_SELECTORS }
    );

    return {
      title: data.title?.trim() || '',
      description: data.description?.trim() || '',
      images: data.images || [],
      video: data.video || null,
      price: parseVND(data.priceText),
      originalPrice: null,
    };
  });
}
