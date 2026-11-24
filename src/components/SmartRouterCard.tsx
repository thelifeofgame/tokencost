'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { RouterRecommendation, ModelPricingRule } from '@/types/pricing';
import { formatCurrency, formatPerMillionPrice } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nProvider';
import { trackEventThrottled } from '@/lib/analytics';
import { Network, ArrowRight, Code2, ChevronDown, Check, Search, Sparkles, Zap, Brain, History } from 'lucide-react';

interface SmartRouterCardProps {
  recommendations: RouterRecommendation[];
  onOpenExporter: (rec: RouterRecommendation) => void;
  selectedBaselineId?: string;
  onSelectBaseline?: (modelId: string) => void;
  availableModels?: ModelPricingRule[];
  monthlyRequests?: number;
}

// Baseline category presets (synced with 2026-11 Flagship & Flash drops)
const CATEGORY_MODEL_IDS: Record<string, string[]> = {
  flagship: [
    'gemini-4-neon',
    'gpt-6.2-sol',
    'gpt-6.2-astra',
    'claude-opus-5.5',
    'claude-sonnet-5.5',
    'gemini-4-carbon',
    'gpt-6.1-terra',
    'gpt-6.1-sol',
    'claude-fable-5.2',
    'gemini-2.5-pro',
  ],
  fast: [
    'deepseek-v4.1-flash',
    'glm-5.3-flash',
    'qwen3-coder-30b-a3b-instruct',
    'minimax-m3.1-flash',
    'gpt-6-luna',
    'claude-haiku-4.5',
    'gemini-2.5-flash',
    'deepseek-v3',
    'gpt-4.1-mini',
  ],
  reasoning: ['deepseek-r1', 'o1', 'o3-mini', 'o3'],
  legacy: ['gpt-4o', 'claude-3-5-sonnet', 'gpt-4o-mini', 'claude-3-5-haiku'],
};

const STAGE_COLOR_TOKENS = [
  {
    bar: 'bg-indigo-500',
    dot: 'bg-indigo-500',
    label: 'text-indigo-700 dark:text-indigo-400',
    borderTop: 'border-t-2 border-t-indigo-500/70',
  },
  {
    bar: 'bg-cyan-500 dark:bg-cyan-400',
    dot: 'bg-cyan-500 dark:bg-cyan-400',
    label: 'text-cyan-700 dark:text-cyan-400',
    borderTop: 'border-t-2 border-t-cyan-500/70',
  },
  {
    bar: 'bg-emerald-500 dark:bg-emerald-400',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
    label: 'text-emerald-800 dark:text-emerald-400',
    borderTop: 'border-t-2 border-t-emerald-500/70',
  },
];

function formatCompactModelName(modelName: string): string {
  return modelName.replace(/^[^:]+:\s*/, '').trim();
}

