import { subscriptionComparisons, subscriptionLocales, subscriptionProducts, subscriptionHref, subscriptionAlternates } from '@/lib/ai-subscriptions';
import { MetadataRoute } from 'next';
import {
  MODELS_DATA,
  P0_COMPARE_PAIRS,
  PRICING_TOPICS,
  getAllCompareStaticSlugs,
  getComparisonData,
} from '@/lib/models-data';
import { getAllHarnessSlugs } from '@/lib/harness-data';
import { SUPPORTED_LOCALES } from '@/i18n';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://tokencostsai.com';
  const currentDate = new Date().toISOString();

  // Core Pages (Default / English)
  const corePaths = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: 'deals/', priority: 0.9, changeFrequency: 'daily' as const },
    { path: 'calculator/', priority: 0.9, changeFrequency: 'daily' as const },
    { path: 'compare/', priority: 0.9, changeFrequency: 'daily' as const },
    { path: 'harness/', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: 'models/', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: 'pricing/', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: 'developers/', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: 'contact/', priority: 0.7, changeFrequency: 'monthly' as const },
  ];

  const staticRoutes: MetadataRoute.Sitemap = corePaths.map((item) => ({
    url: item.path ? `${baseUrl}/${item.path}` : `${baseUrl}/`,
    lastModified: currentDate,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));

  // Non-English Localized Core Pages
  const nonEnLocales = SUPPORTED_LOCALES.filter((l) => l.code !== 'en');
  const localizedStaticRoutes: MetadataRoute.Sitemap = nonEnLocales.flatMap((locale) =>
    corePaths.map((item) => ({
      url: item.path
        ? `${baseUrl}/${locale.code}/${item.path}`
        : `${baseUrl}/${locale.code}/`,
      lastModified: currentDate,
      changeFrequency: item.changeFrequency,
      priority: item.priority,
    }))
  );

  // Coding Agent & Harness Detail Pages (12 EN + 60 localized = 72 total /harness/<slug>/ routes)
  const harnessSlugs = getAllHarnessSlugs();
  const harnessRoutes: MetadataRoute.Sitemap = harnessSlugs.map((slug) => ({
    url: `${baseUrl}/harness/${slug}/`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  // Non-English Localized Coding Agent & Harness Detail Pages (60 URLs)
  const localizedHarnessRoutes: MetadataRoute.Sitemap = nonEnLocales.flatMap((locale) =>
    harnessSlugs.map((slug) => ({
      url: `${baseUrl}/${locale.code}/harness/${slug}/`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.85,
    }))
  );

  // P0 精选对比页（最高优先级）
  const p0Slugs = new Set(P0_COMPARE_PAIRS.map((pair) => pair.canonicalSlug));
  const p0CompareRoutes: MetadataRoute.Sitemap = P0_COMPARE_PAIRS.map((pair) => ({
    url: `${baseUrl}/compare/${pair.canonicalSlug}/`,
    lastModified: currentDate,
    changeFrequency: 'daily',
    priority: 0.95,
  }));

  // 其余全部预生成的 Tier-1 组合对比页
  const tier1Seen = new Set<string>(p0Slugs);
  const tier1CompareRoutes: MetadataRoute.Sitemap = [];

  for (const slug of getAllCompareStaticSlugs()) {
    const data = getComparisonData(slug);
    if (!data) continue;

    const canonical = data.canonicalSlug || slug;
    if (tier1Seen.has(canonical)) continue;
    tier1Seen.add(canonical);

    tier1CompareRoutes.push({
      url: `${baseUrl}/compare/${canonical}/`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  // Model Specification Pages
  const modelRoutes: MetadataRoute.Sitemap = MODELS_DATA.map((m) => ({
    url: `${baseUrl}/models/${m.modelId}/`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Model Calculator Pages
  const calculatorRoutes: MetadataRoute.Sitemap = MODELS_DATA.map((m) => ({
    url: `${baseUrl}/calculator/${m.modelId}/`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Pricing Guide Topics (English + P1-1 Featured Topics)
  const p1TopicSlugs = new Set([
    'realtime-voice-world-model-api-costs',
    'gemini-4-carbon-dec-1-migration-guide',
  ]);
  const topicRoutes: MetadataRoute.Sitemap = PRICING_TOPICS.map((topic) => ({
    url: `${baseUrl}/pricing/${topic.slug}/`,
    lastModified: currentDate,
    changeFrequency: p1TopicSlugs.has(topic.slug) ? 'daily' : 'weekly',
    priority: p1TopicSlugs.has(topic.slug) ? 0.85 : 0.8,
  }));

  // Non-English Localized Pricing Guide Topics (30 URLs)
  const localizedTopicRoutes: MetadataRoute.Sitemap = nonEnLocales.flatMap((locale) =>
    PRICING_TOPICS.map((topic) => ({
      url: `${baseUrl}/${locale.code}/pricing/${topic.slug}/`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
  );

  const subscriptionPaths = [
    '',
    ...subscriptionProducts.map(product => `${product.id}/`),
    ...subscriptionComparisons.map(comparison => `compare/${comparison.slug}/`),
  ];
  const subscriptionRoutes: MetadataRoute.Sitemap = subscriptionLocales.flatMap(locale =>
    subscriptionPaths.map(suffix => ({
      url: `${baseUrl}${subscriptionHref(locale, suffix)}`,
      alternates: { languages: subscriptionAlternates(suffix, locale).languages },
    }))
  );

  return [
    ...subscriptionRoutes,
    ...staticRoutes,
    ...localizedStaticRoutes,
    ...harnessRoutes,
    ...localizedHarnessRoutes,
    ...p0CompareRoutes,
    ...tier1CompareRoutes,
    ...modelRoutes,
    ...calculatorRoutes,
    ...topicRoutes,
    ...localizedTopicRoutes,
  ];
}
