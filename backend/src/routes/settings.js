import { readSettings, writeSettings } from '../store/settings.js';

/** GET /api/site-settings */
export async function getSettingsRoute(_req, res) {
  try {
    const settings = await readSettings();
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** PUT /api/site-settings — body: partial settings (deep merge) */
export async function putSettingsRoute(req, res) {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Body phải là JSON object.' });
    }
    const settings = await writeSettings(req.body);
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
