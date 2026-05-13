// Google Sheet settings — dual impl: Supabase singleton hoặc JSON file.
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, USE_SUPABASE } from './supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const FILE = path.join(DATA_DIR, 'googleSheetSettings.json');
const TABLE = 'google_sheet_settings';
const SINGLETON_ID = 'singleton';

const DEFAULT = {
  csvUrl: '',
  lastImportAt: null,
  lastImportCount: 0,
};

// ============ JSON impl ============
async function jsonEnsureFile() {
  try {
    await fs.access(FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(DEFAULT, null, 2), 'utf8');
  }
}
async function jsonRead() {
  await jsonEnsureFile();
  try {
    const txt = await fs.readFile(FILE, 'utf8');
    return { ...DEFAULT, ...JSON.parse(txt) };
  } catch {
    return { ...DEFAULT };
  }
}
async function jsonWrite(obj) {
  await fs.writeFile(FILE, JSON.stringify(obj, null, 2), 'utf8');
  return obj;
}

// ============ Supabase impl ============
async function supaRead() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('data')
    .eq('id', SINGLETON_ID)
    .maybeSingle();
  if (error) throw new Error(`[supabase ${TABLE}] ${error.message}`);
  if (!data) {
    await supaWrite(DEFAULT);
    return { ...DEFAULT };
  }
  return { ...DEFAULT, ...(data.data || {}) };
}
async function supaWrite(obj) {
  const { error } = await supabase
    .from(TABLE)
    .upsert(
      { id: SINGLETON_ID, data: obj, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
  if (error) throw new Error(`[supabase ${TABLE}] ${error.message}`);
  return obj;
}

// ============ Public API ============
export async function readSheetSettings() {
  if (USE_SUPABASE) return supaRead();
  return jsonRead();
}

export async function writeSheetSettings(patch) {
  const current = await readSheetSettings();
  const next = { ...current, ...patch };
  if (USE_SUPABASE) return supaWrite(next);
  return jsonWrite(next);
}
