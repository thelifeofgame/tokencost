'use client';

import DealDeadline from './DealDeadline';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  BillingChangeType,
  DealCategory,
  OfficialDealProvider,
  extractOfficialDomain,
  getLocalizedDealFields,
} from '@/types/deals';
import { useI18n } from '@/i18n/I18nProvider';
import { trackEvent } from '@/lib/analytics';

interface DealVendorCardProps {
  provider: OfficialDealProvider;
}

function getCategoryLabel(
  category: DealCategory,
  dealsT: ReturnType<typeof useI18n>['t']['deals']
): string {
  switch (category) {
    case 'both':
      return dealsT.catBothBadge;
    case 'subscription':
      return dealsT.catSubscriptionBadge;
    case 'api':
      return dealsT.catApiBadge;
    case 'coding_agent':
      return dealsT.catCodingAgentBadge;
  }
}

function getBillingStyle(changeType: BillingChangeType) {
  switch (changeType) {
    case 'price_increase':
      return {
        container:
          'bg-rose-50/90 border-rose-200 text-rose-900 dark:bg-rose-500/10 dark:border-rose-500/25 dark:text-rose-200',
        badge:
          'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30',
        Icon: AlertTriangle,
      };
    case 'price_cut':
      return {
        container:
          'bg-indigo-50/80 border-indigo-200 text-indigo-950 dark:bg-indigo-500/10 dark:border-indigo-500/25 dark:text-indigo-100',
        badge:
          'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
        Icon: ArrowDownRight,
      };
    case 'plan_restructure':
      return {
        container:
          'bg-amber-50/90 border-amber-200 text-amber-950 dark:bg-amber-500/10 dark:border-amber-500/25 dark:text-amber-100',
        badge:
          'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
        Icon: RefreshCw,
      };
    case 'billing_rule':
    default:
      return {
        container:
          'bg-amber-50/90 border-amber-200 text-amber-950 dark:bg-amber-500/10 dark:border-amber-500/25 dark:text-amber-100',
        badge:
          'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
        Icon: Info,
      };
  }
}

function getBillingLabel(
  changeType: BillingChangeType,
  dealsT: ReturnType<typeof useI18n>['t']['deals']
): string {
  switch (changeType) {
    case 'price_increase':
      return dealsT.changePriceIncrease;
    case 'price_cut':
      return dealsT.changePriceCut;
    case 'plan_restructure':
      return dealsT.changePlanRestructure;
    case 'billing_rule':
    default:
      return dealsT.changeBillingRule;
  }
}

function getVendorMonogram(vendor: string): string {
  const parts = vendor.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return vendor.slice(0, 2).toUpperCase();
}

