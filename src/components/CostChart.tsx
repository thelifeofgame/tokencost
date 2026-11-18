'use client';

import React, { useState, useMemo } from 'react';
import { ModelCostBreakdown } from '@/types/pricing';
import { formatCurrency } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nProvider';
import { BarChart3, Trophy, ChevronDown, ChevronUp, Sparkles, Zap, Brain } from 'lucide-react';
import Link from 'next/link';

interface CostChartProps {
  breakdowns: ModelCostBreakdown[];
}

export default function CostChart({ breakdowns }: CostChartProps) {
  const { t, getLocalizedPath } = useI18n();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'frontier' | 'fast' | 'reasoning'>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter breakdown models by selected tab
  const filteredBreakdowns = useMemo(() => {
    if (breakdowns.length === 0) return [];

    switch (selectedFilter) {
      case 'frontier':
        return breakdowns.filter((b) =>
          ['gpt-6.1-sol', 'claude-sonnet-5.5', 'claude-fable-5.2', 'gemini-2.5-pro', 'gpt-4o'].includes(b.model.modelId)
        );
      case 'fast':
        return breakdowns.filter((b) =>
          ['gpt-6-luna', 'deepseek-v3', 'gemini-2.5-flash', 'gpt-4.1-mini', 'claude-haiku-4.5', 'claude-3-5-haiku'].includes(b.model.modelId)
        );
      case 'reasoning':
        return breakdowns.filter((b) =>
          ['deepseek-r1', 'gpt-6.1-terra', 'o1', 'o3-mini'].includes(b.model.modelId)
        );
      default:
        return breakdowns;
    }
  }, [breakdowns, selectedFilter]);

  if (breakdowns.length === 0) return null;

  // Number of items to display (default 8, expandable to all)
  const displayModels = isExpanded ? filteredBreakdowns : filteredBreakdowns.slice(0, 8);
  const maxCost = Math.max(...displayModels.map((b) => Math.max(b.baseMonthlyCost, b.monthlyNetCost)), 1);
  const cheapestModel = filteredBreakdowns[0];

  return (
    <div className="relative rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 sm:p-6 backdrop-blur-md shadow-xl flex flex-col justify-between">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-400/20 to-transparent" />

      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold tracking-tight text-zinc-100 uppercase">
                {t.simulator.chart.title}
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Mainstream models from low to high (GPT-6 Luna → Claude Fable 5.2)
            </p>
          </div>

          {cheapestModel && (
            <div className="inline-flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
              <Trophy className="h-3 w-3 text-emerald-400" />
              <span>Lowest: {cheapestModel.model.modelName}</span>
            </div>
          )}
        </div>

        {/* Filter Segmented Controls */}
        <div className="flex items-center gap-1 p-1 bg-zinc-950/70 rounded-xl border border-zinc-800/90 mb-4 text-[11px]">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`flex-1 py-1 rounded-lg font-medium transition-colors text-center ${
              selectedFilter === 'all'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Mainstream ({filteredBreakdowns.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('fast')}
            className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedFilter === 'fast'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="h-3 w-3 text-emerald-400" />
            <span>Fast</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('frontier')}
            className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedFilter === 'frontier'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="h-3 w-3 text-amber-400" />
            <span>Frontier</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('reasoning')}
            className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedFilter === 'reasoning'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Brain className="h-3 w-3 text-purple-400" />
            <span>Reasoning</span>
          </button>
        </div>

        {/* Model Waterfall Rows */}
        <div className="space-y-3">
          {displayModels.map((item, index) => {
            const isCheapest = index === 0;
            const netBarWidth = Math.max(3, (item.monthlyNetCost / maxCost) * 100);
            const cacheSavingsWidth = Math.max(0, (item.cacheSavingsMonthly / maxCost) * 100);
            const batchSavingsWidth = Math.max(0, (item.batchSavingsMonthly / maxCost) * 100);

            return (
              <div key={item.model.modelId} className="group space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    <span className="font-mono text-[11px] text-zinc-500 w-4 shrink-0">
                      #{index + 1}
                    </span>
                    <Link
                      href={getLocalizedPath(`/models/${item.model.modelId}`)}
                      className="font-medium text-zinc-200 group-hover:text-indigo-400 transition-colors truncate"
                      title={item.model.modelName}
                    >
                      {item.model.modelName}
                    </Link>
                    <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                      ({item.model.providerOrg})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono shrink-0">
                    {item.savingsPercent > 0 && (
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        -{Math.round(item.savingsPercent)}%
                      </span>
                    )}
                    <span className="text-xs font-bold text-zinc-100">
                      {formatCurrency(item.monthlyNetCost)}
                    </span>
                  </div>
                </div>

                {/* Segmented Waterfall Bar */}
                <div className="h-2.5 w-full bg-zinc-950 rounded-full overflow-hidden flex p-0.5 border border-zinc-800/80">
                  {/* Net Cost Active Bar */}
                  <div
                    style={{ width: `${netBarWidth}%` }}
                    className={`h-full rounded-full transition-all duration-300 ${
                      isCheapest
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/20'
                        : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                    }`}
                    title={`${t.simulator.chart.netCost}: ${formatCurrency(item.monthlyNetCost)}`}
                  />

                  {/* Prompt Cache Savings (Green Hatch) */}
                  {cacheSavingsWidth > 0 && (
                    <div
                      style={{ width: `${cacheSavingsWidth}%` }}
                      className="h-full bg-emerald-500/30 border-l border-emerald-400/40"
                      title={`${t.simulator.chart.cacheSavings}: ${formatCurrency(item.cacheSavingsMonthly)}`}
                    />
                  )}

                  {/* Batch API Savings (Purple Hatch) */}
                  {batchSavingsWidth > 0 && (
                    <div
                      style={{ width: `${batchSavingsWidth}%` }}
                      className="h-full bg-purple-500/30 border-l border-purple-400/40"
                      title={`${t.simulator.chart.batchSavings}: ${formatCurrency(item.batchSavingsMonthly)}`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Expand / Collapse Button if > 8 items */}
        {filteredBreakdowns.length > 8 && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800 rounded-lg transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  <span>Collapse list</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  <span>Show all {filteredBreakdowns.length} models (to Claude Fable 5.2)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Legend & Footer */}
      <div className="mt-5 pt-3.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between text-[11px] text-zinc-400 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            <span>{t.simulator.chart.netCost}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500/40 border border-emerald-400" />
            <span>{t.simulator.chart.cacheSavings}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-500/40 border border-purple-400" />
            <span>{t.simulator.chart.batchSavings}</span>
          </div>
        </div>
        <span className="font-mono text-zinc-500 text-[10px]">
          100% Client-Side Engine
        </span>
      </div>
    </div>
  );
}
