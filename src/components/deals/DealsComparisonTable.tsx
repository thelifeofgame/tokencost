'use client';

import React from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  CheckCircle2,
  ExternalLink,
  Info,
  RefreshCw,
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

interface DealsComparisonTableProps {
  providers: OfficialDealProvider[];
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

function getChangeBadge(
  changeType: BillingChangeType,
  dealsT: ReturnType<typeof useI18n>['t']['deals']
) {
  switch (changeType) {
    case 'price_increase':
      return {
        label: dealsT.changePriceIncrease,
        className:
          'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30',
        Icon: AlertTriangle,
      };
    case 'price_cut':
      return {
        label: dealsT.changePriceCut,
        className:
          'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
        Icon: ArrowDownRight,
      };
    case 'plan_restructure':
      return {
        label: dealsT.changePlanRestructure,
        className:
          'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
        Icon: RefreshCw,
      };
    case 'billing_rule':
    default:
      return {
        label: dealsT.changeBillingRule,
        className:
          'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
        Icon: Info,
      };
  }
}

export default function DealsComparisonTable({ providers }: DealsComparisonTableProps) {
  const { t, locale } = useI18n();
  const dealsT = t.deals;

  return (
    <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/60 shadow-sm dark:shadow-xl overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-[1120px] w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-950/70 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              <th
                scope="col"
                className="sticky left-0 z-10 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-sm min-w-[170px] px-4 py-3 border-r border-zinc-200/70 dark:border-zinc-800/70"
              >
                {dealsT.tableColVendor}
              </th>
              <th scope="col" className="min-w-[140px] px-3.5 py-3">
                {dealsT.tableColPromoStatus}
              </th>
              <th scope="col" className="min-w-[170px] px-3.5 py-3">
                {dealsT.labelRegularPrice}
              </th>
              <th scope="col" className="min-w-[155px] px-3.5 py-3">
                {dealsT.labelPromoWindow}
              </th>
              <th scope="col" className="min-w-[165px] px-3.5 py-3">
                {dealsT.labelEligiblePlans}
              </th>
              <th scope="col" className="min-w-[155px] px-3.5 py-3">
                {dealsT.labelRenewalPrice}
              </th>
              <th scope="col" className="min-w-[200px] px-3.5 py-3">
                {dealsT.labelBillingChange}
              </th>
              <th scope="col" className="min-w-[145px] px-4 py-3 text-right">
                {dealsT.labelOfficialSource}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/60">
            {providers.map((provider) => {
              const localized = getLocalizedDealFields(provider, locale);
              const isActive = provider.promoStatus === 'active_promo';
              const primaryDomain = extractOfficialDomain(provider.officialSourceUrl);
              const secondaryDomain = provider.secondaryOfficialUrl
                ? extractOfficialDomain(provider.secondaryOfficialUrl)
                : null;
              const changeBadge = getChangeBadge(provider.billingChange.changeType, dealsT);
              const ChangeIcon = changeBadge.Icon;

              return (
                <tr
                  key={provider.id}
                  className="even:bg-zinc-50/45 dark:even:bg-zinc-950/25 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40 transition-colors align-top"
                >
                  {/* 1. Sticky Vendor & Type */}
                  <td
                    className={`sticky left-0 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-4 py-3.5 border-r border-zinc-200/70 dark:border-zinc-800/70 ${
                      isActive ? 'border-l-2 border-l-emerald-500' : ''
                    }`}
                  >
                    <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                      {provider.vendor}
                    </div>
                    <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 leading-snug">
                      {provider.product}
                    </div>
                    <span className="mt-1.5 inline-flex rounded-md bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                      {getCategoryLabel(provider.category, dealsT)}
                    </span>
                  </td>

                  {/* 2. Official Promo Status */}
                  <td className="px-3.5 py-3.5 space-y-1.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                          : 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200/90 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {isActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                      )}
                      <span>
                        {isActive ? dealsT.statusActiveBadge : dealsT.statusNoPromoBadge}
                      </span>
                    </span>
                    {isActive && (
                      <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 leading-snug">
                        {localized.promoBadge}
                      </div>
                    )}
                  </td>

                  {/* 3. Regular Price */}
                  <td className="px-3.5 py-3.5 font-mono text-[11px] leading-relaxed text-zinc-800 dark:text-zinc-200">
                    {localized.regularPrice}
                  </td>

                  {/* 4. Promo Window */}
                  <td
                    className={`px-3.5 py-3.5 text-[11px] leading-relaxed ${
                      isActive
                        ? 'text-zinc-900 dark:text-zinc-100 font-medium'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {localized.promoWindow}
                  </td>

                  {/* 5. Eligible Plans */}
                  <td
                    className={`px-3.5 py-3.5 text-[11px] leading-relaxed ${
                      isActive
                        ? 'text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {localized.eligiblePlans}
                  </td>

                  {/* 6. Renewal Price */}
                  <td className="px-3.5 py-3.5 font-mono text-[11px] leading-relaxed text-zinc-800 dark:text-zinc-200">
                    {localized.renewalPrice}
                  </td>

                  {/* 7. Billing Change */}
                  <td className="px-3.5 py-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${changeBadge.className}`}
                      >
                        <ChangeIcon className="h-2.5 w-2.5 shrink-0" />
                        <span>{changeBadge.label}</span>
                      </span>
                      <span className="text-[10px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                        {provider.billingChange.effectiveDate}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200 leading-snug">
                      {localized.billingHeadline}
                    </div>
                  </td>

                  {/* 8. Official Source & Verified */}
                  <td className="px-4 py-3.5 text-right space-y-1.5">
                    <div className="flex flex-col items-end gap-1">
                      <a
                        href={provider.officialSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={localized.officialSourceLabel}
                        onClick={() =>
                          trackEvent('official_deal_outbound', {
                            vendor_id: provider.id,
                            vendor: provider.vendor,
                            promo_status: provider.promoStatus,
                            link_role: 'primary',
                            outbound_url: provider.officialSourceUrl,
                            locale,
                          })
                        }
                        className={`inline-flex items-center gap-1 min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                          isActive
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'
                        }`}
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
                          onClick={() =>
                            trackEvent('official_deal_outbound', {
                              vendor_id: provider.id,
                              vendor: provider.vendor,
                              promo_status: provider.promoStatus,
                              link_role: 'secondary',
                              outbound_url: provider.secondaryOfficialUrl,
                              locale,
                            })
                          }
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap"
                        >
                          <span>{secondaryDomain}</span>
                          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                        </a>
                      )}
                    </div>

                    <div className="inline-flex items-center justify-end gap-1 text-[10px] font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                      <CheckCircle2 className="h-3 w-3 text-emerald-700 dark:text-emerald-400" />
                      <span>{provider.verifiedDate}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
