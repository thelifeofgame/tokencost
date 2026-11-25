import { readFileSync, writeFileSync } from 'node:fs';

const [file, threshold = '100'] = process.argv.slice(2);
const minimum = Number(threshold);
if (!file || !Number.isSafeInteger(minimum) || minimum < 1) {
  throw new Error('Usage: node scripts/update-compare-allowlist.mjs <90-day-Search-Console-pages.csv> [minimum-impressions]');
}

function parseCsv(source) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (ch === '"') {
      if (quoted && source[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && ch === ',') {
      row.push(field); field = '';
    } else if (!quoted && (ch === '\r' || ch === '\n')) {
      if (ch === '\r' && source[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else {
      field += ch;
    }
  }
  if (quoted) throw new Error('Invalid CSV: unclosed quote');
  if (row.length || field) rows.push([...row, field]);
  return rows;
}

const rows = parseCsv(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const header = rows.shift()?.map(cell => cell.trim().toLowerCase()) ?? [];
const pathIndex = header.findIndex(field => ['top pages', 'pages', 'page', '网页', '網頁', '热门网页', '熱門網頁'].includes(field));
const impressionsIndex = header.findIndex(field => ['impressions', '展示次数', '展示量', '曝光次數', '曝光'].includes(field));
if (pathIndex < 0 || impressionsIndex < 0) throw new Error('Expected Search Console Pages and Impressions columns.');

const catalog = JSON.parse(readFileSync(new URL('../src/data/model_pricing_schema.json', import.meta.url), 'utf8'));
const models = new Set(catalog.models.map(model => model.modelId));
const specials = new Set(['anthropic-prompt-caching-vs-standard', 'openai-batch-api-vs-standard-api']);
function canonicalSlug(slug) {
  if (specials.has(slug)) return slug;
  const ids = slug.split('-vs-').map(id => id === 'openai-o1' ? 'o1' : id);
  if (ids.length !== 2 || ids[0] === ids[1] || !ids.every(id => models.has(id))) return null;
  if (ids.includes('deepseek-r1') && ids.includes('o1')) return 'deepseek-r1-vs-openai-o1';
  return ids.sort().join('-vs-');
}

const counts = new Map();
for (const row of rows) {
  if (!row[pathIndex]) continue;
  let url;
  try { url = new URL(row[pathIndex]); } catch { continue; }
  if (url.protocol !== 'https:' || !['tokencostsai.com', 'www.tokencostsai.com'].includes(url.hostname)) continue;
  const match = url.pathname.match(/^\/(?:zh-CN\/)?compare\/([a-z0-9._:-]+)\/?$/);
  const slug = match && canonicalSlug(match[1]);
  const impressions = Number(row[impressionsIndex]?.replace(/[,\s]/g, ''));
  if (slug && Number.isSafeInteger(impressions) && impressions > 0) counts.set(slug, (counts.get(slug) ?? 0) + impressions);
}
const path = new URL('../src/data/compare_index_allowlist.json', import.meta.url);
const list = JSON.parse(readFileSync(path, 'utf8'));
const selected = [...counts].filter(([, count]) => count >= minimum).map(([slug]) => slug);
const additions = selected.filter(slug => !list.seed.includes(slug) && !list.searchConsole.includes(slug));
if (additions.length) {
  list.searchConsole = [...list.searchConsole, ...additions].sort();
  writeFileSync(path, JSON.stringify(list, null, 2) + '\n');
}
console.log(`Added ${additions.length} canonical pairs at ≥ ${minimum} impressions from the supplied 90-day export.`);