export default function SmartRouterCard({
  recommendations,
  onOpenExporter,
  selectedBaselineId = 'gpt-6.2-sol',
  onSelectBaseline,
  availableModels = [],
  monthlyRequests,
}: SmartRouterCardProps) {
  const { t } = useI18n();
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(
    recommendations[0]?.id || 'weekend-coding-flash'
  );

  const [baselineMenuOpen, setBaselineMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'flagship' | 'fast' | 'reasoning' | 'legacy'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setBaselineMenuOpen(false);
      }
    }
    if (baselineMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [baselineMenuOpen]);

  const currentRec =
    recommendations.find((r) => r.id === selectedStrategyId) || recommendations[0];

  // Filtered baseline models for selection menu
  const candidateBaselines = useMemo(() => {
    const list = availableModels.filter((m) => {
      if (m.inputPerM === 0 && m.outputPerM === 0) return false;
      if (m.modelId.includes(':free') || m.modelName.includes('(free)')) return false;
      return true;
    });

    return list.filter((m) => {
      if (categoryFilter !== 'all') {
        const allowed = CATEGORY_MODEL_IDS[categoryFilter] || [];
        const isReasoningFallback =
          categoryFilter === 'reasoning' &&
          m.capabilities?.reasoning &&
          m.latencyTier?.startsWith('reasoning');
        if (!allowed.includes(m.modelId) && !isReasoningFallback) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.modelName.toLowerCase().includes(q) ||
          m.providerOrg.toLowerCase().includes(q) ||
          m.modelId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [availableModels, categoryFilter, searchQuery]);

  const groupedAllBaselines = useMemo(() => {
    if (categoryFilter !== 'all' || searchQuery.trim()) return null;
    const flagshipSet = new Set(CATEGORY_MODEL_IDS.flagship);
    const fastSet = new Set(CATEGORY_MODEL_IDS.fast);
    const flagships: ModelPricingRule[] = [];
    const flashModels: ModelPricingRule[] = [];
    const others: ModelPricingRule[] = [];

    for (const m of candidateBaselines) {
      if (flagshipSet.has(m.modelId)) {
        flagships.push(m);
      } else if (fastSet.has(m.modelId)) {
        flashModels.push(m);
      } else {
        others.push(m);
      }
    }
    return { flagships, flashModels, others };
  }, [candidateBaselines, categoryFilter, searchQuery]);

  if (!currentRec) return null;

  const costDelta = currentRec.baselineCost - currentRec.blendedMonthlyCost;
  const isNetSavings = costDelta >= 0;
  const reqs = currentRec.monthlyRequests ?? monthlyRequests ?? 100000;
  const costPer1k = reqs > 0 ? (currentRec.blendedMonthlyCost / reqs) * 1000 : 0;
  const blendedFormatted = formatCurrency(currentRec.blendedMonthlyCost);
  const [savePrefix, saveSuffix = ''] = t.simulator.router.saveMonthly.split('{amount}');

  const renderModelRow = (m: ModelPricingRule) => {
    const isSelected = m.modelId === selectedBaselineId;
    return (
      <button
        key={m.modelId}
        type="button"
        onClick={() => {
          if (onSelectBaseline) onSelectBaseline(m.modelId);
          trackEventThrottled('smart_router_interact', { action: 'baseline_select', model_id: m.modelId }, 1000);
          setBaselineMenuOpen(false);
        }}
        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
          isSelected
            ? 'bg-indigo-50 border border-indigo-300 text-indigo-900 dark:bg-indigo-950/60 dark:border-indigo-500/40 dark:text-indigo-200'
            : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
        }`}
      >
        <div className="min-w-0 pr-2">
          <div className="text-xs font-semibold truncate flex items-center gap-1.5">
            <span className="truncate">{m.modelName}</span>
            {m.isFrontier && (
              <span className="shrink-0 rounded px-1 py-0.2 bg-indigo-500/10 border border-indigo-500/25 text-[9px] font-mono font-semibold text-indigo-700 dark:text-indigo-300">
                Frontier
              </span>
            )}
            {isSelected && <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400 shrink-0" />}
          </div>
          <div className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono tabular-nums">
            {m.providerOrg} • {formatPerMillionPrice(m.inputPerM)}/1M in, {formatPerMillionPrice(m.outputPerM)}/1M out
          </div>
        </div>
        <div className="text-[11px] font-mono tabular-nums font-bold text-zinc-700 dark:text-zinc-300 shrink-0">
          {formatPerMillionPrice(m.inputPerM)}
        </div>
      </button>
    );
  };

  return (
    <div className="relative rounded-2xl border border-indigo-500/25 dark:border-indigo-500/30 bg-white/85 dark:bg-zinc-900/60 dark:bg-gradient-to-b dark:from-indigo-950/20 dark:via-zinc-900/70 dark:to-zinc-900/60 p-4 sm:p-5 backdrop-blur-md shadow-lg shadow-zinc-950/[0.04] dark:shadow-2xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />

      {/* Header */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/15 dark:bg-indigo-600/30 border border-indigo-500/30 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Network className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">
                {t.simulator.router.title}
              </h2>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-mono font-medium bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/70 whitespace-nowrap">
                {t.simulator.router.cascadeBadge.replace('{stages}', String(currentRec.stages.length))}
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              {t.simulator.router.subtitle}
            </p>
          </div>
        </div>

        {/* Strategy Switcher Pills */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1 p-1 bg-zinc-100/90 dark:bg-zinc-950/70 rounded-xl border border-zinc-200/90 dark:border-zinc-800">
          {recommendations.map((rec, idx) => {
            const isSelected = selectedStrategyId === rec.id;
            const isArbitrage = rec.id === 'weekend-coding-flash';
            const spanClass =
              recommendations.length % 2 === 1 && idx === 0 ? 'col-span-2 sm:col-span-1' : '';
            return (
              <button
                key={rec.id}
                type="button"
                onClick={() => { setSelectedStrategyId(rec.id); trackEventThrottled('smart_router_interact', { action: 'strategy_switch', strategy_id: rec.id }, 1000); }}
                className={`min-h-[38px] sm:min-h-[32px] px-3 py-1.5 rounded-lg text-xs font-medium transition-all inline-flex items-center justify-center gap-1.5 ${spanClass} ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/70 dark:hover:bg-zinc-800/60'
                }`}
              >
                <span className="truncate">{rec.name}</span>
                {isArbitrage && (
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border ${
                      isSelected
                        ? 'bg-white/20 text-white border-white/25'
                        : 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30'
                    }`}
                  >
                    NEW
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Comparison Banner: 100% Single-Model Baseline vs Multi-Model Routed Mix */}
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.55fr)_minmax(116px,0.95fr)_minmax(0,1.2fr)] gap-3 sm:gap-2.5 items-stretch p-3.5 sm:p-4 rounded-xl bg-zinc-50/95 dark:bg-zinc-950/75 border border-zinc-200/90 dark:border-zinc-800/80 mb-5 relative">
        {/* Left Zone: 100% Single-Model Baseline */}
        <div className="relative min-w-0 flex flex-col justify-between" ref={dropdownRef}>
          <div>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider leading-tight text-zinc-600 dark:text-zinc-400">
                {t.simulator.router.baselineModel}
              </span>
              {onSelectBaseline && currentRec.baselineModel.modelId !== 'gpt-6.2-sol' && (
                <button
                  type="button"
                  onClick={() => onSelectBaseline('gpt-6.2-sol')}
                  className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors underline shrink-0"
                >
                  Reset
                </button>
              )}
            </div>

            {onSelectBaseline ? (
              <button
                type="button"
                onClick={() => setBaselineMenuOpen(!baselineMenuOpen)}
                className="group w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 min-h-[36px] rounded-lg border border-zinc-300 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/90 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-indigo-500/60 transition-all text-left shadow-sm"
                title={currentRec.baselineModel.modelName}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 animate-pulse" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {formatCompactModelName(currentRec.baselineModel.modelName)}
                  </span>
                </div>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-transform shrink-0 ${
                    baselineMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            ) : (
              <div
                title={currentRec.baselineModel.modelName}
                className="text-sm font-bold text-zinc-900 dark:text-zinc-200 truncate"
              >
                {formatCompactModelName(currentRec.baselineModel.modelName)}
              </div>
            )}
          </div>

          <div className="mt-2">
            <div className="flex items-baseline gap-0.5 font-mono tabular-nums whitespace-nowrap">
              <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(currentRec.baselineCost)}
              </span>
              <span className="text-[11px] font-normal text-zinc-600 dark:text-zinc-400">/mo</span>
            </div>
            <div className="text-[10px] font-mono tabular-nums text-zinc-600 dark:text-zinc-400 truncate">
              {currentRec.baselineModel.providerOrg} · {formatPerMillionPrice(currentRec.baselineModel.inputPerM)}/
              {formatPerMillionPrice(currentRec.baselineModel.outputPerM)} /1M
            </div>
          </div>

          {/* Linear-Style Dropdown Popover */}
          {baselineMenuOpen && onSelectBaseline && (
            <div className="absolute left-0 top-full mt-2 w-[calc(100vw-4rem)] max-w-[344px] sm:w-[352px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] shadow-2xl p-3 z-50 animate-in fade-in-0 zoom-in-95 max-h-[340px] flex flex-col space-y-2.5">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search model or provider..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto py-0.5 text-[10px] scrollbar-none no-scrollbar">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`px-2 py-1 rounded-md whitespace-nowrap transition-colors ${
                    categoryFilter === 'all'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('flagship')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md whitespace-nowrap transition-colors ${
                    categoryFilter === 'flagship'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Sparkles className="h-2.5 w-2.5 text-amber-500 dark:text-amber-400" />
                  <span>Flagship</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('fast')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md whitespace-nowrap transition-colors ${
                    categoryFilter === 'fast'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Zap className="h-2.5 w-2.5 text-emerald-500 dark:text-emerald-400" />
                  <span>Fast</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('reasoning')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md whitespace-nowrap transition-colors ${
                    categoryFilter === 'reasoning'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Brain className="h-2.5 w-2.5 text-purple-500 dark:text-purple-400" />
                  <span>Reasoning</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('legacy')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md whitespace-nowrap transition-colors ${
                    categoryFilter === 'legacy'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <History className="h-2.5 w-2.5 text-zinc-500 dark:text-zinc-400" />
                  <span>Legacy</span>
                </button>
              </div>

              {/* Models List */}
              <div className="flex-1 overflow-y-auto space-y-1 pr-1.5 max-h-52 custom-scrollbar">
                {groupedAllBaselines ? (
                  <>
                    {groupedAllBaselines.flagships.length > 0 && (
                      <div>
                        <div className="sticky top-0 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-sm px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5" />
                          <span>2026 Flagship</span>
                        </div>
                        <div className="space-y-0.5">
                          {groupedAllBaselines.flagships.map(renderModelRow)}
                        </div>
                      </div>
                    )}
                    {groupedAllBaselines.flashModels.length > 0 && (
                      <div>
                        <div className="sticky top-0 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-sm px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-1">
                          <Zap className="h-2.5 w-2.5" />
                          <span>Flash &amp; Arbitrage</span>
                        </div>
                        <div className="space-y-0.5">
                          {groupedAllBaselines.flashModels.map(renderModelRow)}
                        </div>
                      </div>
                    )}
                    {groupedAllBaselines.others.length > 0 && (
                      <div>
                        <div className="sticky top-0 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-sm px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mt-1">
                          Other Models
                        </div>
                        <div className="space-y-0.5">
                          {groupedAllBaselines.others.map(renderModelRow)}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-0.5 divide-y divide-zinc-100 dark:divide-zinc-900/60">
                    {candidateBaselines.map(renderModelRow)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Center Zone: Delta & Percentage vs 100% Baseline */}
        <div
          className={`flex sm:flex-col justify-between sm:justify-center items-center gap-2 sm:gap-1 px-3 py-2 sm:py-0 sm:px-2.5 rounded-lg sm:rounded-none sm:border-x border-zinc-200/80 dark:border-zinc-800/70 sm:text-center min-w-0 ${
            isNetSavings && currentRec.savingsVsBaseline > 0
              ? 'bg-emerald-500/[0.08] dark:bg-emerald-500/10 border border-emerald-500/20 sm:border-y-0 sm:bg-transparent sm:dark:bg-transparent'
              : !isNetSavings
                ? 'bg-indigo-500/[0.08] dark:bg-indigo-500/10 border border-indigo-500/20 sm:border-y-0 sm:bg-transparent sm:dark:bg-transparent'
                : 'bg-zinc-100/80 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/70 sm:border-y-0 sm:bg-transparent sm:dark:bg-transparent'
          }`}
        >
          <span className="text-[10px] font-medium leading-tight text-zinc-600 dark:text-zinc-400">
            {t.simulator.router.vsBaseline}
          </span>

          {isNetSavings && currentRec.savingsVsBaseline > 0 ? (
            <div className="flex sm:flex-col items-center gap-2 sm:gap-1">
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-emerald-500/[0.12] dark:bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold font-mono tabular-nums text-emerald-800 dark:text-emerald-400 whitespace-nowrap">
                <ArrowRight className="hidden sm:inline h-3.5 w-3.5" />
                <span>-{currentRec.savingsVsBaseline}%</span>
              </span>
              <span className="text-[11px] font-semibold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 leading-tight">
                {savePrefix}
                <span className="whitespace-nowrap">
                  {formatCurrency(costDelta)}
                  {saveSuffix}
                </span>
              </span>
            </div>
          ) : !isNetSavings ? (
            <div className="flex sm:flex-col items-center gap-2 sm:gap-1">
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-indigo-500/[0.12] dark:bg-indigo-500/15 border border-indigo-500/30 text-xs font-bold font-mono tabular-nums text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                <ArrowRight className="hidden sm:inline h-3.5 w-3.5" />
                <span>+{Math.abs(currentRec.savingsVsBaseline)}%</span>
              </span>
              <span className="text-[11px] font-semibold font-mono tabular-nums text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                +{formatCurrency(Math.abs(costDelta))}/mo
              </span>
              <span className="hidden sm:inline text-[10px] text-zinc-600 dark:text-zinc-400">
                Quality Upgrade
              </span>
            </div>
          ) : (
            <div className="flex sm:flex-col items-center gap-2 sm:gap-1">
              <span className="rounded-full px-2 py-0.5 bg-zinc-200/70 dark:bg-zinc-800 text-xs font-bold font-mono tabular-nums text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                0%
              </span>
              <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Cost Parity
              </span>
            </div>
          )}
        </div>

        {/* Right Zone: Multi-Model Routed Mix */}
        <div className="flex flex-col justify-between text-left sm:text-right min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider leading-tight text-indigo-700 dark:text-indigo-400 block">
            {t.simulator.router.blendedCost}
          </span>

          <div className="mt-1">
            <div className="flex items-baseline sm:justify-end gap-0.5 font-mono tabular-nums whitespace-nowrap">
              <span className="text-lg sm:text-xl font-extrabold text-indigo-700 dark:text-indigo-300 leading-tight">
                {blendedFormatted}
              </span>
              <span className="text-[11px] font-semibold text-indigo-600/80 dark:text-indigo-400/80">/mo</span>
            </div>
            <div className="mt-0.5 text-[10px] font-medium leading-tight text-indigo-600 dark:text-indigo-300/90">
              {t.simulator.router.weightedSumHint.replace('{stages}', String(currentRec.stages.length))}
            </div>
            <div className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400 font-mono tabular-nums whitespace-nowrap">
              {formatCurrency(costPer1k)} {t.common.per1kRequests}
            </div>
          </div>
        </div>
      </div>

      {/* Routing Stages Breakdown + Reconciliation Formula Header */}
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              {t.simulator.router.breakdownHeader.replace('{cost}', blendedFormatted)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/[0.12] border border-indigo-200/80 dark:border-indigo-500/25 text-[11px] font-mono tabular-nums font-semibold text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
              {t.simulator.router.stagesSumBadge
                .replace('{stages}', String(currentRec.stages.length))
                .replace('{cost}', blendedFormatted)}
            </span>
          </div>

          <div
            className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-900 p-0.5 gap-0.5 border border-zinc-300/60 dark:border-zinc-800"
            role="img"
            aria-label="Router stage traffic split"
          >
            {currentRec.stages.map((stage, idx) => {
              const token = STAGE_COLOR_TOKENS[idx % STAGE_COLOR_TOKENS.length];
              return (
                <div
                  key={idx}
                  style={{ width: `${stage.trafficSharePercent}%` }}
                  className={`h-full rounded-full transition-all duration-500 ease-out ${token.bar}`}
                  title={`${stage.stageName}: ${stage.trafficSharePercent}%`}
                />
              );
            })}
          </div>
        </div>

        <div className={`grid grid-cols-1 ${currentRec.stages.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-3`}>
          {currentRec.stages.map((stage, idx) => {
            const token = STAGE_COLOR_TOKENS[idx % STAGE_COLOR_TOKENS.length];
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border border-zinc-200/85 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/45 space-y-1.5 ${token.borderTop}`}
              >
                {/* Row 1: Stage Role + Traffic Share */}
                <div className="flex items-center justify-between gap-1.5">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-bold truncate min-w-0 ${token.label}`}>
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${token.dot}`} />
                    <span className="truncate">{stage.stageName}</span>
                  </span>
                  <span className="font-mono tabular-nums text-[11px] font-bold px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shrink-0">
                    {stage.trafficSharePercent}%
                  </span>
                </div>

                {/* Row 2: Compact Model Name + Allocated Monthly Cost */}
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    title={stage.model.modelName}
                    className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate min-w-0"
                  >
                    {formatCompactModelName(stage.model.modelName)}
                  </span>
                  <span className="text-xs font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100 shrink-0 whitespace-nowrap">
                    {formatCurrency(stage.allocatedMonthlyCost)}
                    <span className="text-[10px] font-normal text-zinc-600 dark:text-zinc-400">/mo</span>
                  </span>
                </div>

                {/* Row 3: Base Token Rate (In / Out per 1M) */}
                <div className="text-[10px] font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                  {formatPerMillionPrice(stage.model.inputPerM)} / {formatPerMillionPrice(stage.model.outputPerM)} per 1M
                </div>

                {/* Row 4: Stage Purpose */}
                <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400 line-clamp-2">
                  {stage.purpose}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action CTA Footer */}
      <div className="mt-5 pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-zinc-600 dark:text-zinc-400 text-center sm:text-left">
          {t.simulator.router.exportGuide}
        </p>

        <button
          type="button"
          onClick={() => onOpenExporter(currentRec)}
          className="w-full sm:w-auto min-h-[40px] sm:min-h-[38px] inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 shrink-0"
        >
          <Code2 className="h-4 w-4" />
          <span>{t.simulator.router.exportConfig}</span>
        </button>
      </div>
    </div>
  );
}
