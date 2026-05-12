// Scraper generic — fetch HTML rồi đọc Open Graph + JSON-LD.
// Nhanh, không cần Puppeteer. Phù hợp các site không phải SPA.
import axios from 'axios';
import * as cheerio from 'cheerio';
import { parseVND } from '../utils/detect.js';

const UA = 'Mozilla/5.0 (compatible; ReviewHubBot/1.0; +https://reviewhub.example.com)';

export async function scrapeGeneric(url) {
  const { data: html } = await axios.get(url, {
    timeout: 15000,
    maxRedirects: 5,
    headers: {
      'User-Agent': UA,
      'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
    },
  });

  const $ = cheerio.load(html);

  // JSON-LD product
  const jsonLd = parseJsonLd($);
  const ogTitle = $('meta[property="og:title"]').attr('content');
  const ogDesc =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content');
  const ogImg = $('meta[property="og:image"]').attr('content');
  const ogVideo =
    $('meta[property="og:video"]').attr('content') ||
    $('meta[property="og:video:url"]').attr('content');
  const twImg = $('meta[name="twitter:image"]').attr('content');

  const images = [];
  if (jsonLd?.image) {
    (Array.isArray(jsonLd.image) ? jsonLd.image : [jsonLd.image]).forEach((i) => images.push(i));
  }
  if (ogImg) images.push(ogImg);
  if (twImg) images.push(twImg);

  // Có nhiều site dùng các meta thừa: og:image:secure_url, og:image:width...
  $('meta[property="og:image"]').each((_, el) => {
    const c = $(el).attr('content');
    if (c && !images.includes(c)) images.push(c);
  });

  return {
    title: jsonLd?.name || ogTitle || $('title').text().trim() || '',
    description: jsonLd?.description || ogDesc || '',
    images: dedupe(images).slice(0, 8),
    video: ogVideo || jsonLd?.video?.contentUrl || null,
    price: parseVND(jsonLd?.offers?.price || jsonLd?.offers?.lowPrice),
    originalPrice: parseVND(jsonLd?.offers?.highPrice),
  };
}

function parseJsonLd($) {
  let result = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (result) return;
    try {
      const text = $(el).contents().text();
      const data = JSON.parse(text);
      const arr = Array.isArray(data) ? data : [data];
      for (const item of arr) {
        if (!item) continue;
        const type = item['@type'];
        if (type === 'Product' || (Array.isArray(type) && type.includes('Product'))) {
          result = item;
          return;
        }
      }
    } catch {
      /* ignore */
    }
  });
  return result;
}

function dedupe(arr) {
  return [...new Set(arr.filter(Boolean))];
}
