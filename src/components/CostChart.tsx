'use client';

import React, { useState, useMemo } from 'react';
import { ModelCostBreakdown } from '@/types/pricing';
import { formatCurrency, formatPerMillionPrice } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nProvider';
import { BarChart3, Trophy, ChevronDown, ChevronUp, Sparkles, Zap, Brain } from 'lucide-react';
import Link from 'next/link';

interface CostChartProps {
  breakdowns: ModelCostBreakdown[];
}

type CampFilter = 'all' | 'fast' | 'frontier' | 'reasoning';

const FAST_CAMP_IDS = new Set([
  'deepseek-v4.1-flash',
  'glm-5.3-flash',
  'claude-haiku-5.5',
  'gpt-6-luna',
  'qwen3.8-flash',
]);

const FRONTIER_CAMP_IDS = new Set([
  'gemini-4-hydrogen',
  'claude-sonnet-5.5',
  'gpt-6.2-sol',
  'gemini-4-neon',
  'claude-opus-5.5',
  'gpt-6.2-astra',
]);

const REASONING_CAMP_IDS = new Set([
  'deepseek-r1',
  'kimi-k3.1-pro',
  'o3-mini',
  'gemini-4-carbon',
  'claude-fable-5.2',
]);

const CAMP_BAR_CLASSES: Record<CampFilter, string> = {
  all: 'bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-500 dark:to-indigo-600',
  fast: 'bg-gradient-to-r from-cyan-600 to-sky-500 dark:from-cyan-500 dark:to-sky-400',
  frontier: 'bg-gradient-to-r from-amber-600 to-orange-500 dark:from-amber-500 dark:to-orange-400',
  reasoning: 'bg-gradient-to-r from-violet-600 to-purple-500 dark:from-violet-500 dark:to-purple-400',
};

const CAMP_LEGEND_DOT_CLASSES: Record<CampFilter, string> = {
  all: 'bg-indigo-600 dark:bg-indigo-500',
  fast: 'bg-cyan-600 dark:bg-cyan-400',
  frontier: 'bg-amber-600 dark:bg-amber-400',
  reasoning: 'bg-purple-600 dark:bg-purple-400',
};

