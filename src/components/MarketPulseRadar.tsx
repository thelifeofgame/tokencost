'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, ExternalLink } from 'lucide-react';
import marketRadarData from '@/data/market_radar.json';
import marketRadarEventsData from '@/data/market_radar_events.json';
import { useI18n } from '@/i18n/I18nProvider';
import { trackEvent } from '@/lib/analytics';

interface MarketRadarItem {
  id: string;
  type: string;
  title: string;
  provider: string;
  modelId?: string;
  badgeText: string;
  summary: string;
  effectiveDate: string;
  link: string;
  metrics?: {
    inputPerM?: number;
    outputPerM?: number;
    cacheDiscountPercent?: number;
    contextWindow?: number;
    throughputTps?: number;
  };
  i18n?: Record<string, {
    title: string;
    summary: string;
    badgeText: string;
  }>;
}

type BadgeColor = 'purple' | 'emerald' | 'cyan' | 'amber' | 'rose' | 'indigo';

interface MarketRadarEvent {
  id: string;
  type: string;
  badgeText: string;
  badgeColor: BadgeColor;
  provider: string;
  title: string;
  highlight: string;
  prevValue?: string;
  newValue?: string;
  discountPercent?: number;
  description: string;
  ctaText: string;
  ctaLink: string;
  topicLink?: string;
  timestamp: string;
  isFeatured: boolean;
}

const BADGE_STYLE: Record<BadgeColor, string> = {
  purple:
    'bg-purple-500/10 border-purple-500/25 text-purple-700 dark:bg-purple-500/15 dark:border-purple-500/30 dark:text-purple-300',
  emerald:
    'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300',
  cyan:
    'bg-cyan-500/10 border-cyan-500/25 text-cyan-700 dark:bg-cyan-500/15 dark:border-cyan-500/30 dark:text-cyan-300',
  amber:
    'bg-amber-500/10 border-amber-500/25 text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300',
  rose:
    'bg-rose-500/12 border-rose-500/35 text-rose-800 dark:bg-rose-500/20 dark:border-rose-400/40 dark:text-rose-200',
  indigo:
    'bg-indigo-500/10 border-indigo-500/25 text-indigo-700 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-300',
};

const HIGHLIGHT_ACCENT_BORDER: Record<BadgeColor, string> = {
  purple: 'border-l-2 border-l-purple-500',
  emerald: 'border-l-2 border-l-emerald-500',
  cyan: 'border-l-2 border-l-cyan-500',
  amber: 'border-l-2 border-l-amber-500',
  rose: 'border-l-2 border-l-rose-500',
  indigo: 'border-l-2 border-l-indigo-500',
};

function getPrimaryAndSecondaryCta(ev: MarketRadarEvent): {
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
} {
  if (ev.id === 'radar-2026-009') {
    return {
      primaryHref: ev.topicLink || '/pricing/realtime-voice-world-model-api-costs/',
      primaryLabel: 'Cost Breakdown',
      secondaryHref: ev.ctaLink,
      secondaryLabel: 'Compare',
    };
  }
  if (ev.id === 'radar-2026-010') {
    return {
      primaryHref: ev.topicLink || '/pricing/realtime-voice-world-model-api-costs/',
      primaryLabel: 'Voice Calculator',
      secondaryHref: ev.ctaLink,
      secondaryLabel: 'Compare',
    };
  }
  if (ev.topicLink) {
    return {
      primaryHref: ev.topicLink,
      primaryLabel: 'Deep Dive',
      secondaryHref: ev.ctaLink,
      secondaryLabel: ev.ctaText,
    };
  }
  return {
    primaryHref: ev.ctaLink,
    primaryLabel: ev.ctaText,
  };
}