export default function DealVendorCard({ provider }: DealVendorCardProps) {
  const { t, locale } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const dealsT = t.deals;
  const localized = getLocalizedDealFields(provider, locale);

  const isActive = provider.promoStatus === 'active_promo';
  const isExpired = !isActive && provider.id === 'mistral-ai';
  const primaryDomain = extractOfficialDomain(provider.officialSourceUrl);
  const secondaryDomain = provider.secondaryOfficialUrl
    ? extractOfficialDomain(provider.secondaryOfficialUrl)
    : null;

  const billingStyle = getBillingStyle(provider.billingChange.changeType);
  const BillingIcon = billingStyle.Icon;
  const billingTypeLabel = getBillingLabel(provider.billingChange.changeType, dealsT);
  const isLongDetail = localized.billingImpactDetail.length > 140;

  const handleOutboundClick = (targetUrl: string, linkRole: 'primary' | 'secondary') => {
    trackEvent('official_deal_outbound', {
      vendor_id: provider.id,
      vendor: provider.vendor,
      promo_status: provider.promoStatus,
      link_role: linkRole,
      outbound_url: targetUrl,
      locale,
    });
  };

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border p-4 sm:p-5 backdrop-blur-md transition-all duration-150 flex flex-col justify-between gap-4 h-full ${
        isActive
          ? 'border-emerald-300/90 dark:border-emerald-500/30 bg-white/95 dark:bg-zinc-900/70 shadow-sm shadow-emerald-950/[0.04] dark:shadow-lg dark:shadow-emerald-950/20 hover:border-emerald-400 dark:hover:border-emerald-400/50'
          : 'border-zinc-200/90 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/45 shadow-sm shadow-zinc-950/[0.02] dark:shadow-none hover:border-zinc-300 dark:hover:border-zinc-700/80'
      }`}
    >
      {/* Top 1px Sheen */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${
          isActive
            ? 'via-emerald-500/45 dark:via-emerald-400/40'
            : 'via-zinc-300/50 dark:via-zinc-700/30'
        }`}
      />

      <div className="space-y-3.5">
        {/* Header: Vendor + Product + Status Pill */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-mono font-bold tracking-tight ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {getVendorMonogram(provider.vendor)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
                  {provider.vendor}
                </h3>
                <span className="rounded-md bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                  {getCategoryLabel(provider.category, dealsT)}
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate mt-0.5">
                {provider.product}
              </p>
            </div>
          </div>

          <span
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap ${
              isActive
                ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : isExpired
                ? 'bg-rose-50/95 border-rose-300/90 text-rose-800 dark:bg-rose-500/15 dark:border-rose-500/35 dark:text-rose-300'
                : 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200/90 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            {isActive && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" />
            )}
            {isExpired && <Ban className="h-3 w-3 shrink-0" />}
            <span>
              {isActive
                ? dealsT.statusActiveBadge
                : isExpired
                ? dealsT.statusExpiredBadge
                : dealsT.statusNoPromoBadge}
            </span>
          </span>
        </div>

        {/* Promo Callout or Expired / Honest Empty Notice */}
        {isActive ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200/90 dark:border-emerald-500/25 bg-emerald-50/75 dark:bg-emerald-500/10 px-3 py-2">
            <Sparkles className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 leading-snug">
              {localized.promoBadge}
            </span>
          </div>
        ) : isExpired ? (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200/90 dark:border-rose-500/25 bg-rose-50/80 dark:bg-rose-500/10 px-3 py-2">
            <Ban className="h-3.5 w-3.5 text-rose-700 dark:text-rose-400 shrink-0" />
            <span className="text-xs font-semibold text-rose-800 dark:text-rose-200 leading-snug line-through decoration-rose-400/70">
              {localized.promoBadge}
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/90 dark:bg-zinc-950/50 px-3 py-2">
            <ShieldCheck className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" />
            <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 leading-snug">
              {dealsT.noPromoNotice.replace('{date}', provider.verifiedDate)}
            </span>
          </div>
        )}

        {/* 2x2 Micro-Wells: 6-Element Core Fields (1-4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-zinc-200/75 dark:border-zinc-800/75 bg-zinc-50/90 dark:bg-zinc-950/60 p-2.5 sm:p-3 space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              {dealsT.labelRegularPrice}
            </div>
            <p className="text-xs leading-relaxed text-zinc-900 dark:text-zinc-100 font-medium break-words">
              {localized.regularPrice}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200/75 dark:border-zinc-800/75 bg-zinc-50/90 dark:bg-zinc-950/60 p-2.5 sm:p-3 space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              {dealsT.labelPromoWindow}
            </div>
            <p
              className={`text-xs leading-relaxed break-words ${
                isActive
                  ? 'text-zinc-900 dark:text-zinc-100 font-medium'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {localized.promoWindow}
              {provider.promoDeadlines?.map(({ offer, endsAt }) => (
                <span key={offer} className="block">
                  {offer} · <DealDeadline endsAt={endsAt} />
                </span>
              ))}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200/75 dark:border-zinc-800/75 bg-zinc-50/90 dark:bg-zinc-950/60 p-2.5 sm:p-3 space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              {dealsT.labelEligiblePlans}
            </div>
            <p
              className={`text-xs leading-relaxed break-words ${
                isActive
                  ? 'text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {localized.eligiblePlans}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200/75 dark:border-zinc-800/75 bg-zinc-50/90 dark:bg-zinc-950/60 p-2.5 sm:p-3 space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              {dealsT.labelRenewalPrice}
            </div>
            <p className="text-xs leading-relaxed text-zinc-900 dark:text-zinc-100 break-words">
              {localized.renewalPrice}
            </p>
          </div>
        </div>

        {/* Bottom Embedded Billing Change Block */}
        {provider.billingChange.hasRecentChange && (
          <div className={`rounded-xl border p-3 space-y-1.5 ${billingStyle.container}`}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${billingStyle.badge}`}
              >
                <BillingIcon className="h-3 w-3 shrink-0" />
                <span>{billingTypeLabel}</span>
              </span>
              <span className="text-[10px] font-mono tabular-nums opacity-85">
                {dealsT.effectiveLabel} {provider.billingChange.effectiveDate}
              </span>
            </div>

            <div className="text-xs font-bold leading-snug">{localized.billingHeadline}</div>

            <p
              className={`text-[11px] leading-relaxed opacity-90 ${
                !expanded && isLongDetail ? 'line-clamp-2' : ''
              }`}
            >
              {localized.billingImpactDetail}
            </p>

            {isLongDetail && (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold underline-offset-2 hover:underline focus:outline-none"
              >
                <span>{expanded ? dealsT.collapseDetail : dealsT.expandDetail}</span>
                {expanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer: Verified Date (6) + Official Primary Domain Links (5) */}
      <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-2 flex-wrap">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <span>
            {dealsT.labelVerified} {provider.verifiedDate}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <a
            href={provider.officialSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={localized.officialSourceLabel}
            onClick={() => handleOutboundClick(provider.officialSourceUrl, 'primary')}
            className={
              isActive
                ? 'inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/15 transition-all active:scale-[0.98]'
                : 'inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800/90 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/70 transition-all active:scale-[0.98]'
            }
          >
            <span>{primaryDomain}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>

          {provider.secondaryOfficialUrl && secondaryDomain && (
            <a
              href={provider.secondaryOfficialUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={provider.secondaryOfficialLabel || dealsT.secondaryCta}
              onClick={() => handleOutboundClick(provider.secondaryOfficialUrl!, 'secondary')}
              className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
            >
              <span>{secondaryDomain}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
