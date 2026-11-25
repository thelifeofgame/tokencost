import { execFileSync } from 'node:child_process';
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

function getLastCommitMs(relPath) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%ct', '--', relPath], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const sec = Number(out);
    return Number.isFinite(sec) && sec > 0 ? sec * 1000 : 0;
  } catch {
    return 0;
  }
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
    if (destBuf) {
      const srcMtimeMs = fs.statSync(srcPath).mtimeMs;
      const commitMs = getLastCommitMs(path.join('src', 'data', file));
      if (commitMs > 0 && srcMtimeMs <= commitMs) {
        console.log(`[sync-data] Skipped older ${file} (source mtime <= repo commit).`);
        continue;
      }
    }
    fs.writeFileSync(destPath, srcBuf);
    copiedCount += 1;
    console.log(`[sync-data] Synced ${file} -> src/data/${file}`);
  }
}

console.log(`[sync-data] Done (${copiedCount} updated, ${FILES_TO_SYNC.length} checked).`);
