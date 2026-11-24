'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ModelPricingRule } from '@/types/pricing';
import { calculateModelCost } from '@/lib/calculator-engine';
import { HARNESS_TOOLS, estimateHarnessTaskCost } from '@/lib/harness-data';
import { trackEvent } from '@/lib/analytics';
import { formatCurrency } from '@/lib/utils';
import { Sparkles, SlidersHorizontal, Calculator, Terminal, ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';

interface CompareDetailClientProps {
  modelA: ModelPricingRule;
  modelB: ModelPricingRule;
}

const HARNESS_SIMULATOR_MODES = [
  { id: 'raw', label: 'Raw API', multiplier: 1.0, badge: null, slug: null },
  { id: 'aider', label: 'Aider · Repo-Map', multiplier: 1.5, badge: 'Best', slug: 'aider' },
  { id: 'claude-code', label: 'Claude Code · CLI', multiplier: 2.1, badge: null, slug: 'claude-code' },
  { id: 'cursor', label: 'Cursor · Composer', multiplier: 2.8, badge: null, slug: 'cursor' },
] as const;

export default function CompareDetailClient({
  modelA,
  modelB,
}: CompareDetailClientProps) {
  const { t, getLocalizedPath } = useI18n();

  // Interactive slider state for dynamic comparison
  const [requests, setRequests] = useState(100000);
  const [inputTokens, setInputTokens] = useState(4000);
  const [outputTokens, setOutputTokens] = useState(1000);
  const [cacheHitRate, setCacheHitRate] = useState(0.70);
  const [batchRate, setBatchRate] = useState(0.0);
  const [selectedHarnessId, setSelectedHarnessId] = useState<string>('raw');

  const costA = calculateModelCost(modelA, {
    monthlyRequests: requests,
    inputTokens,
    outputTokens,
    cacheHitRate,
    batchRate,
    enableLongContext: false,
  });

  const costB = calculateModelCost(modelB, {
    monthlyRequests: requests,
    inputTokens,
    outputTokens,
    cacheHitRate,
    batchRate,
    enableLongContext: false,
  });

  const cheaperModel = costA.monthlyNetCost <= costB.monthlyNetCost ? modelA : modelB;
  const moreExpensiveCost = Math.max(costA.monthlyNetCost, costB.monthlyNetCost);
  const cheaperCost = Math.min(costA.monthlyNetCost, costB.monthlyNetCost);
  const savingsAmount = moreExpensiveCost - cheaperCost;
  const savingsRatio = moreExpensiveCost > 0
    ? Math.round((savingsAmount / moreExpensiveCost) * 100)
    : 0;

  const cheaperHeadline = `${cheaperModel.modelName} ${t.compare.cheaperBy.replace('{percent}', String(savingsRatio))}`;
  const savingsDescription = t.compare.savesPerMonth
    .replace('{model}', cheaperModel.modelName)
    .replace('{amount}', formatCurrency(savingsAmount));

  const activeHarness =
    HARNESS_SIMULATOR_MODES.find((m) => m.id === selectedHarnessId) || HARNESS_SIMULATOR_MODES[0];
  const taskCostA = estimateHarnessTaskCost(modelA, activeHarness.multiplier);
  const taskCostB = estimateHarnessTaskCost(modelB, activeHarness.multiplier);
  const maxTaskCost = Math.max(taskCostA.totalCost, taskCostB.totalCost);
  const minTaskCost = Math.min(taskCostA.totalCost, taskCostB.totalCost);
  const taskSavingsPct =
    maxTaskCost > 0 ? Math.round(((maxTaskCost - minTaskCost) / maxTaskCost) * 100) : 0;
  const aWinsTask = taskCostA.totalCost <= taskCostB.totalCost;

  const handleSelectHarness = (mode: (typeof HARNESS_SIMULATOR_MODES)[number]) => {
    setSelectedHarnessId(mode.id);
    trackEvent('harness_overhead_simulate', {
      harness_slug: mode.id,
      model_a: modelA.modelId,
      model_b: modelB.modelId,
      multiplier: mode.multiplier,
    });
  };

  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-md shadow-sm dark:shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-200/80 dark:border-zinc-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>{t.compare.interactiveEngine}</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {modelA.modelName} {t.common.vs} {modelB.modelName}
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            {t.compare.scenariosDesc}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800">
          <Calculator className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Live 50ms Engine</span>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">{t.simulator.controls.monthlyRequests}</span>
            <span className="font-mono text-zinc-900 dark:text-zinc-200">{requests.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={10000}
            max={2000000}
            step={10000}
            value={requests}
            onChange={(e) => setRequests(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">{t.simulator.controls.inputTokens}</span>
            <span className="font-mono text-zinc-900 dark:text-zinc-200">{inputTokens.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={500}
            max={64000}
            step={500}
            value={inputTokens}
            onChange={(e) => setInputTokens(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">{t.simulator.controls.outputTokens}</span>
            <span className="font-mono text-zinc-900 dark:text-zinc-200">{outputTokens.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={100}
            max={8192}
            step={100}
            value={outputTokens}
            onChange={(e) => setOutputTokens(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">{t.simulator.controls.cacheHitRate}</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{Math.round(cacheHitRate * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={cacheHitRate}
            onChange={(e) => setCacheHitRate(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">{t.simulator.controls.batchOffload}</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{Math.round(batchRate * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={batchRate}
            onChange={(e) => setBatchRate(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>
      </div>

      {/* Real-time Calculation Result Banner */}
      <div className="rounded-xl border border-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-950/20 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {cheaperHeadline}
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {savingsDescription}
          </p>
        </div>

        <div className="flex items-center gap-6 font-mono text-center">
          <div className="p-2.5 rounded-lg bg-white/90 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800">
            <span className="text-[10px] uppercase text-zinc-500 dark:text-zinc-400 block font-sans font-medium">{modelA.modelName}</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(costA.monthlyNetCost)}</span>
            <span className="text-[10px] text-zinc-500 block font-sans">{formatCurrency(costA.singleRequestCost * 1000)}/{t.common.per1kRequests}</span>
          </div>
          <span className="text-zinc-500 font-sans text-sm font-semibold">{t.common.vs}</span>
          <div className="p-2.5 rounded-lg bg-white/90 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800">
            <span className="text-[10px] uppercase text-zinc-500 dark:text-zinc-400 block font-sans font-medium">{modelB.modelName}</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(costB.monthlyNetCost)}</span>
            <span className="text-[10px] text-zinc-500 block font-sans">{formatCurrency(costB.singleRequestCost * 1000)}/{t.common.per1kRequests}</span>
          </div>
        </div>
      </div>

      {/* Coding Agent Overhead Simulator Extension */}
      <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/70 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Coding Agent Overhead Simulator
            </h3>
          </div>
          <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            15-turn refactor · 5 tool calls · 30k context · 70% cache hit
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
          {HARNESS_SIMULATOR_MODES.map((mode) => {
            const active = activeHarness.id === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleSelectHarness(mode)}
                className={`shrink-0 min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all active:scale-[0.98] ${
                  active
                    ? 'border-indigo-500/70 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.18)]'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <span>{mode.label}</span>
                <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                  {mode.multiplier.toFixed(1)}x
                </span>
                {mode.badge && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                    {mode.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            className={`rounded-xl border p-4 space-y-2 ${
              aWinsTask
                ? 'border-emerald-500/40 bg-emerald-500/[0.06] dark:bg-emerald-500/[0.04]'
                : 'border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/50'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                {modelA.modelName}
              </span>
              {aWinsTask && taskSavingsPct > 0 && (
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  Cheaper by {taskSavingsPct}%
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                34.5k → {(taskCostA.totalTokens / 1000).toFixed(1)}k tok
              </span>
              <span className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {formatCurrency(taskCostA.totalCost)}
              </span>
            </div>
          </div>

          <div
            className={`rounded-xl border p-4 space-y-2 ${
              !aWinsTask
                ? 'border-emerald-500/40 bg-emerald-500/[0.06] dark:bg-emerald-500/[0.04]'
                : 'border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/50'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                {modelB.modelName}
              </span>
              {!aWinsTask && taskSavingsPct > 0 && (
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  Cheaper by {taskSavingsPct}%
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                34.5k → {(taskCostB.totalTokens / 1000).toFixed(1)}k tok
              </span>
              <span className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {formatCurrency(taskCostB.totalCost)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
          <span>
            Active multiplier: <strong className="text-zinc-800 dark:text-zinc-300 font-mono">{activeHarness.multiplier.toFixed(1)}x</strong>
          </span>
          <Link
            href={getLocalizedPath(activeHarness.slug ? `/harness/${activeHarness.slug}/` : '/harness/')}
            className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium transition-colors"
          >
            <span>{activeHarness.slug ? 'Full Harness Audit' : `Compare All ${HARNESS_TOOLS.length} Harnesses`}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
