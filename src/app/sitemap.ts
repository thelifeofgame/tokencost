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

  // Coding Agent & Harness Detail Pages
  const harnessRoutes: MetadataRoute.Sitemap = getAllHarnessSlugs().map((slug) => ({
    url: `${baseUrl}/harness/${slug}/`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  // P0 精选对比页（最高优先级）
  const p0Slugs = new Set(P0_COMPARE_PAIRS.map((pair) => pair.canonicalSlug));
  const p0CompareRoutes: MetadataRoute.Sitemap = P0_COMPARE_PAIRS.map((pair) => ({
    url: `${baseUrl}/compare/${pair.canonicalSlug}/`,
    lastModified: currentDate,
    changeFrequency: 'daily',
    priority: 0.95,
  }));

  // 其余全部预生成的 Tier-1 组合对比页（此前完全没进 sitemap，只能靠内链发现）
  // 用 canonicalSlug 去重：正反两个方向的页面 canonical 指向同一个地址，只收录一次
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

  // Pricing Guide Topics
  const topicRoutes: MetadataRoute.Sitemap = PRICING_TOPICS.map((topic) => ({
    url: `${baseUrl}/pricing/${topic.slug}/`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    ...staticRoutes,
    ...localizedStaticRoutes,
    ...harnessRoutes,
    ...p0CompareRoutes,
    ...tier1CompareRoutes,
    ...modelRoutes,
    ...calculatorRoutes,
    ...topicRoutes,
  ];
}
