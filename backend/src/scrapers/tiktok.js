// TikTok Shop — chỉ dùng Puppeteer. TikTok chặn UA bot khá mạnh.
// Đợi SPA render rồi đọc meta/DOM.
import { scrapeWithPuppeteer } from './puppeteer-meta.js';

export async function scrapeTiktok(url) {
  return scrapeWithPuppeteer(url, { waitMs: 5000 });
}
