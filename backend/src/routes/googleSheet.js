import {
  readSheetSettings,
  writeSheetSettings,
} from '../store/sheetSettings.js';
import { fetchAndPreview, normalizeCsvUrl } from '../services/googleSheetService.js';
import { saveProduct } from '../store/products.js';

/** GET /api/google-sheet/settings */
export async function getSheetSettingsRoute(_req, res) {
  try {
    const s = await readSheetSettings();
    res.json({ settings: s });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** PUT /api/google-sheet/settings  body: { csvUrl?, pushWebAppUrl? } */
export async function putSheetSettingsRoute(req, res) {
  try {
    const body = req.body || {};
    const patch = {};
    if (typeof body.csvUrl === 'string') {
      patch.csvUrl = normalizeCsvUrl(body.csvUrl);
    }
    if (typeof body.pushWebAppUrl === 'string') {
      patch.pushWebAppUrl = body.pushWebAppUrl.trim();
    }
    if (!Object.keys(patch).length) {
      return res.status(400).json({ error: 'Thiếu field cần update.' });
    }
    const saved = await writeSheetSettings(patch);
    res.json({ settings: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/google-sheet/preview
 * Body: { csvUrl? }  — nếu không truyền sẽ dùng URL đã lưu.
 * Trả về preview rows.
 */
export async function previewSheetRoute(req, res) {
  try {
    let csvUrl = req.body?.csvUrl;
    if (!csvUrl) {
      const s = await readSheetSettings();
      csvUrl = s.csvUrl;
    }
    if (!csvUrl) {
      return res.status(400).json({ error: 'Chưa có Google Sheet CSV URL. Hãy lưu URL trước.' });
    }
    const result = await fetchAndPreview(csvUrl);
    res.json(result);
  } catch (err) {
    console.error('[sheet preview]', err);
    res.status(400).json({ error: err.message || 'Không fetch được Sheet.' });
  }
}

/**
 * POST /api/google-sheet/import
 * Body: { csvUrl?, selectedIds?: [csv row index numbers] }
 *  - csvUrl: optional override, mặc định dùng URL đã lưu
 *  - selectedIds: nếu pass, chỉ import các row có rowIndex trong list này.
 *                  Không pass → import tất cả row có status=active và không lỗi.
 * Trả về: { imported, skipped, errors, total }
 */
export async function importSheetRoute(req, res) {
  try {
    let csvUrl = req.body?.csvUrl;
    if (!csvUrl) {
      const s = await readSheetSettings();
      csvUrl = s.csvUrl;
    }
    if (!csvUrl) {
      return res.status(400).json({ error: 'Chưa có Google Sheet CSV URL.' });
    }
    const { rows } = await fetchAndPreview(csvUrl);
    const selected = Array.isArray(req.body?.selectedIds) ? req.body.selectedIds : null;

    // Import TẤT CẢ rows hợp lệ (cả active + hidden) — Sheet là source of truth cho status.
    // Sản phẩm trong Sheet status=hidden → backend lưu với status=hidden (ẩn khỏi web).
    // Sản phẩm Sheet status=active → backend lưu với status=active (hiện trên web).
    const toImport = rows.filter((r) => {
      if (r.errors.length) return false;
      if (selected && !selected.includes(r.rowIndex)) return false;
      return true;
    });

    const importedItems = [];
    const errorItems = [];

    for (const r of toImport) {
      try {
        const saved = await saveProduct({ ...r.product, source: 'sheet' });
        importedItems.push({ id: saved.id, title: saved.title, rowIndex: r.rowIndex });
      } catch (err) {
        errorItems.push({ rowIndex: r.rowIndex, error: err.message, title: r.product.title });
      }
    }

    await writeSheetSettings({
      lastImportAt: new Date().toISOString(),
      lastImportCount: importedItems.length,
    });

    res.json({
      total: rows.length,
      imported: importedItems.length,
      skipped: rows.length - toImport.length,
      errors: errorItems.length,
      details: { importedItems, errorItems },
    });
  } catch (err) {
    console.error('[sheet import]', err);
    res.status(500).json({ error: err.message });
  }
}
