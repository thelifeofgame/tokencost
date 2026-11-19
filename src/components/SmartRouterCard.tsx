'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { RouterRecommendation, ModelPricingRule } from '@/types/pricing';
import { formatCurrency } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nProvider';
import { Network, ArrowRight, Code2, ChevronDown, Check, Search, Sparkles, Zap, Brain, History } from 'lucide-react';

interface SmartRouterCardProps {
  recommendations: RouterRecommendation[];
  onOpenExporter: (rec: RouterRecommendation) => void;
  selectedBaselineId?: string;
  onSelectBaseline?: (modelId: string) => void;
  availableModels?: ModelPricingRule[];
}

// Baseline category presets
const CATEGORY_MODEL_IDS: Record<string, string[]> = {
  flagship: ['gpt-6.1-terra', 'gpt-6.1-sol', 'claude-sonnet-5.5', 'claude-fable-5.2', 'gemini-2.5-pro'],
  fast: ['gpt-6-luna', 'claude-haiku-4.5', 'gemini-2.5-flash', 'deepseek-v3', 'gpt-4.1-mini'],
  reasoning: ['deepseek-r1', 'o1', 'o3-mini'],
  legacy: ['gpt-4o', 'claude-3-5-sonnet'],
};

export default function SmartRouterCard({
  recommendations,
  onOpenExporter,
  selectedBaselineId = 'gpt-6.1-terra',
  onSelectBaseline,
  availableModels = [],
}: SmartRouterCardProps) {
  const { t } = useI18n();
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(
    recommendations[0]?.id || 'frontier-2026'
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
      // Category filter
      if (categoryFilter !== 'all') {
        const allowed = CATEGORY_MODEL_IDS[categoryFilter] || [];
        if (!allowed.includes(m.modelId)) return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return m.modelName.toLowerCase().includes(q) || m.providerOrg.toLowerCase().includes(q) || m.modelId.toLowerCase().includes(q);
      }
      return true;
    });
  }, [availableModels, categoryFilter, searchQuery]);

  if (!currentRec) return null;

  const costDelta = currentRec.baselineCost - currentRec.blendedMonthlyCost;
  const isNetSavings = costDelta >= 0;

  return (
    <div className="relative rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/20 via-zinc-900/70 to-zinc-900/60 p-5 sm:p-6 backdrop-blur-md shadow-2xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-400">
              <Network className="h-3.5 w-3.5" />
            </div>
            <h2 className="text-sm font-semibold tracking-tight text-zinc-100 uppercase">
              {t.simulator.router.title}
            </h2>
            {isNetSavings && currentRec.savingsVsBaseline > 0 ? (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                {t.simulator.router.savingsBadge}: -{currentRec.savingsVsBaseline}%
              </span>
            ) : !isNetSavings ? (
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/20">
                Frontier Tier (+{Math.abs(currentRec.savingsVsBaseline)}%)
              </span>
            ) : null}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {t.simulator.router.subtitle}
          </p>
        </div>

        {/* Strategy Switcher Pills */}
        <div className="flex flex-wrap gap-1 p-1 bg-zinc-950/70 rounded-xl border border-zinc-800">
          {recommendations.map((rec) => (
            <button
              key={rec.id}
              onClick={() => setSelectedStrategyId(rec.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedStrategyId === rec.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              {rec.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Comparison Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 mb-5 relative">
        {/* Baseline Model (Interactive Popover Switcher) */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 block">
              {t.simulator.router.baselineModel}
            </span>
            {onSelectBaseline && currentRec.baselineModel.modelId !== 'gpt-6.1-terra' && (
              <button
                type="button"
                onClick={() => onSelectBaseline('gpt-6.1-terra')}
                className="text-[10px] text-zinc-500 hover:text-indigo-400 transition-colors underline"
              >
                Reset Terra
              </button>
            )}
          </div>

          {onSelectBaseline ? (
            <button
              type="button"
              onClick={() => setBaselineMenuOpen(!baselineMenuOpen)}
              className="group w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-zinc-700/80 bg-zinc-900/90 hover:bg-zinc-800 hover:border-indigo-500/60 transition-all text-left shadow-sm"
              title="Click to switch baseline model"
            >
              <div className="flex items-center gap-1.5 min-w-0 pr-1">
                <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 animate-pulse" />
                <span className="text-xs font-bold text-zinc-100 truncate">
                  {currentRec.baselineModel.modelName}
                </span>
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-200 transition-transform shrink-0 ${
                  baselineMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          ) : (
            <div className="text-sm font-bold text-zinc-200">
              {currentRec.baselineModel.modelName}
            </div>
          )}

          <div className="mt-1.5 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>
              {formatCurrency(currentRec.baselineCost)} {t.common.monthly}
            </span>
            <span className="text-[10px] text-zinc-500">
              ${currentRec.baselineModel.inputPerM}/${currentRec.baselineModel.outputPerM}
            </span>
          </div>

          {/* Linear-Style Dropdown Popover */}
          {baselineMenuOpen && onSelectBaseline && (
            <div className="absolute left-0 top-full mt-2 w-80 sm:w-88 rounded-xl border border-zinc-800 bg-[#09090b] shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.08)] p-3 z-50 animate-in fade-in-0 zoom-in-95 max-h-84 flex flex-col space-y-2.5" style={{ backgroundColor: "#09090b" }}>
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search model or provider..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto py-0.5 text-[10px] scrollbar-none no-scrollbar">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                    categoryFilter === 'all'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('flagship')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                    categoryFilter === 'flagship'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                  <span>Flagship</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('fast')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                    categoryFilter === 'fast'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Zap className="h-2.5 w-2.5 text-emerald-400" />
                  <span>Fast</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('reasoning')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                    categoryFilter === 'reasoning'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Brain className="h-2.5 w-2.5 text-purple-400" />
                  <span>Reasoning</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('legacy')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                    categoryFilter === 'legacy'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <History className="h-2.5 w-2.5 text-zinc-400" />
                  <span>Legacy</span>
                </button>
              </div>

              {/* Models List */}
              <div className="flex-1 overflow-y-auto space-y-1 pr-1.5 max-h-52 divide-y divide-zinc-900/60 custom-scrollbar">
                {candidateBaselines.map((m) => {
                  const isSelected = m.modelId === selectedBaselineId;
                  return (
                    <button
                      key={m.modelId}
                      type="button"
                      onClick={() => {
                        onSelectBaseline(m.modelId);
                        setBaselineMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                        isSelected
                          ? 'bg-indigo-950/60 border border-indigo-500/40 text-indigo-200'
                          : 'hover:bg-zinc-900 text-zinc-300'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                          <span>{m.modelName}</span>
                          {isSelected && <Check className="h-3 w-3 text-indigo-400 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {m.providerOrg} • ${m.inputPerM}/1M in, ${m.outputPerM}/1M out
                        </div>
                      </div>
                      <div className="text-[11px] font-mono font-bold text-zinc-300 shrink-0">
                        ${m.inputPerM.toFixed(2)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Arrow / Savings vs Baseline */}
        <div className="flex flex-col justify-center items-start sm:items-center py-2 sm:py-0 border-y sm:border-y-0 sm:border-x border-zinc-800/60 sm:px-4">
          {isNetSavings && currentRec.savingsVsBaseline > 0 ? (
            <>
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                <ArrowRight className="h-4 w-4" />
                <span>-{currentRec.savingsVsBaseline}% Net Reduction</span>
              </div>
              <span className="text-[11px] text-zinc-400 mt-0.5">
                Save {formatCurrency(costDelta)} {t.common.monthly}
              </span>
            </>
          ) : !isNetSavings ? (
            <>
              <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-sm">
                <ArrowRight className="h-4 w-4" />
                <span>+{Math.abs(currentRec.savingsVsBaseline)}% Frontier Premium</span>
              </div>
              <span className="text-[11px] text-zinc-400 mt-0.5">
                +${formatCurrency(Math.abs(costDelta))} vs baseline
              </span>
            </>
          ) : (
            <div className="text-zinc-400 font-semibold text-xs">
              0% Cost Parity vs Baseline
            </div>
          )}
        </div>

        {/* Blended Cost */}
        <div className="text-left sm:text-right">
          <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-400 block mb-1">
            {t.simulator.router.blendedCost}
          </span>
          <div className="text-lg font-extrabold text-indigo-300 font-mono">
            {formatCurrency(currentRec.blendedMonthlyCost)}
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">
            ${((currentRec.blendedMonthlyCost / 100000) * 1000).toFixed(2)} {t.common.per1kRequests}
          </span>
        </div>
      </div>

      {/* Routing Stages Flow */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs font-medium text-zinc-400">
          <span>{t.simulator.router.trafficSplit}</span>
          <span>{currentRec.stages.length} Model Pipeline</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {currentRec.stages.map((stage, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/40 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-indigo-400">
                  {stage.stageName}
                </span>
                <span className="font-mono text-xs font-bold text-zinc-200">
                  {stage.trafficSharePercent}%
                </span>
              </div>
              <div className="text-xs font-semibold text-zinc-100 truncate">
                {stage.model.modelName}
              </div>
              <p className="text-[11px] text-zinc-400 line-clamp-2">
                {stage.purpose}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Action CTA Footer */}
      <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-zinc-400 text-center sm:text-left">
          {currentRec.tagline}
        </p>

        <button
          onClick={() => onOpenExporter(currentRec)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 shrink-0"
        >
          <Code2 className="h-4 w-4" />
          <span>{t.simulator.router.exportConfig}</span>
        </button>
      </div>
    </div>
  );
}
