// Tiki có API JSON public — không cần Puppeteer.
import axios from 'axios';

function parseProductId(url) {
  const m = url.match(/-p(\d+)\.html/) || url.match(/products?\/(\d+)/);
  return m ? m[1] : null;
}

export async function scrapeTiki(url) {
  const id = parseProductId(url);
  if (!id) return null;
  const apiUrl = `https://tiki.vn/api/v2/products/${id}`;
  const { data } = await axios.get(apiUrl, {
    timeout: 10000,
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0 Safari/537.36',
    },
  });
  if (!data) return null;
  const images = (data.images || []).map((i) => i.large_url || i.medium_url || i.base_url).filter(Boolean);
  return {
    title: data.name || '',
    description: data.short_description || data.description?.replace(/<[^>]+>/g, ' ').slice(0, 500) || '',
    images,
    video: data.video_url || null,
    price: data.price ?? null,
    originalPrice: data.list_price || data.original_price || null,
  };
}