export default function CostChart({ breakdowns }: CostChartProps) {
  const { t, getLocalizedPath } = useI18n();
  const [selectedFilter, setSelectedFilter] = useState<CampFilter>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredBreakdowns = useMemo(() => {
    if (breakdowns.length === 0) return [];

    switch (selectedFilter) {
      case 'fast':
        return breakdowns.filter((b) => FAST_CAMP_IDS.has(b.model.modelId));
      case 'frontier':
        return breakdowns.filter((b) => FRONTIER_CAMP_IDS.has(b.model.modelId));
      case 'reasoning':
        return breakdowns.filter((b) => REASONING_CAMP_IDS.has(b.model.modelId));
      default:
        return breakdowns;
    }
  }, [breakdowns, selectedFilter]);

  if (breakdowns.length === 0) return null;

  const displayModels = isExpanded ? filteredBreakdowns : filteredBreakdowns.slice(0, 8);
  const maxCost = Math.max(
    ...displayModels.map((b) => Math.max(b.baseMonthlyCost, b.monthlyNetCost)),
    1
  );
  const cheapestModel = filteredBreakdowns[0];
  const mostExpensiveModel = filteredBreakdowns[filteredBreakdowns.length - 1];

  const activeCampTip =
    selectedFilter === 'fast'
      ? t.simulator.chart.tipFast
      : selectedFilter === 'frontier'
        ? t.simulator.chart.tipFrontier
        : selectedFilter === 'reasoning'
          ? t.simulator.chart.tipReasoning
          : null;

  const dynamicRangeLabel =
    cheapestModel && mostExpensiveModel
      ? `${t.simulator.chart.rangeSubtitle} (${cheapestModel.model.modelName}${
          mostExpensiveModel.model.modelId !== cheapestModel.model.modelId
            ? ` → ${mostExpensiveModel.model.modelName}`
            : ''
        })`
      : t.simulator.chart.rangeSubtitle;

  return (
    <div className="relative rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md shadow-sm shadow-zinc-950/[0.04] dark:shadow-xl flex flex-col justify-between">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-400/20 to-transparent" />

      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase truncate">
                {t.simulator.chart.title}
              </h2>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2">
              {activeCampTip ? `${activeCampTip}` : dynamicRangeLabel}
            </p>
          </div>

          {cheapestModel && (
            <div className="inline-flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium shrink-0 max-w-[180px] sm:max-w-[200px] xl:max-w-[180px]">
              <Trophy className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">
                {t.simulator.chart.lowestBadge.replace('{model}', cheapestModel.model.modelName)}
              </span>
            </div>
          )}
        </div>

        {/* Filter Segmented Controls (2x2 in 360px & xl:col-span-4, 4-col in sm/2xl) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4 items-center gap-1 p-1 bg-zinc-100/90 dark:bg-zinc-950/70 rounded-xl border border-zinc-200/80 dark:border-zinc-800/90 mb-4 text-[11px]">
          <button
            type="button"
            onClick={() => {
              setSelectedFilter('all');
              setIsExpanded(false);
            }}
            className={`min-h-[34px] sm:flex-1 px-2 py-1 rounded-lg font-medium transition-colors text-center whitespace-nowrap ${
              selectedFilter === 'all'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            {t.simulator.chart.tabAll.replace('{count}', String(breakdowns.length))}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedFilter('fast');
              setIsExpanded(false);
            }}
            title={t.simulator.chart.tipFast}
            className={`min-h-[34px] flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedFilter === 'fast'
                ? 'bg-cyan-700 dark:bg-cyan-600 text-white font-semibold shadow-sm shadow-cyan-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Zap
              className={`h-3 w-3 shrink-0 ${
                selectedFilter === 'fast' ? 'text-cyan-200' : 'text-cyan-600 dark:text-cyan-400'
              }`}
            />
            <span>{t.simulator.chart.tabFast}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedFilter('frontier');
              setIsExpanded(false);
            }}
            title={t.simulator.chart.tipFrontier}
            className={`min-h-[34px] flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedFilter === 'frontier'
                ? 'bg-amber-700 dark:bg-amber-600 text-white font-semibold shadow-sm shadow-amber-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Sparkles
              className={`h-3 w-3 shrink-0 ${
                selectedFilter === 'frontier' ? 'text-amber-200' : 'text-amber-600 dark:text-amber-400'
              }`}
            />
            <span>{t.simulator.chart.tabFrontier}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedFilter('reasoning');
              setIsExpanded(false);
            }}
            title={t.simulator.chart.tipReasoning}
            className={`min-h-[34px] flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedFilter === 'reasoning'
                ? 'bg-purple-700 dark:bg-purple-600 text-white font-semibold shadow-sm shadow-purple-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Brain
              className={`h-3 w-3 shrink-0 ${
                selectedFilter === 'reasoning' ? 'text-purple-200' : 'text-purple-600 dark:text-purple-400'
              }`}
            />
            <span>{t.simulator.chart.tabReasoning}</span>
          </button>
        </div>

        {/* Empty Tier Fallback State */}
        {filteredBreakdowns.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 p-6 text-center space-y-2.5">
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {t.simulator.chart.emptyTierTitle}
            </p>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t.simulator.chart.emptyTierDesc}
            </p>
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
            >
              {t.simulator.chart.resetFilterCta}
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {displayModels.map((item, index) => {
              const isCheapest = index === 0;
              const netBarWidth = Math.max(3, (item.monthlyNetCost / maxCost) * 100);
              const cacheSavingsWidth = Math.max(0, (item.cacheSavingsMonthly / maxCost) * 100);
              const batchSavingsWidth = Math.max(0, (item.batchSavingsMonthly / maxCost) * 100);
              const bm = item.model.benchmarks;
              const tps = bm?.avgThroughputTokS;
              const isEstPerf = bm?.isEstimatedPerformance;
              const isFastTps = typeof tps === 'number' && tps >= 120;

              return (
                <div key={item.model.modelId} className="group space-y-1">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-[11px] text-zinc-500 w-5 shrink-0 tabular-nums">
                        #{index + 1}
                      </span>
                      <Link
                        href={getLocalizedPath(`/models/${item.model.modelId}`)}
                        className="font-medium text-zinc-900 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate"
                        title={item.model.modelName}
                      >
                        {item.model.modelName}
                      </Link>
                      <span className="text-[10px] text-zinc-500 font-mono shrink-0 hidden sm:inline">
                        ({item.model.providerOrg})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono tabular-nums shrink-0">
                      {item.savingsPercent > 0 && (
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                          -{Math.round(item.savingsPercent)}%
                        </span>
                      )}
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(item.monthlyNetCost)}
                      </span>
                    </div>
                  </div>

                  {/* Segmented Waterfall Bar */}
                  <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden flex p-0.5 border border-zinc-200/90 dark:border-zinc-800/80">
                    {/* Net Cost Active Bar */}
                    <div
                      style={{ width: `${netBarWidth}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCheapest
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-500 dark:to-teal-400 shadow-sm shadow-emerald-600/20 dark:shadow-emerald-500/20'
                          : CAMP_BAR_CLASSES[selectedFilter]
                      }`}
                      title={`${t.simulator.chart.netCost}: ${formatCurrency(item.monthlyNetCost)}`}
                    />

                    {/* Prompt Cache Savings (Green Hatch) */}
                    {cacheSavingsWidth > 0 && (
                      <div
                        style={{ width: `${cacheSavingsWidth}%` }}
                        className="h-full bg-emerald-500/25 dark:bg-emerald-500/30 bg-hatch-emerald border-l border-emerald-600/60 dark:border-emerald-400/50"
                        title={`${t.simulator.chart.cacheSavings}: ${formatCurrency(item.cacheSavingsMonthly)}`}
                      />
                    )}

                    {/* Batch API Savings (Purple Hatch) */}
                    {batchSavingsWidth > 0 && (
                      <div
                        style={{ width: `${batchSavingsWidth}%` }}
                        className="h-full bg-purple-500/25 dark:bg-purple-500/30 bg-hatch-purple border-l border-purple-600/60 dark:border-purple-400/50"
                        title={`${t.simulator.chart.batchSavings}: ${formatCurrency(item.batchSavingsMonthly)}`}
                      />
                    )}
                  </div>

                  {/* Compact Telemetry Row: tok/s · Benchmark · Input $/M */}
                  <div className="flex items-center justify-between gap-2 pt-0.5 text-[10px] font-mono tabular-nums">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {typeof tps === 'number' ? (
                        <span
                          className={`inline-flex items-center gap-0.5 whitespace-nowrap ${
                            isFastTps
                              ? 'text-cyan-700 dark:text-cyan-300 font-semibold'
                              : 'text-zinc-600 dark:text-zinc-400'
                          }`}
                          title={
                            isEstPerf
                              ? 'Estimated throughput tier (tok/s)'
                              : 'Measured output throughput (tok/s)'
                          }
                        >
                          <Zap
                            className={`h-2.5 w-2.5 shrink-0 ${
                              isFastTps ? 'text-cyan-600 dark:text-cyan-400' : 'text-zinc-500'
                            }`}
                          />
                          <span>{isEstPerf ? `~${tps}` : tps} tok/s</span>
                        </span>
                      ) : (
                        <span className="text-zinc-500 whitespace-nowrap">-- tok/s</span>
                      )}

                      <span className="text-zinc-400 dark:text-zinc-600">·</span>

                      {bm?.intelligenceIndex != null ? (
                        <span
                          title="Artificial Analysis Intelligence Index"
                          className="inline-flex items-center rounded px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200/80 dark:border-indigo-500/25 text-indigo-700 dark:text-indigo-300 font-semibold leading-none whitespace-nowrap"
                        >
                          AA {bm.intelligenceIndex.toFixed(1)}
                        </span>
                      ) : bm?.arenaElo != null ? (
                        <span
                          title="Chatbot Arena ELO"
                          className="inline-flex items-center rounded px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200/80 dark:border-indigo-500/25 text-indigo-700 dark:text-indigo-300 font-semibold leading-none whitespace-nowrap"
                        >
                          Elo {bm.arenaElo}
                        </span>
                      ) : bm?.codingIndex != null ? (
                        <span
                          title={bm.codingIndex <= 100 ? 'Coding Benchmark (%)' : 'Coding Arena ELO'}
                          className="inline-flex items-center rounded px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200/80 dark:border-indigo-500/25 text-indigo-700 dark:text-indigo-300 font-semibold leading-none whitespace-nowrap"
                        >
                          {bm.codingIndex <= 100 ? `Code ${bm.codingIndex}%` : `Code ${bm.codingIndex}`}
                        </span>
                      ) : (
                        <span
                          title={t.simulator.chart.benchmarkMissingHint}
                          className="inline-flex items-center rounded px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/90 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-400 font-medium leading-none cursor-help whitespace-nowrap"
                        >
                          {t.growth.noBenchmark}
                        </span>
                      )}
                    </div>

                    <span className="text-zinc-600 dark:text-zinc-400 shrink-0 whitespace-nowrap">
                      In {formatPerMillionPrice(item.model.inputPerM)}/M
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Expand / Collapse Button if > 8 items */}
        {filteredBreakdowns.length > 8 && mostExpensiveModel && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-950/60 hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80 border border-zinc-200/90 dark:border-zinc-800 rounded-lg transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  <span>{t.simulator.chart.collapseList}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  <span>
                    {t.simulator.chart.showAllModels.replace(
                      '{count}',
                      String(filteredBreakdowns.length)
                    )}{' '}
                    ({mostExpensiveModel.model.modelName})
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Legend & Footer */}
      <div className="mt-5 pt-3.5 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-wrap items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400 gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${CAMP_LEGEND_DOT_CLASSES[selectedFilter]}`} />
            <span>{t.simulator.chart.netCost}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500/40 border border-emerald-600 dark:border-emerald-400" />
            <span>{t.simulator.chart.cacheSavings}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-500/40 border border-purple-600 dark:border-purple-400" />
            <span>{t.simulator.chart.batchSavings}</span>
          </div>
        </div>
        <span className="font-mono text-zinc-500 text-[10px]">
          {t.simulator.chart.clientEngineNote}
        </span>
      </div>
    </div>
  );
}
