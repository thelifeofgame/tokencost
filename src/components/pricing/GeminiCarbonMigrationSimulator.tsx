'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Calculator,
  HelpCircle,
  Scale,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { MODELS_DATA, compareHref } from '@/lib/models-data';
import { trackEvent } from '@/lib/analytics';
import { TopicFaqItem } from '@/lib/pricing-topics-seo';

interface GeminiCarbonMigrationSimulatorProps {
  faqs: TopicFaqItem[];
}

interface TargetCandidate {
  id: string;
  name: string;
  provider: string;
  inputPerM: number;
  outputPerM: number;
  cachedInputPerM: number;
  contextLabel: string;
  badge: string;
  note: string;
  targetPath: string;
}

interface CandidatePreset {
  id: string;
  name: string;
  provider: string;
  fallbackInputPerM: number;
  fallbackOutputPerM: number;
  fallbackCachedPerM: number;
  contextLabel: string;
  badge: string;
  note: string;
  targetPath: string;
}

const TARGET_PRESETS: CandidatePreset[] = [
  {
    id: 'claude-sonnet-5.5',
    name: 'Claude Sonnet 5.5',
    provider: 'Anthropic',
    fallbackInputPerM: 2.0,
    fallbackOutputPerM: 10.0,
    fallbackCachedPerM: 0.1,
    contextLabel: '1M ctx · 95% Cache',
    badge: 'Zero Price Jump ($2/$10)',
    note: 'Direct $2/$10 drop-in parity with 95% cache reads and predictable long-term enterprise rate cards.',
    targetPath: '/compare/gemini-4-carbon-vs-claude-sonnet-5.5/',
  },
  {
    id: 'gpt-6.2-sol',
    name: 'GPT-6.2 Sol',
    provider: 'OpenAI',
    fallbackInputPerM: 2.0,
    fallbackOutputPerM: 10.0,
    fallbackCachedPerM: 0.1,
    contextLabel: '1.05M ctx · AA 57.3',
    badge: '1.05M Reasoning Parity',
    note: 'Matches pre-hike $2/$10 rates while absorbing retired Azure o3/o4-mini reasoning traffic.',
    targetPath: compareHref('gpt-6.2-sol', 'gemini-4-carbon'),
  },
  {
    id: 'gemini-4-neon',
    name: 'Gemini 4 Neon',
    provider: 'Google',
    fallbackInputPerM: 3.0,
    fallbackOutputPerM: 15.0,
    fallbackCachedPerM: 0.15,
    contextLabel: '1M ctx · 145 t/s · AA 61.4',
    badge: 'In-SDK Upgrade (-25% vs Hike)',
    note: 'Keep Google Gemini SDK compatibility at $3/$15—25% cheaper than Dec 1 Carbon ($4/$20) with higher coding score.',
    targetPath: '/compare/gemini-4-neon-vs-gpt-6.2-sol/',
  },
  {
    id: 'deepseek-v4.1-flash',
    name: 'DeepSeek-V4.1-Flash',
    provider: 'OpenRouter / DeepSeek',
    fallbackInputPerM: 0.0498,
    fallbackOutputPerM: 0.1992,
    fallbackCachedPerM: 0.001,
    contextLabel: '1M ctx · 145 t/s · 98% Cache',
    badge: '-98%+ Cost Killer',
    note: '',
    targetPath: '/calculator/deepseek-v4.1-flash/',
  },
];

const INPUT_PRESETS = [
  { label: '50M', value: 50 },
  { label: '250M', value: 250 },
  { label: '1,000M', value: 1000 },
];

const OUTPUT_PRESETS = [
  { label: '10M', value: 10 },
  { label: '50M', value: 50 },
  { label: '200M', value: 200 },
];

function formatTokenRate(val: number): string {
  if (val === 0) return '$0.00';
  if (val < 0.1) {
    return `$${Number(val.toFixed(4))}`;
  }
  if (Math.round(val * 100) === val * 100) {
    return `$${val.toFixed(2)}`;
  }
  return `$${Number(val.toFixed(4))}`;
}

function calcMonthlyCost(
  inputM: number,
  outputM: number,
  cacheHitRatio: number,
  inputPerM: number,
  outputPerM: number,
  cachedInputPerM: number
): number {
  const inputCost =
    inputM * ((1 - cacheHitRatio) * inputPerM + cacheHitRatio * cachedInputPerM);
  const outputCost = outputM * outputPerM;
  return inputCost + outputCost;
}

