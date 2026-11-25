import type { Locale } from '@/i18n/types';

export type DealCategory = 'subscription' | 'api' | 'coding_agent' | 'both';
export type PromoStatus = 'active_promo' | 'no_official_promo';
export type BillingChangeType =
  | 'price_increase'
  | 'price_cut'
  | 'billing_rule'
  | 'plan_restructure';

export interface BillingChangeItem {
  hasRecentChange: boolean;
  effectiveDate: string;
  changeType: BillingChangeType;
  headline: string;
  impactDetail: string;
}

export interface DealLocaleOverride {
  promoBadge?: string;
  regularPrice?: string;
  promoWindow?: string;
  eligiblePlans?: string;
  renewalPrice?: string;
  officialSourceLabel?: string;
  billingHeadline?: string;
  billingImpactDetail?: string;
}

export interface OfficialDealProvider {
  id: string;
  vendor: string;
  product: string;
  category: DealCategory;
  promoStatus: PromoStatus;
  promoDeadlines?: Array<{ offer: string; endsAt: string }>;
  promoBadge: string;
  regularPrice: string;
  promoWindow: string;
  eligiblePlans: string;
  renewalPrice: string;
  officialSourceLabel: string;
  officialSourceUrl: string;
  secondaryOfficialLabel?: string;
  secondaryOfficialUrl?: string;
  verifiedDate: string;
  billingChange: BillingChangeItem;
  i18n?: Partial<Record<Exclude<Locale, 'en'>, DealLocaleOverride>>;
}

export interface OfficialDealsSummaryStats {
  totalProviders: number;
  activeOfficialPromos: number;
  noPromoFound: number;
  billingChangesCount: number;
}

export interface OfficialDealsPayload {
  $schema?: string;
  title: string;
  description: string;
  version: string;
  lastVerifiedDate: string;
  blackFridayDate: string;
  lastUpdated: string;
  currency: string;
  summaryStats: OfficialDealsSummaryStats;
  providers: OfficialDealProvider[];
}

export interface LocalizedDealFields {
  promoBadge: string;
  regularPrice: string;
  promoWindow: string;
  eligiblePlans: string;
  renewalPrice: string;
  officialSourceLabel: string;
  billingHeadline: string;
  billingImpactDetail: string;
}

export function getLocalizedDealFields(
  provider: OfficialDealProvider,
  locale: Locale
): LocalizedDealFields {
  const tr = locale === 'en' ? undefined : provider.i18n?.[locale];
  return {
    promoBadge: tr?.promoBadge || provider.promoBadge,
    regularPrice: tr?.regularPrice || provider.regularPrice,
    promoWindow: tr?.promoWindow || provider.promoWindow,
    eligiblePlans: tr?.eligiblePlans || provider.eligiblePlans,
    renewalPrice: tr?.renewalPrice || provider.renewalPrice,
    officialSourceLabel: tr?.officialSourceLabel || provider.officialSourceLabel,
    billingHeadline: tr?.billingHeadline || provider.billingChange.headline,
    billingImpactDetail: tr?.billingImpactDetail || provider.billingChange.impactDetail,
  };
}

export function extractOfficialDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
