import raw from '@/data/ai_subscriptions.json';
import type { Locale } from '@/i18n/types';
import { buildAlternates } from '@/lib/seo-alternates';

export type SubscriptionLocale = 'en' | 'zh-CN';
export type SubscriptionUse = 'chat' | 'writing' | 'coding' | 'research';
export type Budget = '20' | '100' | 'any';

export interface SubscriptionSource {
  url: string;
  verifiedAt: string | null;
}

export interface SubscriptionPlan extends SubscriptionSource {
  name: string | null;
  monthlyUSD: number | null;
  monthlyUSDMax: number | null;
  yearlyUSD: number | null;
  monthlyCNY: number | null;
  yearlyCNY: number | null;
  limits: string[] | null;
  models: string[] | null;
  features: string[] | null;
}

export interface SubscriptionProduct {
  id: string;
  name: string;
  vendor: string;
  useCases: SubscriptionUse[];
  availableInChina: boolean | null;
  freeTier: string | null;
  source: SubscriptionSource;
  affiliateUrl: string | null;
  plans: SubscriptionPlan[];
}

export interface SubscriptionComparison {
  slug: string;
  products: [string, string];
}

export const subscriptionLocales = ['en', 'zh-CN'] as const;
export const subscriptionUses = ['chat', 'writing', 'coding', 'research'] as const;
export const subscriptionProducts: SubscriptionProduct[] = raw.products as SubscriptionProduct[];
export const subscriptionComparisons: SubscriptionComparison[] = raw.comparisons as SubscriptionComparison[];

export function subscriptionLocale(locale: string): SubscriptionLocale {
  return locale === 'zh-CN' ? 'zh-CN' : 'en';
}

export function subscriptionHref(locale: Locale, suffix = '') {
  return `${locale === 'zh-CN' ? '/zh-CN' : ''}/ai-subscriptions/${suffix}`;
}

export function subscriptionAlternates(suffix: string, locale: SubscriptionLocale) {
  return buildAlternates(`/ai-subscriptions/${suffix}`, locale, subscriptionLocales);
}

export function selectSubscription(use: SubscriptionUse, budget: Budget, requireChina: boolean) {
  const cap = budget === 'any' ? Infinity : Number(budget);
  return subscriptionProducts
    .filter(product => product.useCases.includes(use) && (!requireChina || product.availableInChina === true))
    .flatMap(product => product.plans
      .filter(plan => plan.verifiedAt && plan.monthlyUSD !== null && (plan.monthlyUSDMax ?? plan.monthlyUSD) <= cap)
      .map(plan => ({ product, plan })))
    .sort((a, b) => (a.plan.monthlyUSD ?? Infinity) - (b.plan.monthlyUSD ?? Infinity))[0] ?? null;
}
