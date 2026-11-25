import type { Locale } from '@/i18n/types';
import raw from '@/data/model_pricing_schema.json';
import allowlist from '@/data/compare_index_allowlist.json';
import verdicts from '@/data/compare_verdicts.json';
import trending from '@/data/trending_comparisons.json';
import { buildAlternates, buildLocalizedCanonical, getOgLocale } from '@/lib/seo-alternates';

export const pricingDetailLocales = ['en', 'zh-CN'] as const;
const indexedPairs = new Set([...allowlist.seed, ...allowlist.searchConsole]);
const verdictPairs = new Set(verdicts.pairs);

export function allowComparison(canonicalSlug: string): boolean {
  return indexedPairs.has(canonicalSlug);
}

export function hasVerdict(canonicalSlug: string): boolean {
  return verdictPairs.has(canonicalSlug);
}

export function isIndexablePricingModel(modelId: string): boolean {
  return !modelId.includes(':');
}

export function decodePricingModelId(routeId: string): string {
  try {
    return decodeURIComponent(routeId);
  } catch {
    return routeId;
  }
}

export function pricingDetailSeo(path: string, locale: Locale, eligible = true) {
  const index = eligible && (locale === 'en' || locale === 'zh-CN');
  return {
    alternates: index ? buildAlternates(path, locale, pricingDetailLocales) : { canonical: buildLocalizedCanonical(path, locale) },
    robots: { index, follow: true },
    alternateLocale: index ? pricingDetailLocales.filter(candidate => candidate !== locale).map(getOgLocale) : undefined,
  };
}

export function normalizedDataDate(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const date = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) ? date : undefined;
}

export const catalogUpdatedAt = normalizedDataDate(raw.lastUpdated);
export const comparisonUpdatedAt = normalizedDataDate(trending.lastUpdated) ?? catalogUpdatedAt;

const dates = new Map(
  (raw.models as Array<{ modelId: string; priceVerifiedAt?: string; verifiedDate?: string; lastUpdated?: string }>).map(model =>
    [model.modelId, normalizedDataDate(model.priceVerifiedAt ?? model.verifiedDate ?? model.lastUpdated) ?? catalogUpdatedAt])
);

export function priceVerifiedAt(modelId: string) {
  return dates.get(modelId);
}

export function comparisonVerifiedAt(a: string, b: string) {
  const left = priceVerifiedAt(a);
  const right = priceVerifiedAt(b);
  return left && right ? (left > right ? left : right) : left ?? right ?? catalogUpdatedAt;
}
