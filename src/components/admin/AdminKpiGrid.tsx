'use client';

import React from 'react';
import { AnalyticsOverviewResponse } from '@/types/analytics';
import { formatCompactNumber, formatExactInt, formatPct } from './formatters';

interface AdminKpiGridProps {
  kpis: AnalyticsOverviewResponse['kpis'];
}

interface KpiItem {
  key: 'edgeRequests' | 'edgePageViews' | 'humanPv' | 'clicks' | 'conversions';
  titleZh: string;
  subtitleEn: string;
  sourceLabel: string;
  sourceClass: string;
  dotClass: string;
  value: number;
  subLabel: string;
  subValue: string;
  highlightHover?: boolean;
}

export default function AdminKpiGrid({ kpis }: AdminKpiGridProps) {
  const items: KpiItem[] = [
    {
      key: 'edgeRequests',
      titleZh: '全站请求',
      subtitleEn: 'EDGE REQUESTS',
      sourceLabel: 'Edge',
      sourceClass:
        'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/70',
      dotClass: 'bg-indigo-500',
      value: kpis.edgeRequests,
      subLabel: '缓存命中率 Cache Hit',
      subValue: formatPct(kpis.cacheHitRate),
    },
    {
      key: 'edgePageViews',
      titleZh: '边缘页面访问',
      subtitleEn: 'EDGE PAGE VIEWS',
      sourceLabel: 'Edge',
      sourceClass:
        'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/70',
      dotClass: 'bg-cyan-500',
      value: kpis.edgePageViews,
      subLabel: '边缘独立访客 Uniques',
      subValue: `${formatExactInt(kpis.edgeUniques)} UV`,
    },
    {
      key: 'humanPv',
      titleZh: '真实人类 PV',
      subtitleEn: 'VERIFIED HUMAN PV',
      sourceLabel: 'Human',
      sourceClass:
        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
      dotClass: 'bg-emerald-500',
      value: kpis.humanPv,
      subLabel: '独立会话 Sessions',
      subValue: formatExactInt(kpis.humanSessions),
    },
    {
      key: 'clicks',
      titleZh: '交互点击数',
      subtitleEn: 'TRACKED CLICKS',
      sourceLabel: 'Human',
      sourceClass:
        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
      dotClass: 'bg-indigo-500',
      value: kpis.clicks,
      subLabel: '页面点击率 CTR',
      subValue: formatPct(kpis.ctr),
    },
    {
      key: 'conversions',
      titleZh: '商业转化出站',
      subtitleEn: 'CONVERSIONS',
      sourceLabel: 'Revenue',
      sourceClass:
        'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
      dotClass: 'bg-amber-500',
      value: kpis.conversions,
      subLabel: '会话转化率 CVR',
      subValue: formatPct(kpis.cvr, 2),
      highlightHover: true,
    },
  ];

  return (
    <section
      aria-label="核心指标概览"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4"
    >
      {items.map((item) => {
        const delta = kpis.deltas?.[item.key] ?? null;
        const isZero = item.value === 0;
        return (
          <div
            key={item.key}
            className={`relative rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md shadow-sm shadow-zinc-950/[0.03] dark:shadow-none transition-colors ${
              item.highlightHover
                ? 'hover:border-amber-500/40 dark:hover:border-amber-500/30'
                : 'hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-400/20 to-transparent" />

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.dotClass}`} />
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 truncate">
                  {item.titleZh}
                </span>
              </div>
              <span
                className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-mono font-medium ${item.sourceClass}`}
              >
                {item.sourceLabel}
              </span>
            </div>

            <div className="mt-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {item.subtitleEn}
            </div>

            <div className="mt-3 flex items-baseline justify-between gap-2">
              <span
                title={formatExactInt(item.value)}
                className={`text-2xl font-bold font-mono tabular-nums tracking-tight ${
                  isZero ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-900 dark:text-zinc-50'
                }`}
              >
                {item.key === 'edgeRequests' && item.value >= 10000
                  ? formatCompactNumber(item.value)
                  : formatExactInt(item.value)}
              </span>

              {delta !== null && Number.isFinite(delta) && (
                <span
                  className={`text-[11px] font-mono tabular-nums font-semibold px-1.5 py-0.5 rounded ${
                    delta >= 0
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                      : 'text-rose-700 dark:text-rose-400 bg-rose-500/10'
                  }`}
                >
                  {delta >= 0 ? '▲ +' : '▼ '}
                  {delta.toFixed(1)}%
                </span>
              )}
            </div>

            <div className="mt-3 pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between gap-2 text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 truncate">{item.subLabel}</span>
              <span
                className={`font-mono tabular-nums font-medium shrink-0 ${
                  isZero ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-800 dark:text-zinc-200'
                }`}
              >
                {item.subValue}
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
