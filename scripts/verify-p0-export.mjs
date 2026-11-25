import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const output = process.argv[2] ?? 'out';
const read = path => readFileSync(join(output, path), 'utf8');

for (const locale of ['', 'zh-CN/', 'zh-TW/', 'ja/', 'ko/', 'es/']) {
  const html = read(`${locale}index.html`);
  assert.doesNotMatch(html, /Loading pricing data|正在加载模型定价数据/, `Loading placeholder in ${locale || 'en'}`);
  assert.match(html, /<fieldset disabled=""/, `Simulator is interactive before hydration in ${locale || 'en'}`);
  for (const module of ['calculator', 'smart_router', 'leaderboard']) {
    assert.ok(html.includes(`data-analytics-module="${module}"`), `Missing ${module} in ${locale || 'en'}`);
  }
}

for (const locale of ['', 'zh-CN/']) {
  const html = read(`${locale}deals/index.html`);
  assert.match(html, /<time dateTime="\d{4}-\d{2}-\d{2}">\d{4}-\d{2}-\d{2}<\/time>/);
  assert.doesNotMatch(html, /\bT-\d+\b|\b\d+ days left\b|还剩 \d+ 天/);
}

console.log('Verified simulator HTML in all six locales and absolute Deals dates in en and zh-CN.');