export default function GeminiCarbonMigrationSimulator({
  faqs,
}: GeminiCarbonMigrationSimulatorProps) {
  const { getLocalizedPath, locale } = useI18n();

  const [inputM, setInputM] = useState<number>(250);
  const [outputM, setOutputM] = useState<number>(50);
  const [cacheHitPercent, setCacheHitPercent] = useState<number>(65);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('claude-sonnet-5.5');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackDebounced = useCallback(
    (controlName: string, value: string | number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        trackEvent('pricing_simulator_interact', {
          topic: 'gemini-4-carbon-dec-1-migration-guide',
          control_name: controlName,
          value,
          locale,
        });
      }, 300);
    },
    [locale]
  );

  const { carbonModel, targetCandidates } = useMemo(() => {
    const modelMap = new Map(MODELS_DATA.map((m) => [m.modelId, m]));
    const carbon = modelMap.get('gemini-4-carbon');
    const resolved: TargetCandidate[] = TARGET_PRESETS.map((preset) => {
      const live = modelMap.get(preset.id);
      const inputPerM = live?.inputPerM ?? preset.fallbackInputPerM;
      const outputPerM = live?.outputPerM ?? preset.fallbackOutputPerM;
      const cachedInputPerM = live?.cachedInputPerM ?? preset.fallbackCachedPerM;
      const note =
        preset.id === 'deepseek-v4.1-flash'
          ? `Live OpenRouter routing floor (-83% to ${formatTokenRate(inputPerM)}/${formatTokenRate(outputPerM)}, ${formatTokenRate(cachedInputPerM)}/M cached) for high-volume extraction, classification, and non-frontier subtasks.`
          : preset.note;

      return {
        id: preset.id,
        name: preset.name,
        provider: preset.provider,
        inputPerM,
        outputPerM,
        cachedInputPerM,
        contextLabel: preset.contextLabel,
        badge: preset.badge,
        note,
        targetPath: preset.targetPath,
      };
    });
    return { carbonModel: carbon, targetCandidates: resolved };
  }, []);

  const { daysLeft, isHikeActive, countdownBadgeText } = useMemo(() => {
    const now = new Date();
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const cutoffUtc = Date.UTC(2026, 10, 30); // Nov 30, 2026
    const hikeUtc = Date.UTC(2026, 11, 1); // 2026-12-01T00:00:00Z
    const remaining = Math.max(0, Math.round((cutoffUtc - todayUtc) / 86400000));
    const active = todayUtc >= hikeUtc;
    const badgeText = active
      ? 'DEC 1 HIKE ACTIVE · $4/$20 RATES IN EFFECT'
      : remaining > 1
      ? `${remaining} DAYS REMAINING · CUTOFF NOV 30, 2026`
      : remaining === 1
      ? '1 DAY REMAINING · CUTOFF NOV 30, 2026'
      : 'FINAL DAY · CUTOFF TONIGHT NOV 30, 2026';

    return {
      daysLeft: remaining,
      isHikeActive: active,
      countdownBadgeText: badgeText,
    };
  }, []);

  const cacheHitRatio = Math.min(0.95, Math.max(0, cacheHitPercent / 100));

  // Baseline: Gemini 4 Carbon Pre-Nov 30 ($2.00 / $10.00, cached $0.10) read dynamically from MODELS_DATA
  const preInput = carbonModel?.inputPerM ?? 2.0;
  const preOutput = carbonModel?.outputPerM ?? 10.0;
  const preCached = carbonModel?.cachedInputPerM ?? 0.1;

  const preHikeCost = calcMonthlyCost(inputM, outputM, cacheHitRatio, preInput, preOutput, preCached);
  // Post-Dec 1 Hike (+100%): Gemini 4 Carbon ($4.00 / $20.00, cached $0.20)
  const postInput = preInput * 2;
  const postOutput = preOutput * 2;
  const postCached = preCached * 2;
  const postHikeCost = calcMonthlyCost(inputM, outputM, cacheHitRatio, postInput, postOutput, postCached);
  const monthlyHikeSurge = postHikeCost - preHikeCost;

  const targetModel =
    targetCandidates.find((c) => c.id === selectedTargetId) || targetCandidates[0];
  const targetCost = calcMonthlyCost(
    inputM,
    outputM,
    cacheHitRatio,
    targetModel.inputPerM,
    targetModel.outputPerM,
    targetModel.cachedInputPerM
  );
  const targetSavingsVsHike = postHikeCost - targetCost;
  const targetSavingsPct = postHikeCost > 0 ? (targetSavingsVsHike / postHikeCost) * 100 : 0;

  const formatUsd = (val: number) =>
    val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const scrollToSimulator = () => {
    const el = document.getElementById('migration-simulator');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Module 1: Countdown Alert Banner */}
      <div className="rounded-2xl border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/35 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
          <div className="space-y-1.5">
            <span
              data-days-left={daysLeft}
              data-hike-active={isHikeActive}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-mono tabular-nums font-bold bg-rose-500/15 border border-rose-500/35 text-rose-800 dark:text-rose-200"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>{countdownBadgeText}</span>
            </span>
            <p className="text-xs sm:text-sm font-medium text-rose-950 dark:text-rose-100 leading-snug">
              Gemini 4 Carbon &amp; Argon promotional {formatTokenRate(preInput)}/{formatTokenRate(preOutput)} rates expire Nov 30 and double +100% to {formatTokenRate(postInput)}/{formatTokenRate(postOutput)} on Dec 1 (while Azure o3/o4-mini endpoints are already retired). Lock alternative routing before your next billing cycle.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={scrollToSimulator}
          className="min-h-[42px] shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-500/20 transition-all active:scale-[0.98]"
        >
          <span>Run Migration Simulator</span>
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Module 2: Monthly Token & Prompt Cache Migration Simulator */}
      <section
        id="migration-simulator"
        className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-5 sm:p-6 backdrop-blur-md shadow-xl space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Dec 1 Price Surge &amp; Prompt Cache Migration Simulator
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Model your real monthly input/output volume and cache hit leverage before promotional $2/$10 pricing ends.
            </p>
          </div>
          <span className="self-start sm:self-auto rounded-full px-2.5 py-0.5 text-[11px] font-mono font-semibold bg-indigo-500/10 border border-indigo-500/25 text-indigo-700 dark:text-indigo-300">
            Live Unit Economics
          </span>
        </div>

        {/* 3 Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-950/60">
          {/* Control 1: Input M */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="carbon-input-m" className="font-medium text-zinc-700 dark:text-zinc-300">
                Monthly Input Tokens (M)
              </label>
              <span className="font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                {inputM.toLocaleString('en-US')}M
              </span>
            </div>
            <input
              id="carbon-input-m"
              type="range"
              min={10}
              max={1000}
              step={10}
              value={inputM}
              onChange={(e) => {
                const next = Number(e.target.value);
                setInputM(next);
                trackDebounced('input_tokens_m', next);
              }}
              className="w-full"
            />
            <div className="flex flex-wrap gap-1.5">
              {INPUT_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setInputM(p.value);
                    trackDebounced('input_tokens_m', p.value);
                  }}
                  className={`min-h-[30px] px-2 py-0.5 rounded-md text-[11px] font-mono border transition-colors ${
                    inputM === p.value
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Control 2: Output M */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="carbon-output-m" className="font-medium text-zinc-700 dark:text-zinc-300">
                Monthly Output Tokens (M)
              </label>
              <span className="font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                {outputM.toLocaleString('en-US')}M
              </span>
            </div>
            <input
              id="carbon-output-m"
              type="range"
              min={5}
              max={500}
              step={5}
              value={outputM}
              onChange={(e) => {
                const next = Number(e.target.value);
                setOutputM(next);
                trackDebounced('output_tokens_m', next);
              }}
              className="w-full"
            />
            <div className="flex flex-wrap gap-1.5">
              {OUTPUT_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setOutputM(p.value);
                    trackDebounced('output_tokens_m', p.value);
                  }}
                  className={`min-h-[30px] px-2 py-0.5 rounded-md text-[11px] font-mono border transition-colors ${
                    outputM === p.value
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Control 3: Prompt Cache Hit Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="carbon-cache-hit" className="font-medium text-zinc-700 dark:text-zinc-300">
                Prompt Cache Hit Rate (%)
              </label>
              <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                {cacheHitPercent}%
              </span>
            </div>
            <input
              id="carbon-cache-hit"
              type="range"
              min={0}
              max={95}
              step={5}
              value={cacheHitPercent}
              onChange={(e) => {
                const next = Number(e.target.value);
                setCacheHitPercent(next);
                trackDebounced('cache_hit_rate', next);
              }}
              className="w-full"
            />
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Cache read cuts input rate by 95% on Sonnet 5.5 &amp; GPT-6.2 Sol ($0.10/M) and 98% on DeepSeek-V4.1-Flash ($0.001/M).
            </p>
          </div>
        </div>

        {/* Target Model Switcher */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
            Select Migration Target Model:
          </span>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {targetCandidates.map((cand) => (
              <button
                key={cand.id}
                type="button"
                onClick={() => {
                  setSelectedTargetId(cand.id);
                  trackDebounced('target_model', cand.id);
                }}
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-left transition-all ${
                  selectedTargetId === cand.id
                    ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <span className="text-xs font-bold block truncate">{cand.name}</span>
                <span className="text-[10px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                  {formatTokenRate(cand.inputPerM)} / {formatTokenRate(cand.outputPerM)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 3-Stage Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Baseline Pre-Nov 30 */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/70 p-4 space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500">
                Baseline · Pre-Nov 30
              </span>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Gemini 4 Carbon (Current Intro)
              </h3>
              <p className="text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                {formatTokenRate(preInput)} / {formatTokenRate(preOutput)} (Cached {formatTokenRate(preCached)}/M)
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-2xl font-mono tabular-nums font-bold text-zinc-900 dark:text-zinc-100">
                ${formatUsd(preHikeCost)}
              </span>
              <span className="text-xs text-zinc-500"> / mo</span>
            </div>
          </div>

          {/* Card 2: Shock Post-Dec 1 */}
          <div className="rounded-2xl border border-rose-400/60 dark:border-rose-500/50 bg-rose-50/90 dark:bg-rose-950/30 p-4 space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                  Shock · Post-Dec 1
                </span>
                <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-mono tabular-nums font-bold text-rose-700 dark:text-rose-300">
                  +100% Bill Surge
                </span>
              </div>
              <h3 className="text-sm font-bold text-rose-950 dark:text-rose-100">
                Gemini 4 Carbon (Dec 1 Hike)
              </h3>
              <p className="text-xs font-mono tabular-nums text-rose-800/80 dark:text-rose-300/80">
                {formatTokenRate(postInput)} / {formatTokenRate(postOutput)} (Cached {formatTokenRate(postCached)}/M)
              </p>
            </div>
            <div className="pt-2 border-t border-rose-200 dark:border-rose-500/30 flex items-baseline justify-between gap-2 flex-wrap">
              <div>
                <span className="text-2xl font-mono tabular-nums font-bold text-rose-700 dark:text-rose-300">
                  ${formatUsd(postHikeCost)}
                </span>
                <span className="text-xs text-rose-700/80 dark:text-rose-300/80"> / mo</span>
              </div>
              <span className="text-xs font-mono tabular-nums font-bold text-rose-700 dark:text-rose-400">
                +${formatUsd(monthlyHikeSurge)}/mo
              </span>
            </div>
          </div>

          {/* Card 3: Recommended Target */}
          <div className="rounded-2xl border border-emerald-400/60 dark:border-emerald-500/50 bg-emerald-50/90 dark:bg-emerald-950/30 p-4 space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Recommended Target
                </span>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-300">
                  Save {targetSavingsPct.toFixed(1)}%
                </span>
              </div>
              <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                {targetModel.name}
              </h3>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono tabular-nums leading-5">
                <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                  {formatTokenRate(targetModel.inputPerM)} in / {formatTokenRate(targetModel.outputPerM)} out
                </span>
                <span className="text-emerald-600/40 dark:text-emerald-400/40">·</span>
                <span className="rounded bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                  Cache {formatTokenRate(targetModel.cachedInputPerM)}/M
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-emerald-200 dark:border-emerald-500/30 flex items-baseline justify-between gap-2 flex-wrap">
              <div>
                <span className="text-2xl font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-300">
                  ${formatUsd(targetCost)}
                </span>
                <span className="text-xs text-emerald-700/80 dark:text-emerald-300/80"> / mo</span>
              </div>
              <span className="text-xs font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                -${formatUsd(targetSavingsVsHike)}/mo vs Dec 1
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Module 3: 2x2 Migration Matrix Cards + Azure o3 / Calculator Funnel Links */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Drop-In Replacement Matrix: Carbon ($4/$20 Post-Dec 1) &amp; Azure o3 Alternatives
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Click any replacement path to inspect side-by-side Prompt Caching ROI or export LiteLLM / OpenRouter routing configs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {targetCandidates.map((cand) => {
            const candCost = calcMonthlyCost(
              inputM,
              outputM,
              cacheHitRatio,
              cand.inputPerM,
              cand.outputPerM,
              cand.cachedInputPerM
            );
            const savePct = postHikeCost > 0 ? Math.round(((postHikeCost - candCost) / postHikeCost) * 100) : 0;

            return (
              <div
                key={cand.id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-5 backdrop-blur-md shadow-lg flex flex-col justify-between gap-4 hover:border-indigo-500/40 transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300">
                      <Sparkles className="h-3 w-3" />
                      {cand.badge}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                      {cand.contextLabel}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                      {cand.name}{' '}
                      <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                        ({cand.provider})
                      </span>
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono tabular-nums leading-5">
                      <span className="text-indigo-700 dark:text-indigo-300 font-semibold">
                        {formatTokenRate(cand.inputPerM)} in / {formatTokenRate(cand.outputPerM)} out
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-700">·</span>
                      <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                        Cache {formatTokenRate(cand.cachedInputPerM)}/M
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {cand.note}
                  </p>
                </div>

                <div className="mt-auto pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                    Saves {savePct}% vs Dec 1 Carbon
                  </span>
                  <Link
                    href={getLocalizedPath(cand.targetPath)}
                    onClick={() =>
                      trackEvent('pricing_migration_compare_click', {
                        source_model: 'gemini-4-carbon',
                        target_model: cand.id,
                        target_path: cand.targetPath,
                        estimated_savings_pct: savePct,
                        locale,
                      })
                    }
                    className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                  >
                    <span>
                      {cand.targetPath.startsWith('/calculator')
                        ? 'Calculate ROI'
                        : 'Compare Side-by-Side'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dedicated Azure o3/o4-mini Retirement & Sonnet 5.5 Cache ROI Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href={getLocalizedPath('/compare/deepseek-r1-vs-o3-mini/')}
            onClick={() =>
              trackEvent('pricing_migration_compare_click', {
                source_model: 'o3-mini',
                target_model: 'deepseek-r1',
                target_path: '/compare/deepseek-r1-vs-o3-mini/',
                estimated_savings_pct: 50.1,
                locale,
              })
            }
            className="group rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] dark:bg-amber-950/20 p-4 hover:border-amber-500/60 transition-all flex items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300">
                <Scale className="h-3 w-3" />
                AZURE O3 / O4-MINI RETIREMENT
              </span>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-300">
                DeepSeek-R1 vs Retired o3-mini (-50.1%)
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                $0.55/$2.19 vs $1.10/$4.40 per 1M reasoning tokens
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href={getLocalizedPath('/calculator/claude-sonnet-5.5/')}
            onClick={() =>
              trackEvent('pricing_migration_compare_click', {
                source_model: 'gemini-4-carbon',
                target_model: 'claude-sonnet-5.5',
                target_path: '/calculator/claude-sonnet-5.5/',
                estimated_savings_pct: 50,
                locale,
              })
            }
            className="group rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] dark:bg-emerald-950/20 p-4 hover:border-emerald-500/60 transition-all flex items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                <Calculator className="h-3 w-3" />
                PROMPT CACHE BREAK-EVEN
              </span>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
                Simulate 95% Cache ROI on Sonnet 5.5
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Test write surcharge amortization &amp; $0.10/M cached reads
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Module 4: LiteLLM Zero-Downtime Cutover Playbook Snippet */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-5 sm:p-6 backdrop-blur-md shadow-xl space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Zero-Downtime LiteLLM / OpenRouter Cutover Config
            </h2>
          </div>
          <Link
            href={getLocalizedPath('/developers/')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Full SDK Guide →</span>
          </Link>
        </div>
        <pre className="p-4 rounded-xl bg-zinc-950 text-zinc-200 font-mono text-xs overflow-x-auto leading-relaxed border border-zinc-800">
          <code>{`model_list:
  - model_name: prod-flagship-alias # Migrate off gemini-4-carbon before 2026-12-01
    litellm_params:
      model: openrouter/anthropic/claude-sonnet-5.5 # $2/$10, $0.10/M cached
      api_base: https://openrouter.ai/api/v1
      api_key: os.environ/OPENROUTER_API_KEY
  - model_name: prod-flagship-alias
    litellm_params:
      model: openrouter/openai/gpt-6.2-sol # $2/$10, 1.05M ctx fallback + Azure o3 replacement
      api_base: https://openrouter.ai/api/v1
      api_key: os.environ/OPENROUTER_API_KEY`}</code>
        </pre>
      </section>

      {/* Module 5: FAQ Accordion matching FAQPage Schema */}
      {faqs.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-6 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 p-4 space-y-1.5"
              >
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-mono">
                    {idx + 1}
                  </span>
                  <span>{faq.question}</span>
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pl-7">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
