import {
  listProducts,
  listActiveProducts,
  getProduct,
  saveProduct,
  deleteProduct,
  setStatus,
  bulkSetStatus,
} from '../store/products.js';
import { scrape } from '../scrapers/index.js';

/** GET /api/products — chỉ trả sản phẩm status=active (public). */
export async function listRoute(_req, res) {
  try {
    const products = await listActiveProducts();
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** GET /api/products/admin — trả TẤT CẢ (active + hidden), dùng cho /admin. */
export async function listAdminRoute(_req, res) {
  try {
    const products = await listProducts();
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getRoute(req, res) {
  try {
    const p = await getProduct(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json({ product: p });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/products/bulk
 * Body: { products: [...] }
 * Dùng cho Google Apps Script đồng bộ trực tiếp. Upsert theo id.
 */
export async function bulkSaveRoute(req, res) {
  try {
    const list = Array.isArray(req.body?.products) ? req.body.products : [];
    if (!list.length) {
      return res.status(400).json({ error: 'products[] rỗng' });
    }
    const imported = [];
    const errors = [];
    for (let i = 0; i < list.length; i++) {
      const p = list[i] || {};
      try {
        if (!p.title) throw new Error('Thiếu title');
        if (!p.affiliateUrl) throw new Error('Thiếu affiliateUrl');
        if (!Array.isArray(p.images)) p.images = p.image ? [p.image] : [];
        if (!Array.isArray(p.tags)) p.tags = [];
        if (!Array.isArray(p.badges)) p.badges = ['reviewed'];
        if (!p.source) p.source = 'sheet';
        const saved = await saveProduct(p);
        imported.push({ id: saved.id, title: saved.title });
      } catch (err) {
        errors.push({ index: i, title: p.title, error: err.message });
      }
    }
    res.json({
      total: list.length,
      imported: imported.length,
      errors: errors.length,
      details: { imported, errors },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function saveRoute(req, res) {
  try {
    const body = req.body || {};
    if (!body.affiliateUrl) {
      return res.status(400).json({ error: 'Thiếu affiliateUrl (link khách bấm mua).' });
    }
    if (!body.title) {
      return res.status(400).json({ error: 'Thiếu title (tên sản phẩm).' });
    }
    if (!Array.isArray(body.images)) body.images = [];
    if (!Array.isArray(body.videos)) body.videos = body.video ? [body.video] : [];
    if (!Array.isArray(body.tags)) body.tags = [];
    if (!Array.isArray(body.badges)) body.badges = ['reviewed'];

    const saved = await saveProduct(body);
    res.json({ product: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** PATCH /api/products/:id/status — body: { status: 'active' | 'hidden' } */
export async function statusRoute(req, res) {
  try {
    const { status } = req.body || {};
    const updated = await setStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    res.json({ product: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteRoute(req, res) {
  try {
    const ok = await deleteProduct(req.params.id);
    res.json({ ok });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/products/sheet-sync — endpoint dành riêng Google Sheet Apps Script.
 * Body: { rows: [{ rowNum, id?, sourceUrl, affiliateUrl, title?, ...partial overrides }] }
 *
 * Flow per row:
 *  1. Nếu title rỗng + có sourceUrl → tự gọi scrape(sourceUrl) để lấy data.
 *  2. Merge: override từ Sheet thắng > scraped fills gaps.
 *  3. Upsert vào DB (saveProduct).
 *  4. Trả lại enriched product để Apps Script writeback vào Sheet.
 *
 * Kết quả: user chỉ cần paste 2 URL trong Sheet, gọi endpoint này từ Apps Script
 * → web tự có sản phẩm + Sheet tự fill các ô trống.
 */
export async function sheetSyncRoute(req, res) {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (!rows.length) return res.status(400).json({ error: 'rows[] rỗng' });

    const results = [];
    for (const row of rows) {
      const result = { rowNum: row.rowNum, ok: false };
      try {
        const sourceUrl = (row.sourceUrl || '').trim();
        const affiliateUrl = (row.affiliateUrl || '').trim() || sourceUrl;
        if (!sourceUrl && !affiliateUrl) {
          throw new Error('Thiếu sourceUrl hoặc affiliateUrl');
        }

        // Scrape nếu title rỗng (user mới paste URL, chưa fill thông tin)
        let scraped = null;
        const titleProvided = !!(row.title && String(row.title).trim());
        if (!titleProvided && sourceUrl) {
          try {
            scraped = await scrape(sourceUrl);
          } catch (err) {
            console.warn('[sheet-sync] scrape fail row', row.rowNum, err.message);
          }
        }

        // Merge: row (Sheet) wins, scraped fills gaps
        const pickArr = (sheetVal, scrapedVal) => {
          if (Array.isArray(sheetVal) && sheetVal.length) return sheetVal;
          if (Array.isArray(scrapedVal) && scrapedVal.length) return scrapedVal;
          return [];
        };
        const pickNum = (sheetVal, scrapedVal) => {
          const n = Number(sheetVal);
          if (Number.isFinite(n) && n > 0) return n;
          const m = Number(scrapedVal);
          return Number.isFinite(m) && m > 0 ? m : null;
        };

        const merged = {
          id: row.id || undefined,
          title: (row.title && String(row.title).trim()) || scraped?.title || '',
          sourceUrl,
          affiliateUrl,
          category: row.category || 'gia-dung',
          description: row.description || scraped?.description || '',
          price: pickNum(row.price, scraped?.price),
          originalPrice: pickNum(row.originalPrice, scraped?.originalPrice),
          priceMin: pickNum(row.priceMin, scraped?.priceMin),
          priceMax: pickNum(row.priceMax, scraped?.priceMax),
          oldPriceMin: pickNum(row.oldPriceMin, scraped?.oldPriceMin),
          oldPriceMax: pickNum(row.oldPriceMax, scraped?.oldPriceMax),
          discountPercent: pickNum(row.discountPercent, scraped?.discountPercent),
          rating: pickNum(row.rating, scraped?.rating) || 4.8,
          ratingCount: pickNum(row.ratingCount, scraped?.ratingCount) || 0,
          sold: pickNum(row.sold, scraped?.sold) || 0,
          soldText: row.soldText || scraped?.soldText || '',
          images: pickArr(row.images, scraped?.images),
          videos: pickArr(row.videos, scraped?.video ? [scraped.video] : []),
          tags: Array.isArray(row.tags) ? row.tags : [],
          badges: Array.isArray(row.badges) ? row.badges : ['reviewed'],
          status: row.status || 'active',
          source: 'sheet',
          platform: scraped?.platform || row.platform || 'other',
        };

        if (!merged.title) {
          throw new Error('Không có title — scraper không lấy được và user chưa nhập.');
        }
        if (!merged.affiliateUrl) {
          throw new Error('Thiếu affiliateUrl (link mua).');
        }

        const saved = await saveProduct(merged);
        result.ok = true;
        result.id = saved.id;
        result.scrapeOk = !!scraped?.title;
        // Trả lại đủ field để Apps Script writeback vào Sheet
        result.product = {
          id: saved.id,
          title: saved.title,
          image: saved.images?.[0] || '',
          gallery: saved.images?.slice(1) || [],
          video: saved.videos?.[0] || '',
          price: saved.price,
          originalPrice: saved.originalPrice,
          priceMin: saved.priceMin,
          priceMax: saved.priceMax,
          oldPriceMin: saved.oldPriceMin,
          oldPriceMax: saved.oldPriceMax,
          discountPercent: saved.discountPercent,
          description: saved.description,
          rating: saved.rating,
          soldText: saved.soldText,
          category: saved.category,
          status: saved.status,
        };
      } catch (err) {
        result.error = err.message;
      }
      results.push(result);
    }

    res.json({
      total: rows.length,
      ok: results.filter((r) => r.ok).length,
      errors: results.filter((r) => !r.ok).length,
      results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** PATCH /api/products/bulk  body: { ids: [...], status: 'active'|'hidden'|'trash' } */
export async function bulkStatusRoute(req, res) {
  try {
    const { ids, status } = req.body || {};
    const result = await bulkSetStatus(ids, status);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
