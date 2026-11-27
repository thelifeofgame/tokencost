'use client';

import Link from 'next/link';
import { subscriptionHref } from '@/lib/ai-subscriptions';
import DealDeadline from './DealDeadline';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  CalendarClock,
  ChevronDown,
  HelpCircle,
  LayoutGrid,
  RotateCcw,
  Search,
  ShieldCheck,
  Table2,
  X,
} from 'lucide-react';
import officialDealsRaw from '@/data/official_deals.json';
import {
  OfficialDealProvider,
  OfficialDealsPayload,
  getLocalizedDealFields,
} from '@/types/deals';
import { useI18n } from '@/i18n/I18nProvider';
import { trackEvent } from '@/lib/analytics';
import { getDealsFaqs } from '@/lib/deals-faq-data';
import DealVendorCard from './DealVendorCard';
import DealsComparisonTable from './DealsComparisonTable';

type StatusFilter = 'all' | 'active_promo' | 'no_official_promo' | 'billing_changes';
type CategoryFilter = 'all' | 'subscription' | 'api' | 'coding_agent';
type ViewMode = 'cards' | 'table';

const dealsPayload = officialDealsRaw as OfficialDealsPayload;

export default function DealsClient() {
  const { t, locale } = useI18n();
  const dealsT = t.deals;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [hikesOnly, setHikesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Read optional URL query params on client mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const s = sp.get('status');
    if (
      s === 'all' ||
      s === 'active_promo' ||
      s === 'no_official_promo' ||
      s === 'billing_changes'
    ) {
      setStatusFilter(s);
    }
    const c = sp.get('category');
    if (c === 'all' || c === 'subscription' || c === 'api' || c === 'coding_agent') {
      setCategoryFilter(c);
    }
    const v = sp.get('view');
    if (v === 'cards' || v === 'table') {
      setViewMode(v);
    }
  }, []);

  const providers: OfficialDealProvider[] = dealsPayload.providers;
  const faqs = useMemo(() => getDealsFaqs(locale), [locale]);

  const stats = useMemo(() => {
    const total = providers.length;
    const active = providers.filter((p) => p.promoStatus === 'active_promo').length;
    const noPromo = providers.filter((p) => p.promoStatus === 'no_official_promo').length;
    const billing = providers.filter((p) => p.billingChange.hasRecentChange).length;
    const hikes = providers.filter((p) => p.billingChange.changeType === 'price_increase').length;
    const cuts = providers.filter((p) => p.billingChange.changeType === 'price_cut').length;
    return { total, active, noPromo, billing, hikes, cuts };
  }, [providers]);

  const openAiBillingDate = providers.find(provider => provider.id === 'openai')?.billingChange.effectiveDate;

  const filteredProviders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const matched = providers.filter((p) => {
      if (statusFilter === 'active_promo' && p.promoStatus !== 'active_promo') return false;
      if (statusFilter === 'no_official_promo' && p.promoStatus !== 'no_official_promo') {
        return false;
      }
      if (statusFilter === 'billing_changes' && !p.billingChange.hasRecentChange) return false;

      if (categoryFilter === 'subscription') {
        if (p.category !== 'subscription' && p.category !== 'both') return false;
      } else if (categoryFilter === 'api') {
        if (p.category !== 'api' && p.category !== 'both') return false;
      } else if (categoryFilter === 'coding_agent') {
        if (p.category !== 'coding_agent') return false;
      }

      if (hikesOnly) {
        if (
          p.billingChange.changeType !== 'price_increase' &&
          p.billingChange.changeType !== 'billing_rule'
        ) {
          return false;
        }
      }

      if (q) {
        const loc = getLocalizedDealFields(p, locale);
        const haystack = [
          p.vendor,
          p.product,
          p.officialSourceUrl,
          loc.promoBadge,
          loc.regularPrice,
          loc.promoWindow,
          loc.eligiblePlans,
          loc.renewalPrice,
          loc.billingHeadline,
          loc.billingImpactDetail,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    // Deterministic order: active_promo first, no_official_promo second
    return [...matched].sort((a, b) => {
      if (a.promoStatus === b.promoStatus) return 0;
      return a.promoStatus === 'active_promo' ? -1 : 1;
    });
  }, [providers, statusFilter, categoryFilter, hikesOnly, searchQuery, locale]);

  const handleKpiClick = (target: StatusFilter) => {
    setStatusFilter((prev) => (prev === target && target !== 'all' ? 'all' : target));
    trackEvent('deals_filter_change', { filter_type: 'kpi', value: target, locale });
  };

  const handleResetFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setHikesOnly(false);
    setSearchQuery('');
  };

  return (
    <div data-analytics-module="deals" className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* 1. Hero & Trust Shield */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-mono font-semibold tracking-wide bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 tabular-nums whitespace-nowrap">
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span>Verified: {dealsPayload.lastVerifiedDate}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-mono font-medium bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 text-amber-800 dark:text-amber-300 tabular-nums whitespace-nowrap">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
            <DealDeadline endsAt={dealsPayload.blackFridayDate} />
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-mono font-medium bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
            <span>{dealsT.heroBadge.replace('{date}', dealsPayload.lastVerifiedDate)}</span>
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            {dealsT.heroTitle}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
            {dealsT.heroDesc.replace('{count}', String(stats.total))}
          </p>
        </div>

        {/* Anti-Reseller Trust Shield Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/50 px-4 py-2.5 backdrop-blur-sm shadow-sm shadow-zinc-950/[0.02] dark:shadow-none">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {dealsT.trustTitle}
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-snug">
                {dealsT.trustDesc}
              </p>
            </div>
          </div>
          <div className="font-mono text-[11px] tabular-nums text-zinc-600 dark:text-zinc-400 shrink-0 pl-10 sm:pl-0">
            {dealsT.lastAuditLabel.replace('{date}', dealsPayload.lastVerifiedDate)}
          </div>
        </div>

        {/* Dual Urgent Alert Strip: Nov 30 Cutoff (T-5) & Mistral API Credit Cancelled */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-amber-300/90 dark:border-amber-500/30 bg-amber-50/75 dark:bg-amber-500/10 p-4 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 dark:border-amber-500/35 bg-amber-100/90 dark:bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-amber-900 dark:text-amber-200 tabular-nums whitespace-nowrap">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {openAiBillingDate && <DealDeadline endsAt={openAiBillingDate} />}
              </span>
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
              {t.growth.billingAlertTitle}
            </h2>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {dealsT.nov30AlertBody}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-300/80 dark:border-rose-500/30 bg-rose-50/70 dark:bg-rose-500/10 p-4 space-y-1.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 dark:border-rose-500/35 bg-rose-100/90 dark:bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-rose-800 dark:text-rose-200 whitespace-nowrap">
                  <Ban className="h-3 w-3 shrink-0" />
                  <span>{dealsT.mistralCreditAlertBadge}</span>
                </span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {dealsT.mistralCreditAlertBody}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 4-Tile Interactive KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => handleKpiClick('all')}
          className={`min-w-0 group text-left rounded-2xl border bg-white/90 dark:bg-zinc-900/60 p-3.5 sm:p-4 backdrop-blur-md transition-all duration-150 hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.99] ${
            statusFilter === 'all'
              ? 'border-indigo-500/70 ring-1 ring-indigo-500/25'
              : 'border-zinc-200/90 dark:border-zinc-800/80'
          }`}
        >
          <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            {dealsT.kpiTotal}
          </div>
          <div className="mt-1 font-mono tabular-nums text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {stats.total}
          </div>
          <div className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
            {dealsT.kpiTotalSub}
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleKpiClick('active_promo')}
          className={`min-w-0 group text-left rounded-2xl border bg-white/90 dark:bg-zinc-900/60 p-3.5 sm:p-4 backdrop-blur-md transition-all duration-150 hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.99] ${
            statusFilter === 'active_promo'
              ? 'border-emerald-500/70 ring-1 ring-emerald-500/25'
              : 'border-zinc-200/90 dark:border-zinc-800/80'
          }`}
        >
          <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            {dealsT.kpiActive}
          </div>
          <div className="mt-1 font-mono tabular-nums text-2xl sm:text-3xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
            {stats.active}
          </div>
          <div className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
            {dealsT.kpiActiveSub}
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleKpiClick('no_official_promo')}
          className={`min-w-0 group text-left rounded-2xl border bg-white/90 dark:bg-zinc-900/60 p-3.5 sm:p-4 backdrop-blur-md transition-all duration-150 hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.99] ${
            statusFilter === 'no_official_promo'
              ? 'border-zinc-400 dark:border-zinc-500 ring-1 ring-zinc-400/25'
              : 'border-zinc-200/90 dark:border-zinc-800/80'
          }`}
        >
          <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            {dealsT.kpiNoPromo}
          </div>
          <div className="mt-1 font-mono tabular-nums text-2xl sm:text-3xl font-bold tracking-tight text-zinc-700 dark:text-zinc-300">
            {stats.noPromo}
          </div>
          <div className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
            {dealsT.kpiNoPromoSub}
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleKpiClick('billing_changes')}
          className={`min-w-0 group text-left rounded-2xl border bg-white/90 dark:bg-zinc-900/60 p-3.5 sm:p-4 backdrop-blur-md transition-all duration-150 hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.99] ${
            statusFilter === 'billing_changes'
              ? 'border-amber-500/70 ring-1 ring-amber-500/25'
              : 'border-zinc-200/90 dark:border-zinc-800/80'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              {dealsT.kpiBilling}
            </span>
            <span className="rounded-md bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-amber-800 dark:text-amber-300 whitespace-nowrap">
              {dealsT.kpiBillingMeta
                .replace('{hikes}', String(stats.hikes))
                .replace('{cuts}', String(stats.cuts))}
            </span>
          </div>
          <div className="mt-1 font-mono tabular-nums text-2xl sm:text-3xl font-bold tracking-tight text-amber-700 dark:text-amber-400">
            {stats.billing}
          </div>
          <div className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
            {dealsT.kpiBillingSub}
          </div>
        </button>
      </section>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Link className="inline-block text-sm text-indigo-700 underline dark:text-indigo-300" href={subscriptionHref(locale)}>{t.subscriptions.title}</Link>
        {locale === 'zh-CN' && (
          <Link className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 underline dark:text-amber-300" href="/zh-CN/domestic-models/">
            免海外信用卡：国内大模型官方费率与支付方式一览 →
          </Link>
        )}
      </div>

      {/* 3. Filter & View Toolbar */}
      <section className="min-w-0 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 p-3.5 sm:p-4 backdrop-blur-md space-y-3">
        {/* Row 1: Status Tabs + View Mode Switcher */}
        <div className="min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="min-w-0 w-full md:w-auto flex items-center gap-1.5 overflow-x-auto pb-0.5 md:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`min-h-[36px] px-3 rounded-lg text-xs whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 border transition-colors ${
                statusFilter === 'all'
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100 font-semibold shadow-sm'
                  : 'bg-zinc-50 dark:bg-zinc-950/60 text-zinc-600 dark:text-zinc-400 border-zinc-200/90 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <span>{dealsT.filterAll.replace('{count}', String(stats.total))}</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('active_promo')}
              className={`min-h-[36px] px-3 rounded-lg text-xs whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 border transition-colors ${
                statusFilter === 'active_promo'
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100 font-semibold shadow-sm'
                  : 'bg-zinc-50 dark:bg-zinc-950/60 text-zinc-600 dark:text-zinc-400 border-zinc-200/90 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" />
              <span>{dealsT.filterActive.replace('{count}', String(stats.active))}</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('no_official_promo')}
              className={`min-h-[36px] px-3 rounded-lg text-xs whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 border transition-colors ${
                statusFilter === 'no_official_promo'
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100 font-semibold shadow-sm'
                  : 'bg-zinc-50 dark:bg-zinc-950/60 text-zinc-600 dark:text-zinc-400 border-zinc-200/90 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 shrink-0" />
              <span>{dealsT.filterNoPromo.replace('{count}', String(stats.noPromo))}</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('billing_changes')}
              className={`min-h-[36px] px-3 rounded-lg text-xs whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 border transition-colors ${
                statusFilter === 'billing_changes'
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100 font-semibold shadow-sm'
                  : 'bg-zinc-50 dark:bg-zinc-950/60 text-zinc-600 dark:text-zinc-400 border-zinc-200/90 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400 shrink-0" />
              <span>{dealsT.filterBilling.replace('{count}', String(stats.billing))}</span>
            </button>
          </div>

          {/* Segmented View Mode Switcher */}
          <div className="inline-flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => {
                setViewMode('cards');
                trackEvent('deals_view_switch', { view: 'cards', locale });
              }}
              className={`inline-flex items-center gap-1.5 min-h-[32px] px-3 rounded-lg text-xs transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>{dealsT.viewCards}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('table');
                trackEvent('deals_view_switch', { view: 'table', locale });
              }}
              className={`inline-flex items-center gap-1.5 min-h-[32px] px-3 rounded-lg text-xs transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Table2 className="h-3.5 w-3.5" />
              <span>{dealsT.viewTable}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Category Pills + Price Hikes Toggle + Search Input */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-2.5 border-t border-zinc-200/70 dark:border-zinc-800/70">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: dealsT.catAll },
                { id: 'subscription', label: dealsT.catSubscription },
                { id: 'api', label: dealsT.catApi },
                { id: 'coding_agent', label: dealsT.catCodingAgent },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`min-h-[34px] px-2.5 rounded-lg text-xs border transition-colors whitespace-nowrap ${
                  categoryFilter === cat.id
                    ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                    : 'bg-white dark:bg-zinc-950/50 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {cat.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setHikesOnly((prev) => !prev)}
              aria-pressed={hikesOnly}
              className={`min-h-[34px] px-2.5 rounded-lg text-xs border inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                hikesOnly
                  ? 'bg-rose-600 text-white border-rose-600 font-medium shadow-sm'
                  : 'bg-rose-50/70 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-500/30 hover:bg-rose-100/80 dark:hover:bg-rose-500/20'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{dealsT.catHikesOnly}</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={dealsT.searchPlaceholder}
              className="h-9 w-full rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/70 pl-8 pr-9 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-950 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={dealsT.resetFilters}
                className="absolute right-0 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-w-[36px] min-h-[36px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 4. Main Content: Cards or Comparison Table */}
      {filteredProviders.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 p-8 text-center space-y-3">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {dealsT.emptyResult}
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 min-h-[36px] px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{dealsT.resetFilters}</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredProviders.map((provider) => (
            <DealVendorCard key={provider.id} provider={provider} />
          ))}
        </section>
      ) : (
        <section className="min-w-0">
          <DealsComparisonTable providers={filteredProviders} />
        </section>
      )}

      {/* 5. Editorial Verification Methodology */}
      <section className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-zinc-50/90 dark:bg-zinc-900/45 p-5 sm:p-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
          <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <h2>{dealsT.methodologyTitle}</h2>
        </div>
        <p className="text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {dealsT.methodologyBody}
        </p>
      </section>

      {/* 6. Verified Deals & Billing FAQ Accordion (mirrors SchemaOrg FAQPage) */}
      <section
        aria-labelledby="deals-faq-heading"
        className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/55 p-5 sm:p-6 backdrop-blur-md space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h2
              id="deals-faq-heading"
              className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight"
            >
              {dealsT.faqSectionTitle}
            </h2>
          </div>
          <span className="inline-flex items-center rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-mono font-medium text-emerald-800 dark:text-emerald-300 tabular-nums whitespace-nowrap">
            {dealsT.faqSectionBadge.replace('{date}', dealsPayload.lastVerifiedDate)}
          </span>
        </div>

        <div className="space-y-2.5">
          {faqs.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            const panelId = `deals-faq-panel-${idx}`;
            return (
              <div
                key={idx}
                className="rounded-xl border border-zinc-200/85 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/50 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenFaqIndex((prev) => (prev === idx ? null : idx))}
                  className="min-h-[48px] w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 text-left hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 transition-colors"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                      {item.question}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400 transition-transform duration-150 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    className="px-4 sm:pl-[52px] sm:pr-4 pb-4 pt-3 text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 border-t border-zinc-200/70 dark:border-zinc-800/70"
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
