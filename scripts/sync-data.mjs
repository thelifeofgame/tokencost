import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_DATA_DIR = path.join(ROOT, 'src', 'data');
const ANALYST_DIR = path.resolve(ROOT, '..', 'data_analyst');

const FILES_TO_SYNC = [
  'market_radar_events.json',
  'model_pricing_schema.json',
  'market_radar.json',
  'trending_comparisons.json',
  'harness_tools.json',
  'official_deals.json',
];

if (!fs.existsSync(ANALYST_DIR)) {
  console.log(`[sync-data] ${ANALYST_DIR} not found; skipping external sync and using src/data/*.json.`);
  process.exit(0);
}

let copiedCount = 0;
for (const file of FILES_TO_SYNC) {
  const srcPath = path.join(ANALYST_DIR, file);
  const destPath = path.join(SRC_DATA_DIR, file);
  if (!fs.existsSync(srcPath)) {
    console.warn(`[sync-data] Warning: missing source ${srcPath}`);
    continue;
  }
  const srcBuf = fs.readFileSync(srcPath);
  const destBuf = fs.existsSync(destPath) ? fs.readFileSync(destPath) : null;
  if (!destBuf || !srcBuf.equals(destBuf)) {
    fs.writeFileSync(destPath, srcBuf);
    copiedCount += 1;
    console.log(`[sync-data] Synced ${file} -> src/data/${file}`);
  }
}

console.log(`[sync-data] Done (${copiedCount} updated, ${FILES_TO_SYNC.length} checked).`);
