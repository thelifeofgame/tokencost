'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, ExternalLink } from 'lucide-react';
import marketRadarData from '@/data/market_radar.json';
import { useI18n } from '@/i18n/I18nProvider';

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

export default function MarketPulseRadar() {
  const { t, locale, getLocalizedPath } = useI18n();
  const [activeTab, setActiveTab] = useState<'all' | 'new_model' | 'price_cut' | 'caching_update'>('all');

  const items: MarketRadarItem[] = (marketRadarData.items || []) as MarketRadarItem[];

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
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'price_cut':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'promo':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'caching_update':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  const radarT = t.simulator.radar;

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-4 sm:p-5 backdrop-blur-md shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-400 uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span>{radarT.badge}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-zinc-100 flex items-center gap-2">
            <span>{radarT.title}</span>
            <span className="text-[10px] font-mono font-medium text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-700/60">
              {radarT.sync}
            </span>
          </h2>
          <p className="text-xs text-zinc-400">
            {radarT.desc}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-medium">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap text-xs ${
              activeTab === 'all'
                ? 'bg-zinc-100 text-zinc-900 border-zinc-200 font-semibold shadow-sm'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            {radarT.tabs.all} ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('new_model')}
            className={`px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap text-xs ${
              activeTab === 'new_model'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            {radarT.tabs.new_model}
          </button>
          <button
            onClick={() => setActiveTab('price_cut')}
            className={`px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap text-xs ${
              activeTab === 'price_cut'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            {radarT.tabs.price_cut}
          </button>
          <button
            onClick={() => setActiveTab('caching_update')}
            className={`px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap text-xs ${
              activeTab === 'caching_update'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            {radarT.tabs.caching_update}
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredItems.map((item: MarketRadarItem) => {
          const badgeClass = getBadgeStyle(item.type);
          const hasModelLink = !!item.modelId;

          // Multi-language resolution
          const itemI18n = item.i18n?.[locale];
          const displayTitle = itemI18n?.title || item.title;
          const displaySummary = itemI18n?.summary || item.summary;
          const displayBadge = itemI18n?.badgeText || item.badgeText;

          return (
            <div
              key={item.id}
              className="group rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all flex flex-col justify-between space-y-2.5"
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

                <div className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                  <span className="text-zinc-400 font-mono uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                    {item.provider}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-zinc-100 group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
                  {displayTitle}
                </h3>

                <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                  {displaySummary}
                </p>
              </div>

              <div className="pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                <div className="text-zinc-400 font-mono text-[10px]">
                  {item.metrics?.inputPerM !== undefined && item.metrics?.outputPerM !== undefined && (
                    <span>${item.metrics.inputPerM} / ${item.metrics.outputPerM} <span className="text-zinc-600">/1M</span></span>
                  )}
                  {item.metrics?.throughputTps && (
                    <span className="ml-1.5 text-emerald-400 font-semibold">{item.metrics.throughputTps} t/s</span>
                  )}
                </div>

                {hasModelLink ? (
                  <Link
                    href={getLocalizedPath(`/models/${item.modelId}/`)}
                    className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium text-[11px] transition-colors"
                  >
                    <span>{radarT.viewDetails}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-200 text-[11px] transition-colors"
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
