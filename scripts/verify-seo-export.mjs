import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [beforePath, afterPath] = process.argv.slice(2);
if (!beforePath || !afterPath) throw new Error('Usage: node scripts/verify-seo-export.mjs <before-out> <after-out>');

function scan(root, validateDates = false) {
  const pages = new Map();
  function walk(directory, relative = '') {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      const suffix = `${relative}${entry.name}`;
      if (entry.isDirectory()) walk(path, `${suffix}/`);
      if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
      const document = readFileSync(path, 'utf8');
      const head = document.slice(0, document.indexOf('</head>'));
      const noindex = /<meta[^>]*name="robots"[^>]*content="[^"]*\bnoindex\b/i.test(head);
      const alternates = Array.from(head.matchAll(/<link[^>]*rel="alternate"[^>]*hrefLang="[^"]+"[^>]*href="([^"]+)"/gi), item => item[1]);
      const route = `/${suffix.replace(/index\.html$/, '')}`;
      const detail = /^(?:\/(?:zh-CN|zh-TW|es|ja|ko))?\/(?:compare|models|calculator)\/[^/]+\/$/.test(route) && route !== '/compare/view/';
      const zh = route.startsWith('/zh-CN/');
      if (validateDates && detail && zh && !noindex) assert.match(document, /价格核实于/);
      pages.set(route, { noindex, alternates, detail });
    }
  }
  walk(root);
  return pages;
}

const before = scan(beforePath);
const after = scan(afterPath, true);
assert.deepEqual([...after.keys()].sort(), [...before.keys()].sort(), 'The set of HTML routes must be preserved.');

const route = href => new URL(href).pathname;
const xml = readFileSync(join(afterPath, 'sitemap.xml'), 'utf8');
const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), match => route(match[1]));
for (const path of urls) assert.equal(after.get(path)?.noindex, false, `Non-indexable or missing sitemap entry: ${path}`);
for (const path of [...xml.matchAll(/rel="alternate"[^>]*href="([^"]+)"/g)].map(match => route(match[1]))) {
  assert.equal(after.get(path)?.noindex, false, `Non-indexable sitemap alternate: ${path}`);
}
for (const [path, result] of after) {
  if (!result.detail) continue;
  if (result.noindex) assert.equal(result.alternates.length, 0, `Unexpected alternates: ${path}`);
  for (const href of result.alternates) assert.equal(after.get(route(href))?.noindex, false, `Bad alternate: ${path} → ${href}`);
}
const count = pages => [...pages.values()].filter(page => !page.noindex).length;
console.log(JSON.stringify({ htmlPaths: after.size, beforeIndexable: count(before), afterIndexable: count(after), sitemap: urls.length }));
