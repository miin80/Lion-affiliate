import {
  listProducts,
  listActiveProducts,
  getProduct,
  saveProduct,
  deleteProduct,
  setStatus,
} from '../store/products.js';

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
