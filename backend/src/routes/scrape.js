import { scrape } from '../scrapers/index.js';

// Cache trong RAM 1 giờ — tránh scrape lại cùng 1 URL.
const cache = new Map();
const TTL = 60 * 60 * 1000;

export async function scrapeRoute(req, res) {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Thiếu field `url`.' });
    }
    let normalized;
    try {
      normalized = new URL(url).toString();
    } catch {
      return res.status(400).json({ error: 'URL không hợp lệ.' });
    }

    const cached = cache.get(normalized);
    if (cached && Date.now() - cached.at < TTL) {
      return res.json({ ...cached.data, cached: true });
    }

    const data = await scrape(normalized);
    cache.set(normalized, { at: Date.now(), data });
    res.json(data);
  } catch (err) {
    console.error('[/api/scrape]', err);
    res.status(500).json({ error: err.message || 'Scrape failed' });
  }
}
