import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const output = process.argv[2] ?? 'out';
const catalog = JSON.parse(readFileSync(new URL('../src/data/ai_subscriptions.json', import.meta.url), 'utf8'));
const source = JSON.parse(readFileSync(new URL('../src/data/official_deals.json', import.meta.url), 'utf8'));
const paidFields = ['monthlyUSD', 'monthlyUSDMax', 'yearlyUSD', 'monthlyCNY', 'yearlyCNY'];
const nonDealsProducts = new Set(['copilot', 'doubao', 'qianwen']);
const expectedCatalogDate = catalog.lastVerifiedDate ?? source.lastVerifiedDate;
assert.ok(catalog.comparisons.length <= 20);
const sitemap = readFileSync(join(output, 'sitemap.xml'), 'utf8');
for (const product of catalog.products) {
  assert.equal(new URL(product.source.url).protocol, 'https:', `${product.id}: source.url`);
  const isNonDeals = nonDealsProducts.has(product.id);
  for (const plan of product.plans) {
    assert.equal(new URL(plan.url).protocol, 'https:', `${product.id}: plan.url`);
    const presentPaidFields = paidFields.filter(key => plan[key] !== null);
    if (isNonDeals) {
      assert.equal(plan.verifiedAt, expectedCatalogDate, `${product.id}: verifiedAt mismatch`);
      for (const field of presentPaidFields) {
        assert.equal(typeof plan[field], 'number', `${product.id}: ${field} type`);
        assert.ok(Number.isFinite(plan[field]) && plan[field] > 0, `${product.id}: ${field} positive`);
      }
      if (plan.monthlyCNY !== null || plan.yearlyCNY !== null) {
        assert.equal(product.availableInChina, true, `${product.id}: availableInChina must be true for CNY plans`);
      }
    } else if (presentPaidFields.length > 0) {
      const origin = source.providers.find(provider => provider.verifiedDate === plan.verifiedAt
        && [provider.officialSourceUrl, provider.secondaryOfficialUrl].includes(plan.url));
      assert.ok(origin, product.id);
      for (const field of presentPaidFields) {
        const rates = Array.from(origin.regularPrice.matchAll(/\$([\d,.]+)/g), result => Number(result[1].replace(/,/g, '')));
        assert.ok(rates.includes(plan[field]), `${product.id}: ${field}`);
      }
    }
  }
}
const paths = ['', ...catalog.products.map(product => `${product.id}/`),
  ...catalog.comparisons.map(comparison => `compare/${comparison.slug}/`)];
for (const suffix of paths) {
  for (const prefix of ['', 'zh-CN/']) {
    const path = `${prefix}ai-subscriptions/${suffix}`;
    const html = readFileSync(join(output, path, 'index.html'), 'utf8');
    assert.ok(sitemap.includes(`<loc>https://tokencostsai.com/${path}</loc>`), path);
    const languages = Array.from(html.matchAll(/hreflang="([^"]+)"|hrefLang="([^"]+)"/g), match => match[1] ?? match[2]);
    assert.deepEqual(languages.sort(), ['en', 'x-default', 'zh-CN']);
    assert.ok(html.includes('FAQPage'), path);
  }
  for (const locale of ['es','ja','ko','zh-TW']) {
    assert.equal(existsSync(join(output, locale, 'ai-subscriptions', suffix, 'index.html')), false);
  }
}
console.log(`Verified ${paths.length * 2} en and zh-CN pages, limited hreflang, and official-source records for all listed prices.`);
