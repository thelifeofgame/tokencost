import { readFileSync, writeFileSync } from 'node:fs';

const read = name => JSON.parse(readFileSync(new URL(`../src/data/${name}.json`, import.meta.url), 'utf8'));
const pricing = read('model_pricing_schema');
const deals = read('official_deals');

const feed = {
  updatedAt: pricing.lastUpdated,
  models: pricing.models.map(model => ({
    id: model.modelId,
    name: model.modelName,
    provider: model.providerOrg,
    input: model.inputPerM ?? null,
    output: model.outputPerM ?? null,
    cached: model.cachedInputPerM ?? null,
  })),
  deals: deals.providers.flatMap(provider => (provider.promoDeadlines ?? []).map(deadline => ({
    title: `${provider.vendor} · ${deadline.offer}`,
    endsAt: deadline.endsAt,
    source: provider.officialSourceUrl,
    verifiedAt: provider.verifiedDate,
  }))),
};

writeFileSync(new URL('../public/prices-current.json', import.meta.url), JSON.stringify(feed) + '\n');