export default function MarketPulseRadar() {
  const { t, locale, getLocalizedPath } = useI18n();
  const [activeTab, setActiveTab] = useState<'all' | 'new_model' | 'price_cut' | 'caching_update'>('all');

  const items: MarketRadarItem[] = (marketRadarData.items || []) as MarketRadarItem[];
  const events: MarketRadarEvent[] = useMemo(
    () => (marketRadarEventsData.events || []) as MarketRadarEvent[],
    []
  );

  const featuredEvents = useMemo(
    () => events.filter((ev) => ev.isFeatured).slice(0, 4),
    [events]
  );

  const carbonAlertEvent = useMemo(
    () => events.find((ev) => ev.id === 'radar-2026-003'),
    [events]
  );

  const daysLeft = useMemo(() => {
    const now = new Date();
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const cutoffUtc = Date.UTC(2026, 10, 30); // Nov 30, 2026
    return Math.max(0, Math.round((cutoffUtc - todayUtc) / 86400000));
  }, []);

  const filteredItems = activeTab === 'all'
    ? items
    : items.filter((item: MarketRadarItem) => {
        if (activeTab === 'price_cut') {
          return item.type === 'price_cut' || item.type === 'promo';
        }
        return item.type === activeTab;
      });

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'new_model':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 dark:border-emerald-500/20';
      case 'price_cut':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25 dark:border-rose-500/20';
      case 'promo':
        return 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/25 dark:border-amber-500/20';
      case 'caching_update':
        return 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/25 dark:border-cyan-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/25 dark:border-indigo-500/20';
    }
  };

  const radarT = t.simulator.radar;

  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/30 p-4 sm:p-5 backdrop-blur-md shadow-lg space-y-4">
      {/* Header + Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            <span>{radarT.badge}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
            <span>{radarT.title}</span>
            <span className="text-[10px] font-mono font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700/60">
              {radarT.sync}
            </span>
            <Link
              href={getLocalizedPath('/deals/')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/25 transition-colors"
            >
              <span>{t.deals.radarLinkLabel}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {radarT.desc}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-medium">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap text-xs ${
              activeTab === 'all'
                ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-200 font-semibold shadow-sm'
                : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            {radarT.tabs.all} ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('new_model')}
            className={`px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap text-xs ${
              activeTab === 'new_model'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-semibold'
                : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            {radarT.tabs.new_model}
          </button>
          <button
            onClick={() => setActiveTab('price_cut')}
            className={`px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap text-xs ${
              activeTab === 'price_cut'
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 font-semibold'
                : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            {radarT.tabs.price_cut}
          </button>
          <button
            onClick={() => setActiveTab('caching_update')}
            className={`px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap text-xs ${
              activeTab === 'caching_update'
                ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/40 font-semibold'
                : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            {radarT.tabs.caching_update}
          </button>
        </div>
      </div>

      {/* Countdown Alert Strip (radar-2026-003: Nov 30 Deadline) */}
      {carbonAlertEvent && (
        <div className="relative overflow-hidden rounded-xl border border-rose-500/35 dark:border-rose-500/35 bg-rose-500/[0.06] dark:bg-rose-950/25 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <span className="mt-0.5 sm:mt-0 inline-flex items-center gap-1.5 shrink-0 rounded-full bg-rose-500/15 border border-rose-500/35 px-2 py-0.5 text-[10px] font-mono tabular-nums font-bold uppercase tracking-wider text-rose-800 dark:text-rose-200">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>NOV 30 DEADLINE · {daysLeft}D LEFT</span>
            </span>
            <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 leading-snug">
              Gemini 4 Carbon &amp; Argon{' '}
              <span className="font-mono font-semibold line-through text-zinc-500">$2/$10</span>{' '}
              <span className="font-mono font-bold text-rose-700 dark:text-rose-300">
                → $4/$20 on Dec 1 (+100%)
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Link
              href={getLocalizedPath(carbonAlertEvent.topicLink || '/pricing/gemini-4-carbon-dec-1-migration-guide/')}
              onClick={() =>
                trackEvent('radar_featured_click', {
                  event_id: carbonAlertEvent.id,
                  cta_type: 'primary',
                  target_path: carbonAlertEvent.topicLink || '/pricing/gemini-4-carbon-dec-1-migration-guide/',
                })
              }
              className="min-h-[36px] sm:min-h-[32px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold shadow-sm transition-all active:scale-[0.98]"
            >
              <span>Migration Guide</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href={getLocalizedPath(carbonAlertEvent.ctaLink || '/compare/gemini-4-carbon-vs-claude-sonnet-5.5/')}
              onClick={() =>
                trackEvent('radar_featured_click', {
                  event_id: carbonAlertEvent.id,
                  cta_type: 'secondary',
                  target_path: carbonAlertEvent.ctaLink || '/compare/gemini-4-carbon-vs-claude-sonnet-5.5/',
                })
              }
              className="min-h-[36px] sm:min-h-[32px] inline-flex items-center px-2.5 py-1.5 rounded-lg border border-rose-500/35 bg-white/80 dark:bg-zinc-900/70 text-[11px] font-medium text-rose-800 dark:text-rose-200 hover:bg-rose-500/10 transition-colors"
            >
              Carbon vs Sonnet
            </Link>
          </div>
        </div>
      )}

      {/* Featured 4-Card Bento Strip (isFeatured: true) */}
      {featuredEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {featuredEvents.map((ev) => {
            const colorKey: BadgeColor = ev.badgeColor in BADGE_STYLE ? ev.badgeColor : 'indigo';
            const isUrgentCarbon = ev.id === 'radar-2026-003' || colorKey === 'rose';
            const dynamicBadgeLabel =
              ev.id === 'radar-2026-003'
                ? daysLeft > 0
                  ? `${daysLeft}D LEFT · DEC 1 HIKE`
                  : 'EXPIRES TODAY · DEC 1'
                : ev.badgeText;
            const { primaryHref, primaryLabel, secondaryHref, secondaryLabel } =
              getPrimaryAndSecondaryCta(ev);

            return (
              <article
                key={ev.id}
                className={`group relative overflow-hidden rounded-xl border p-3.5 sm:p-4 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex flex-col justify-between gap-3 ${
                  isUrgentCarbon
                    ? 'border-rose-300/80 dark:border-rose-500/40 bg-gradient-to-b from-rose-50/75 via-white/90 to-white/90 dark:from-rose-950/30 dark:via-zinc-900/75 dark:to-zinc-900/70 hover:border-rose-400 dark:hover:border-rose-500/65 hover:shadow-rose-500/10'
                    : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/70 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-indigo-500/5'
                }`}
              >
                {/* Top 1px Sheen */}
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${
                    isUrgentCarbon
                      ? 'via-rose-500/60 dark:via-rose-400/50'
                      : 'via-zinc-400/30 dark:via-zinc-400/20'
                  }`}
                />

                <div className="space-y-2.5">
                  {/* Layer 1: Provider + Badge */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 truncate">
                      {ev.provider}
                    </span>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9.5px] sm:text-[10px] font-mono tabular-nums font-bold tracking-tight whitespace-nowrap ${
                        isUrgentCarbon
                          ? 'bg-rose-500/12 border-rose-500/35 text-rose-800 dark:bg-rose-500/20 dark:border-rose-400/40 dark:text-rose-200'
                          : BADGE_STYLE[colorKey]
                      }`}
                    >
                      {isUrgentCarbon && (
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                      )}
                      <span>{dynamicBadgeLabel}</span>
                    </span>
                  </div>

                  {/* Layer 2: Title */}
                  <h3
                    className={`text-[13px] font-bold text-zinc-900 dark:text-zinc-50 leading-snug line-clamp-2 min-h-[2.35rem] transition-colors ${
                      isUrgentCarbon
                        ? 'group-hover:text-rose-700 dark:group-hover:text-rose-300'
                        : 'group-hover:text-indigo-600 dark:group-hover:text-indigo-300'
                    }`}
                  >
                    {ev.title}
                  </h3>

                  {/* Layer 3: Highlight Metric Slot */}
                  <div
                    className={`rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/80 px-2.5 py-1.5 flex items-center justify-between gap-2 ${HIGHLIGHT_ACCENT_BORDER[colorKey]}`}
                  >
                    <span
                      className={`font-mono tabular-nums text-[11px] sm:text-xs leading-tight font-bold truncate ${
                        isUrgentCarbon
                          ? 'text-rose-700 dark:text-rose-300'
                          : 'text-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      {ev.highlight}
                    </span>
                    {typeof ev.discountPercent === 'number' ? (
                      <span className="shrink-0 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                        -{ev.discountPercent}%
                      </span>
                    ) : isUrgentCarbon ? (
                      <span className="shrink-0 rounded bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-mono tabular-nums font-bold text-rose-700 dark:text-rose-300">
                        +100%
                      </span>
                    ) : null}
                  </div>

                  {/* Layer 4a: Description */}
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
                    {ev.description}
                  </p>
                </div>

                {/* Layer 4b: Route-Split CTA Footer */}
                <div className="pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between gap-2">
                  <Link
                    href={getLocalizedPath(primaryHref)}
                    onClick={() =>
                      trackEvent('radar_featured_click', {
                        event_id: ev.id,
                        cta_type: 'primary',
                        target_path: primaryHref,
                      })
                    }
                    className={`min-h-[36px] inline-flex items-center gap-1 text-[11px] font-semibold transition-colors ${
                      isUrgentCarbon
                        ? 'text-rose-700 dark:text-rose-300 hover:text-rose-600 dark:hover:text-rose-200'
                        : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300'
                    }`}
                  >
                    <span>{primaryLabel}</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  {secondaryHref && secondaryLabel ? (
                    <Link
                      href={getLocalizedPath(secondaryHref)}
                      onClick={() =>
                        trackEvent('radar_featured_click', {
                          event_id: ev.id,
                          cta_type: 'secondary',
                          target_path: secondaryHref,
                        })
                      }
                      className="min-h-[36px] inline-flex items-center px-2 rounded-md text-[10px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                      {secondaryLabel}
                    </Link>
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-500">
                      {ev.timestamp}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Existing Market Radar Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredItems.map((item: MarketRadarItem) => {
          const badgeClass = getBadgeStyle(item.type);
          const hasModelLink = !!item.modelId;

          const itemI18n = item.i18n?.[locale];
          const displayTitle = itemI18n?.title || item.title;
          const displaySummary = itemI18n?.summary || item.summary;
          const displayBadge = itemI18n?.badgeText || item.badgeText;

          return (
            <div
              key={item.id}
              className="group rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-950/60 p-3.5 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900/60 transition-all flex flex-col justify-between space-y-2.5"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`px-2 py-0.5 rounded-md font-semibold border ${badgeClass}`}>
                    {displayBadge}
                  </span>
                  <span className="text-zinc-500 font-mono flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{item.effectiveDate}</span>
                  </span>
                </div>

                <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between gap-2">
                  <span className="text-zinc-600 dark:text-zinc-400 font-mono uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    {item.provider}
                  </span>
                  {hasModelLink && item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-normal text-[10px] transition-colors shrink-0"
                    >
                      <span>{radarT.officialAnnouncement}</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>

                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
                  {displayTitle}
                </h3>

                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
                  {displaySummary}
                </p>
              </div>

              <div className="pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between text-xs">
                <div className="text-zinc-600 dark:text-zinc-400 font-mono text-[10px]">
                  {item.metrics?.inputPerM !== undefined && item.metrics?.outputPerM !== undefined && (
                    <span>${item.metrics.inputPerM} / ${item.metrics.outputPerM} <span className="text-zinc-500 dark:text-zinc-600">/1M</span></span>
                  )}
                  {item.metrics?.throughputTps && (
                    <span className="ml-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">{item.metrics.throughputTps} t/s</span>
                  )}
                </div>

                {hasModelLink ? (
                  <Link
                    href={getLocalizedPath(`/models/${item.modelId}/`)}
                    className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium text-[11px] transition-colors"
                  >
                    <span>{radarT.viewDetails}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 text-[11px] transition-colors"
                  >
                    <span>{radarT.officialAnnouncement}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
