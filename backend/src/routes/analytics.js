import { trackClick, getSummary } from '../store/analytics.js';

/** POST /api/analytics/click  body: { type, id, action? } - PUBLIC (no auth) */
export async function clickRoute(req, res) {
  try {
    const { type, id, action } = req.body || {};
    if (!type || !id) {
      return res.status(400).json({ error: 'Thiếu type hoặc id.' });
    }
    const updated = await trackClick({ type, id, action });
    res.json({ ok: true, total: updated?.total || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** GET /api/analytics/summary - admin only */
export async function summaryRoute(_req, res) {
  try {
    res.json(await getSummary());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
