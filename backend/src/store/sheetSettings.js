// Lưu Google Sheet CSV URL vào googleSheetSettings.json
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const FILE = path.join(DATA_DIR, 'googleSheetSettings.json');

const DEFAULT = {
  csvUrl: '',
  lastImportAt: null,
  lastImportCount: 0,
};

async function ensureFile() {
  try {
    await fs.access(FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(DEFAULT, null, 2), 'utf8');
  }
}

export async function readSheetSettings() {
  await ensureFile();
  try {
    const txt = await fs.readFile(FILE, 'utf8');
    return { ...DEFAULT, ...JSON.parse(txt) };
  } catch {
    return { ...DEFAULT };
  }
}

export async function writeSheetSettings(patch) {
  const current = await readSheetSettings();
  const next = { ...current, ...patch };
  await fs.writeFile(FILE, JSON.stringify(next, null, 2), 'utf8');
  return next;
}
