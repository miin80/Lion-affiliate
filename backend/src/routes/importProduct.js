// POST /api/import-product
// Body: { sourceUrl, affiliateUrl }
// Behaviour:
//   - Validate đầu vào
//   - Scrape metadata từ sourceUrl (1 lần, không lưu)
//   - Trả về preview kèm affiliateUrl để frontend lưu sau khi admin chỉnh sửa
//   - Nếu scrape fail vẫn trả về object rỗng để frontend cho nhập tay
import { scrape } from '../scrapers/index.js';

export async function importProductRoute(req, res) {
  try {
    const { sourceUrl, affiliateUrl } = req.body || {};
    if (!sourceUrl || typeof sourceUrl !== 'string') {
      return res.status(400).json({ error: 'Thiếu sourceUrl (link gốc sản phẩm).' });
    }
    if (!affiliateUrl || typeof affiliateUrl !== 'string') {
      return res.status(400).json({ error: 'Thiếu affiliateUrl (link khách bấm mua).' });
    }
    try {
      new URL(sourceUrl);
      new URL(affiliateUrl);
    } catch {
      return res.status(400).json({ error: 'sourceUrl hoặc affiliateUrl không hợp lệ.' });
    }

    let scraped;
    try {
      scraped = await scrape(sourceUrl);
    } catch (err) {
      console.warn('[import-product] scrape failed:', err.message);
      scraped = {
        ok: false,
        platform: 'other',
        title: '',
        description: '',
        price: null,
        originalPrice: null,
        images: [],
        video: null,
        fallback: true,
        message: 'Không lấy được dữ liệu tự động. Vui lòng nhập tay.',
      };
    }

    // Schema preview chuẩn frontend mong đợi
    res.json({
      ok: scraped.ok !== false,
      product: {
        sourceUrl,
        affiliateUrl,
        title: scraped.title || '',
        description: scraped.description || '',
        price: scraped.price ?? null,
        originalPrice: scraped.originalPrice ?? null,
        // Range giá Shopee variant — null cho platform khác (frontend tự fallback)
        priceMin: scraped.priceMin ?? null,
        priceMax: scraped.priceMax ?? null,
        oldPriceMin: scraped.oldPriceMin ?? null,
        oldPriceMax: scraped.oldPriceMax ?? null,
        discountPercent: scraped.discountPercent ?? null,
        rating: scraped.rating ?? null,
        ratingCount: scraped.ratingCount ?? null,
        sold: scraped.sold ?? null,
        soldText: scraped.soldText || null,
        category: scraped.category || null,
        brand: scraped.brand || null,
        image: scraped.images?.[0] || null,            // cover
        gallery: scraped.images?.slice(1) || [],       // additional
        images: scraped.images || [],                  // full array (compat)
        video: scraped.video || null,
        videos: scraped.video ? [scraped.video] : [],
        platform: scraped.platform || 'other',
      },
      message: scraped.message || null,
      fallback: scraped.fallback === true,
    });
  } catch (err) {
    console.error('[import-product]', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
}
