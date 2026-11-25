import type { MetadataRoute } from 'next';
import {
  subscriptionAlternates, subscriptionComparisons, subscriptionHref, subscriptionLocales, subscriptionProducts,
} from '@/lib/ai-subscriptions';
import { MODELS_DATA, PRICING_TOPICS, getAllCompareStaticSlugs, getComparisonData } from '@/lib/models-data';
import { getAllHarnessSlugs } from '@/lib/harness-data';
import { SUPPORTED_LOCALES } from '@/i18n';
import { BASE_URL, buildAlternates, buildLocalizedCanonical } from '@/lib/seo-alternates';
import {
  allowComparison, isIndexablePricingModel, catalogUpdatedAt, comparisonUpdatedAt, comparisonVerifiedAt, normalizedDataDate, priceVerifiedAt,
  pricingDetailLocales,
} from '@/lib/pricing-detail-seo';
import deals from '@/data/official_deals.json';
import harness from '@/data/harness_tools.json';

const core = [
  { path: '/', lastModified: catalogUpdatedAt },
  { path: '/deals/', lastModified: normalizedDataDate(deals.lastVerifiedDate) },
  { path: '/calculator/', lastModified: catalogUpdatedAt },
  { path: '/compare/', lastModified: comparisonUpdatedAt },
  { path: '/harness/', lastModified: normalizedDataDate(harness.lastUpdated) },
  { path: '/models/', lastModified: catalogUpdatedAt },
  { path: '/pricing/' },
  { path: '/developers/' },
  { path: '/contact/' },
];

function detailRoutes(path: string, lastModified?: string): MetadataRoute.Sitemap {
  return pricingDetailLocales.map(locale => ({
    url: buildLocalizedCanonical(path, locale),
    lastModified,
    alternates: { languages: buildAlternates(path, locale, pricingDetailLocales).languages },
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const coreRoutes = SUPPORTED_LOCALES.flatMap(({ code }) => [
    ...core.map(entry => ({
      url: buildLocalizedCanonical(entry.path, code),
      lastModified: entry.lastModified,
    })),
    ...getAllHarnessSlugs().map(slug => ({
      url: buildLocalizedCanonical(`/harness/${slug}/`, code),
      lastModified: normalizedDataDate(harness.lastUpdated),
    })),
    ...PRICING_TOPICS.map(topic => ({
      url: buildLocalizedCanonical(`/pricing/${topic.slug}/`, code),
    })),
  ]);

  const comparisons = getAllCompareStaticSlugs().flatMap(slug => {
    if (!allowComparison(slug)) return [];
    const data = getComparisonData(slug);
    if (!data || slug !== data.canonicalSlug) return [];
    return detailRoutes(`/compare/${slug}/`, comparisonVerifiedAt(data.modelA.modelId, data.modelB.modelId));
  });

  const models = MODELS_DATA.flatMap(({ modelId }) => {
    if (!isIndexablePricingModel(modelId)) return [];
    const date = priceVerifiedAt(modelId);
    return [
      ...detailRoutes(`/models/${modelId}/`, date),
      ...detailRoutes(`/calculator/${modelId}/`, date),
    ];
  });

  const subscriptionPaths = [
    { path: '', date: latestSubscriptionDate(subscriptionProducts.map(product => product.id)) },
    ...subscriptionProducts.map(product => ({ path: `${product.id}/`, date: latestSubscriptionDate([product.id]) })),
    ...subscriptionComparisons.map(comparison => ({
      path: `compare/${comparison.slug}/`,
      date: latestSubscriptionDate(comparison.products),
    })),
  ];
  const subscriptionRoutes: MetadataRoute.Sitemap = subscriptionLocales.flatMap(locale =>
    subscriptionPaths.map(({ path, date }) => ({
      url: `${BASE_URL}${subscriptionHref(locale, path)}`,
      lastModified: date,
      alternates: { languages: subscriptionAlternates(path, locale).languages },
    }))
  );

  return [
    ...coreRoutes, ...comparisons, ...models, ...subscriptionRoutes,
    { url: buildLocalizedCanonical('/domestic-models/', 'zh-CN') },
  ];
}

function latestSubscriptionDate(ids: string[]) {
  return subscriptionProducts.filter(product => ids.includes(product.id))
    .flatMap(product => product.plans.flatMap(plan => normalizedDataDate(plan.verifiedAt) ?? []))
    .sort().at(-1);
}
