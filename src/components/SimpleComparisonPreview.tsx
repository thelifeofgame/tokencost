'use client';

import React, { useMemo } from 'react';
import { ArrowRight, Network, Sparkles } from 'lucide-react';
import type { ModelCostBreakdown, ModelPricingRule, RouterRecommendation } from '@/types/pricing';
import { useI18n } from '@/i18n/I18nProvider';
import { formatCurrency } from '@/lib/utils';

interface SimpleComparisonPreviewProps {
  breakdowns: ModelCostBreakdown[];
  routerRecs: RouterRecommendation[];
  baselineModel: ModelPricingRule;
  baselineCost: number;
  onExpandAdvanced: () => void;
  className?: string;
}

export default function SimpleComparisonPreview({
  breakdowns,
  routerRecs,
  baselineModel,
  baselineCost,
  onExpandAdvanced,
  className,
}: SimpleComparisonPreviewProps) {
  const { t } = useI18n();

  const topThree = useMemo(() => {
    const nonZero = breakdowns.filter((b) => b.monthlyNetCost > 0);
    return (nonZero.length >= 3 ? nonZero : breakdowns).slice(0, 3);
  }, [breakdowns]);

  const bestRouterRec = useMemo(() => {
    return routerRecs.reduce<RouterRecommendation | null>((best, rec) => {
      if (!best || rec.savingsVsBaseline > best.savingsVsBaseline) return rec;
      return best;
    }, null);
  }, [routerRecs]);

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md shadow-sm shadow-zinc-950/[0.04] dark:shadow-xl flex flex-col justify-between gap-4 ${className ?? ''}`}
    >
      {/* Top 1px sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/35 dark:via-indigo-400/25 to-transparent" />

      {/* 1. Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
            <h2 className="text-sm font-semibold tracking-tight uppercase text-zinc-900 dark:text-zinc-100 truncate">
              {t.scenarios.previewTitle}
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1">
            {t.scenarios.previewSubtitle.replace('{model}', baselineModel.modelName)}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
          {t.scenarios.topThreeBadge}
        </span>
      </div>

      {/* 2. Top 3 Lowest Cost Models */}
      <div className="space-y-2">
        {topThree.map((item, idx) => {
          const isCheapest = idx === 0;
          const savePct =
            baselineCost > 0
              ? Math.round(((baselineCost - item.monthlyNetCost) / baselineCost) * 100)
              : 0;
          return (
            <div
              key={item.model.modelId}
              className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                isCheapest
                  ? 'border-emerald-200/90 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-500/[0.08]'
                  : 'border-zinc-200/80 bg-zinc-50/75 dark:border-zinc-800/80 dark:bg-zinc-950/50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-mono font-bold ${
                    isCheapest
                      ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950'
                      : 'bg-zinc-200/80 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  #{idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {item.model.modelName}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 truncate">
                    {item.model.providerOrg}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs sm:text-sm font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                  {formatCurrency(item.monthlyNetCost)}
                  <span className="ml-0.5 text-[10px] font-normal text-zinc-600 dark:text-zinc-400">
                    {t.common.monthly}
                  </span>
                </span>
                {savePct > 0 && (
                  <span className="rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                    -{savePct}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Optimal Smart Router Savings Summary */}
      <div data-analytics-module="smart_router">
        {bestRouterRec && (
          <div className="rounded-xl border border-indigo-200/90 dark:border-indigo-500/30 bg-indigo-50/70 dark:bg-indigo-500/[0.08] px-3.5 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-500/25 text-indigo-700 dark:text-indigo-300">
                <Network className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 truncate">
                  {bestRouterRec.name}
                </div>
                <div className="text-xs font-mono tabular-nums text-zinc-700 dark:text-zinc-300 truncate">
                  {t.scenarios.previewRouterMeta
                    .replace('{cost}', formatCurrency(bestRouterRec.blendedMonthlyCost))
                    .replace('{model}', baselineModel.modelName)}
                </div>
              </div>
            </div>

            {bestRouterRec.savingsVsBaseline > 0 && (
              <span className="shrink-0 rounded-full border border-emerald-300 dark:border-emerald-500/35 bg-emerald-100/80 dark:bg-emerald-500/15 px-2.5 py-1 text-xs font-mono tabular-nums font-bold text-emerald-800 dark:text-emerald-300 whitespace-nowrap">
                -{bestRouterRec.savingsVsBaseline}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4. Expand Advanced Settings & Full Comparison CTA */}
      <button
        type="button"
        onClick={onExpandAdvanced}
        className="min-h-[44px] sm:min-h-[40px] w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98]"
      >
        <span>{t.scenarios.expandAdvancedCta}</span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      </button>
    </section>
  );
}
