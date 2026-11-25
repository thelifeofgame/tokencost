'use client';

import React, { useMemo, useState } from 'react';
import { ModelPricingRule } from '@/types/pricing';
import { calculateModelCost } from '@/lib/calculator-engine';
import { MODELS_DATA, compareHref } from '@/lib/models-data';
import { formatCurrency, formatPerMillionPrice } from '@/lib/utils';
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ExternalLink,
  Layers,
  Scale,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/i18n/I18nProvider';
import { trackEvent, trackEventThrottled } from '@/lib/analytics';
import TrackedAffiliateLink from '@/components/TrackedAffiliateLink';

interface ModelCachingCalculatorClientProps {
  model: ModelPricingRule;
}

function formatCompactContext(tokens: number): string {
  if (tokens >= 1_000_000) {
    const m = tokens / 1_000_000;
    return `${Number(m.toFixed(1))}M`;
  }
  return `${Math.round(tokens / 1000)}K`;
}

export default function ModelCachingCalculatorClient({
  model,
}: ModelCachingCalculatorClientProps) {
  const { locale, t, getLocalizedPath } = useI18n();
  const [requests, setRequests] = useState(100000);
  const [inputTokens, setInputTokens] = useState(8000);
  const [outputTokens, setOutputTokens] = useState(800);
  const [cacheHitRate, setCacheHitRate] = useState(0.75);
  const [batchRate, setBatchRate] = useState(0);
  const [enableLongContext, setEnableLongContext] = useState(false);
  const [cacheLifetime, setCacheLifetime] = useState(5);

  // Batch gating: free $0/$0 models never show Batch slider even if metadata has 50%
  const supportsBatch =
    model.batchDiscountPercent > 0 && (model.inputPerM > 0 || model.outputPerM > 0);
  const effectiveBatchRate = supportsBatch ? batchRate : 0;
  const batchPctDisplay = Number(model.batchDiscountPercent.toFixed(1));

  // Long-Context tier gating
  const hasExplicitTier = Boolean(model.tierThreshold && model.tierInputPerM);
  const thresholdValue = model.tierThreshold ?? 128000;
  const thresholdLabel = `${Math.round(thresholdValue / 1000)}K`;
  const isAutoTriggered = Boolean(hasExplicitTier && inputTokens > thresholdValue);
  const isLongContextActive = hasExplicitTier ? enableLongContext || isAutoTriggered : false;
  const showLongContextFallbackAlert =
    !hasExplicitTier && model.contextWindow >= 256000 && inputTokens > 128000;

  const maxInputTokens = Math.max(100000, Math.min(model.contextWindow || 100000, 256000));

  const cost = calculateModelCost(model, {
    monthlyRequests: requests,
    inputTokens,
    outputTokens,
    cacheHitRate,
    batchRate: effectiveBatchRate,
    enableLongContext: isLongContextActive,
    cacheLifetimeMultiplier: cacheLifetime,
  });

  const isAnthropic = model.providerOrg === 'Anthropic';
  const isGroq = model.providerOrg === 'Groq';

  const tierMultiplierLabel = useMemo(() => {
    if (!hasExplicitTier || !model.tierInputPerM || model.inputPerM <= 0) return null;
    const mult = model.tierInputPerM / model.inputPerM;
    return `${Number(mult.toFixed(1))}x`;
  }, [hasExplicitTier, model.tierInputPerM, model.inputPerM]);

  // Cheaper alternative finder for bottom Savings Comparison & Routing Card
  const cheaperAlternative = useMemo(() => {
    if (cost.monthlyNetCost <= 0) return null;

    const evalCandidate = (cand: ModelPricingRule) => {
      const candSupportsBatch =
        cand.batchDiscountPercent > 0 && (cand.inputPerM > 0 || cand.outputPerM > 0);
      const candCost = calculateModelCost(cand, {
        monthlyRequests: requests,
        inputTokens,
        outputTokens,
        cacheHitRate,
        batchRate: candSupportsBatch ? effectiveBatchRate : 0,
        enableLongContext: Boolean(cand.tierThreshold && inputTokens > cand.tierThreshold),
        cacheLifetimeMultiplier: cacheLifetime,
      });
      const savingsUsd = cost.monthlyNetCost - candCost.monthlyNetCost;
      const savingsPct =
        cost.monthlyNetCost > 0 ? Math.round((savingsUsd / cost.monthlyNetCost) * 100) : 0;
      const rawComparePath = compareHref(model.modelId, cand.modelId);
      return {
        model: cand,
        monthlyNetCost: candCost.monthlyNetCost,
        savingsUsd,
        savingsPct,
        rawComparePath,
        hasStaticCompare:
          rawComparePath.startsWith('/compare/') && !rawComparePath.includes('/compare/view/'),
      };
    };

    const eligible = MODELS_DATA.filter(
      (cand) =>
        cand.modelId !== model.modelId &&
        cand.inputPerM > 0 &&
        cand.outputPerM > 0 &&
        !cand.modelId.includes(':free') &&
        cand.contextWindow >= inputTokens
    );

    const staticCandidates = eligible
      .map(evalCandidate)
      .filter(
        (item) =>
          item.hasStaticCompare &&
          item.monthlyNetCost < cost.monthlyNetCost * 0.92 &&
          item.savingsUsd > 0.01
      );

    if (staticCandidates.length === 0) return null;

    const sameTier = staticCandidates.filter(
      (item) => Boolean(item.model.isFrontier) === Boolean(model.isFrontier)
    );
    const pool = sameTier.length > 0 ? sameTier : staticCandidates;

    pool.sort((a, b) => {
      if (Math.abs(b.savingsUsd - a.savingsUsd) > 1) {
        return b.savingsUsd - a.savingsUsd;
      }
      const aScore = a.model.benchmarks?.intelligenceIndex ?? 0;
      const bScore = b.model.benchmarks?.intelligenceIndex ?? 0;
      return bScore - aScore;
    });

    return pool[0];
  }, [
    model.modelId,
    model.isFrontier,
    cost.monthlyNetCost,
    requests,
    inputTokens,
    outputTokens,
    cacheHitRate,
    effectiveBatchRate,
    cacheLifetime,
  ]);

  const compareTargetId = cheaperAlternative
    ? cheaperAlternative.model.modelId
    : model.modelId === 'solar-mini-4-5'
    ? 'deepseek-v4.1-flash'
    : null;

  const secondaryCompareHref = compareTargetId
    ? getLocalizedPath(compareHref(compareTargetId, model.modelId))
    : getLocalizedPath('/compare/');

  const openRouterFallbackUrl =
    model.affiliateUrl ||
    `https://openrouter.ai/${model.modelId}?ref=tokencostsai_com&utm_source=tokencostsai_com&utm_medium=model_affiliate`;

  const buildInteractPayload = (
    controlName: string,
    overrides: {
      requests?: number;
      inputTokens?: number;
      outputTokens?: number;
      cacheHitRate?: number;
      batchRate?: number;
      enableLongContext?: boolean;
      cacheLifetime?: number;
    } = {}
  ) => {
    const nextReqs = overrides.requests ?? requests;
    const nextInput = overrides.inputTokens ?? inputTokens;
    const nextOutput = overrides.outputTokens ?? outputTokens;
    const nextCache = overrides.cacheHitRate ?? cacheHitRate;
    const nextBatch = supportsBatch ? (overrides.batchRate ?? batchRate) : 0;
    const nextAutoTier = Boolean(hasExplicitTier && nextInput > thresholdValue);
    const nextLong = hasExplicitTier
      ? (overrides.enableLongContext ?? enableLongContext) || nextAutoTier
      : false;
    const nextLifetime = overrides.cacheLifetime ?? cacheLifetime;

    const nextCost = calculateModelCost(model, {
      monthlyRequests: nextReqs,
      inputTokens: nextInput,
      outputTokens: nextOutput,
      cacheHitRate: nextCache,
      batchRate: nextBatch,
      enableLongContext: nextLong,
      cacheLifetimeMultiplier: nextLifetime,
    });

    return {
      source: 'model_calculator',
      control_name: controlName,
      model_id: model.modelId,
      locale,
      batch_offload_pct: Math.round(nextBatch * 100),
      long_context_enabled: nextLong,
      cache_hit_pct: Math.round(nextCache * 100),
      monthly_net_usd: Number(nextCost.monthlyNetCost.toFixed(4)),
      monthly_savings_usd: Number(nextCost.totalSavingsMonthly.toFixed(4)),
    };
  };

  const handleToggleLongContext = () => {
    if (!hasExplicitTier || isAutoTriggered) return;
    const nextVal = !enableLongContext;
    setEnableLongContext(nextVal);
    trackEvent(
      'calculator_interact',
      buildInteractPayload('long_context_switch', { enableLongContext: nextVal })
    );
  };

  return (
    <div
      data-analytics-module="calculator"
      className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-8"
    >
      {/* Back button */}
      <div>
        <Link
          href={getLocalizedPath('/calculator/')}
          className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{t.common.back}</span>
        </Link>
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-md shadow-sm dark:shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                {t.calculator.badge}
              </span>
              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                {model.providerOrg}
              </span>
              {supportsBatch ? (
                <span className="rounded-md bg-indigo-50 dark:bg-indigo-500/15 px-2 py-0.5 text-[11px] font-mono font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 whitespace-nowrap">
                  Batch -{batchPctDisplay}%
                </span>
              ) : (
                <span className="rounded-md bg-zinc-100 dark:bg-zinc-800/90 px-2 py-0.5 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 whitespace-nowrap">
                  {t.calculator.batchUnsupportedBadge}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              {model.modelName} Prompt Caching Calculator
            </h1>
          </div>

          {model.affiliateUrl && (
            <TrackedAffiliateLink
              href={model.affiliateUrl}
              modelId={model.modelId}
              pageType="calculator_detail"
              locale={locale}
              placement="calculator_header_cta"
              provider="openrouter"
              includeRef={true}
              extraParams={{
                batch_offload_pct: Math.round(effectiveBatchRate * 100),
                long_context_enabled: isLongContextActive,
                monthly_savings_usd: Number(cost.totalSavingsMonthly.toFixed(4)),
                target_model: model.modelId,
              }}
              className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm shadow-indigo-500/25 transition-all active:scale-[0.98] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
            >
              <span>{t.simulator.leaderboard.connectApi}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </TrackedAffiliateLink>
          )}
        </div>

        {/* Pricing rules highlight */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 font-mono text-xs">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-sans block">
              {t.calculator.baseInput}
            </span>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
              {formatPerMillionPrice(
                isLongContextActive && model.tierInputPerM ? model.tierInputPerM : model.inputPerM
              )}
              /M
            </span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-emerald-500/25">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-sans block">
              {t.calculator.cacheHitRead}
            </span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatPerMillionPrice(
                isLongContextActive && model.tierInputPerM
                  ? model.tierInputPerM * (1 - model.cacheDiscountPercent / 100)
                  : model.cachedInputPerM
              )}
              /M
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-sans block">
              (-{model.cacheDiscountPercent}%)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-sans block">Cache Write Surcharge</span>
            <span className="text-base font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">
              {model.cacheWritePerM
                ? `${formatPerMillionPrice(model.cacheWritePerM)}/M (+25%)`
                : 'Free (Automatic)'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-sans block">Output Rate</span>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
              {formatPerMillionPrice(
                isLongContextActive && model.tierOutputPerM ? model.tierOutputPerM : model.outputPerM
              )}
              /M
            </span>
          </div>
        </div>
      </div>

      {/* Simulator Deck */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-md shadow-sm dark:shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Simulation Parameters
          </h2>
          {!supportsBatch && (
            <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] font-mono text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
              {t.calculator.batchUnsupportedBadge}
            </span>
          )}
        </div>

        {/* 4 Core Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs gap-2">
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                {t.simulator.controls.monthlyRequests}
              </span>
              <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-200 font-semibold">
                {requests.toLocaleString()}
              </span>
            </div>
            <div className="min-h-[44px] flex items-center touch-pan-y">
              <input
                type="range"
                min={5000}
                max={1000000}
                step={5000}
                value={requests}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setRequests(val);
                  trackEventThrottled(
                    'calculator_interact',
                    buildInteractPayload('monthly_requests', { requests: val }),
                    1500
                  );
                }}
                className="w-full accent-indigo-600 dark:accent-indigo-400 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs gap-2">
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                {t.simulator.controls.inputTokens}
              </span>
              <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-200 font-semibold">
                {inputTokens.toLocaleString()}
              </span>
            </div>
            <div className="min-h-[44px] flex items-center touch-pan-y">
              <input
                type="range"
                min={1000}
                max={maxInputTokens}
                step={1000}
                value={inputTokens}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setInputTokens(val);
                  trackEventThrottled(
                    'calculator_interact',
                    buildInteractPayload('input_tokens', { inputTokens: val }),
                    1500
                  );
                }}
                className="w-full accent-indigo-600 dark:accent-indigo-400 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs gap-2">
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                {t.simulator.controls.cacheHitRate}
              </span>
              <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                {Math.round(cacheHitRate * 100)}%
              </span>
            </div>
            <div className="min-h-[44px] flex items-center touch-pan-y">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={cacheHitRate}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCacheHitRate(val);
                  trackEventThrottled(
                    'calculator_interact',
                    buildInteractPayload('cache_hit_rate', { cacheHitRate: val }),
                    1500
                  );
                }}
                className="w-full accent-emerald-600 dark:accent-emerald-400 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs gap-2">
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                {t.simulator.controls.outputTokens}
              </span>
              <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-200 font-semibold">
                {outputTokens.toLocaleString()}
              </span>
            </div>
            <div className="min-h-[44px] flex items-center touch-pan-y">
              <input
                type="range"
                min={100}
                max={4096}
                step={100}
                value={outputTokens}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setOutputTokens(val);
                  trackEventThrottled(
                    'calculator_interact',
                    buildInteractPayload('output_tokens', { outputTokens: val }),
                    1500
                  );
                }}
                className="w-full accent-indigo-600 dark:accent-indigo-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Batch API Offload % Slider (gated to paid batch-enabled models) */}
        {supportsBatch && (
          <div className="rounded-xl border border-indigo-200/90 dark:border-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-500/10 p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {t.calculator.batchLabel}
                </span>
                <span className="inline-flex items-center rounded-full border border-indigo-300 dark:border-indigo-500/40 bg-indigo-100/90 dark:bg-indigo-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-indigo-800 dark:text-indigo-200 whitespace-nowrap">
                  Batch -{batchPctDisplay}% · 24h Async
                </span>
              </div>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-mono font-semibold tabular-nums whitespace-nowrap ${
                  batchRate > 0
                    ? 'border-indigo-300 dark:border-indigo-500/40 bg-indigo-600 text-white'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {batchRate > 0
                  ? t.calculator.batchBadgeActive
                      .replace('{pct}', String(Math.round(batchRate * 100)))
                      .replace('{discount}', String(batchPctDisplay))
                  : t.calculator.batchBadgeRealtime}
              </span>
            </div>

            <div className="min-h-[44px] flex items-center touch-pan-y">
              <input
                type="range"
                aria-label={t.calculator.batchLabel}
                min={0}
                max={1}
                step={0.05}
                value={batchRate}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBatchRate(val);
                  trackEventThrottled(
                    'calculator_interact',
                    buildInteractPayload('batch_offload_pct', { batchRate: val }),
                    1500
                  );
                }}
                className="w-full accent-indigo-600 dark:accent-indigo-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
              <span>0% (Realtime)</span>
              <span>50%</span>
              <span>100% (Batch 24h)</span>
            </div>

            <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t.calculator.batchTooltip.replace('{pct}', String(batchPctDisplay))}
            </p>

            {isGroq && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-300/80 dark:border-amber-500/30 bg-amber-50/90 dark:bg-amber-500/10 px-3 py-2 text-[11px] text-amber-900 dark:text-amber-200">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span>{t.calculator.groqNonStackableHint}</span>
              </div>
            )}
          </div>
        )}

        {/* Long-Context Tier Switch Card (Amber) */}
        <div
          className={`rounded-xl border p-4 transition-colors space-y-2.5 ${
            isLongContextActive
              ? 'border-amber-300/90 dark:border-amber-500/35 bg-amber-50/75 dark:bg-amber-500/10'
              : 'border-zinc-200/85 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {t.calculator.longContextLabel.replace('{threshold}', thresholdLabel)}
                </span>

                {hasExplicitTier ? (
                  <>
                    <span className="inline-flex items-center rounded-md border border-amber-300 dark:border-amber-500/35 bg-amber-100/90 dark:bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-amber-900 dark:text-amber-200 whitespace-nowrap">
                      &gt;{thresholdLabel} Tier
                      {tierMultiplierLabel ? ` · ${tierMultiplierLabel}` : ''}
                    </span>
                    {model.tierInputPerM && (
                      <span className="text-[11px] font-mono tabular-nums text-amber-800 dark:text-amber-300 whitespace-nowrap">
                        {formatPerMillionPrice(model.tierInputPerM)} /{' '}
                        {formatPerMillionPrice(model.tierOutputPerM ?? model.outputPerM)}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="inline-flex items-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-0.5 text-[10px] font-mono font-medium text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                    {t.calculator.longContextFlatBadge}
                  </span>
                )}
              </div>

              <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                {hasExplicitTier
                  ? t.calculator.longContextHintTiered.replace('{threshold}', thresholdLabel)
                  : t.calculator.longContextHintFlat.replace(
                      '{context}',
                      formatCompactContext(model.contextWindow)
                    )}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isLongContextActive}
              aria-label={t.calculator.longContextLabel.replace('{threshold}', thresholdLabel)}
              disabled={!hasExplicitTier}
              onClick={handleToggleLongContext}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                !hasExplicitTier
                  ? 'cursor-not-allowed opacity-50 bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700'
                  : isLongContextActive
                  ? 'cursor-pointer bg-amber-500 border-amber-600'
                  : 'cursor-pointer bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  isLongContextActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {showLongContextFallbackAlert && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300/80 dark:border-amber-500/30 bg-amber-50/90 dark:bg-amber-500/10 px-3 py-2 text-[11px] text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>{t.calculator.longContextFallbackAlert}</span>
            </div>
          )}
        </div>

        {/* Amortization Slider for Anthropic */}
        {isAnthropic && (
          <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800 space-y-1.5">
            <div className="flex justify-between text-xs gap-2">
              <div className="space-y-0.5">
                <span className="text-zinc-800 dark:text-zinc-300 font-medium block">
                  Cache Lifetime Multiplier ($K$ Rounds)
                </span>
                <span className="text-[11px] text-zinc-500 block">
                  Amortizes the +25% cache write surcharge across average user conversation turns
                </span>
              </div>
              <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-300 font-semibold whitespace-nowrap">
                {cacheLifetime} turns
              </span>
            </div>
            <div className="min-h-[44px] flex items-center touch-pan-y">
              <input
                type="range"
                min={1}
                max={20}
                step={1}
                value={cacheLifetime}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCacheLifetime(val);
                  trackEventThrottled(
                    'calculator_interact',
                    buildInteractPayload('cache_lifetime', { cacheLifetime: val }),
                    1500
                  );
                }}
                className="w-full accent-indigo-600 dark:accent-indigo-400 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Calculation Result Breakdown Grid */}
        <div
          className={`grid grid-cols-1 gap-3.5 pt-4 border-t border-zinc-200/80 dark:border-zinc-800 ${
            supportsBatch ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'
          }`}
        >
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800 font-mono">
            <span className="text-[10px] uppercase text-zinc-500 font-sans block mb-1">
              {t.calculator.breakdownBaseBill}
            </span>
            <span className="text-lg font-bold text-zinc-500 dark:text-zinc-400 line-through tabular-nums whitespace-nowrap">
              {formatCurrency(cost.baseMonthlyCost)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-emerald-500/20 font-mono">
            <span className="text-[10px] uppercase text-emerald-700 dark:text-emerald-400 font-sans block mb-1">
              {t.calculator.breakdownCacheSavings}
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
              -{formatCurrency(cost.cacheSavingsMonthly)}
            </span>
          </div>

          {supportsBatch && (
            <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/25 font-mono">
              <span className="text-[10px] uppercase text-indigo-700 dark:text-indigo-300 font-sans block mb-1">
                {t.calculator.breakdownBatchSavings}
              </span>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-300 tabular-nums whitespace-nowrap">
                -{formatCurrency(cost.batchSavingsMonthly)}
              </span>
            </div>
          )}

          <div className="order-first sm:order-none lg:order-last p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/35 font-mono space-y-1">
            <span className="text-[10px] uppercase text-emerald-700 dark:text-emerald-400 font-sans block font-semibold">
              {t.calculator.breakdownNetBill}
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
              {formatCurrency(cost.monthlyNetCost)}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-sans text-emerald-700 dark:text-emerald-300 tabular-nums">
              <span>
                {t.calculator.breakdownTotalSaved
                  .replace('{amount}', formatCurrency(cost.totalSavingsMonthly))
                  .replace('{pct}', String(Math.round(cost.savingsPercent)))}
              </span>
              <span className="font-mono opacity-85">
                {formatCurrency(cost.costPer1kRequests)} {t.common.per1kRequests}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Comparison & Routing Action Card */}
      <div className="rounded-2xl border border-indigo-200/90 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50/80 via-white to-emerald-50/60 dark:from-indigo-950/35 dark:via-zinc-900/75 dark:to-emerald-950/25 p-5 sm:p-6 backdrop-blur-md shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-100/80 dark:bg-indigo-500/15 px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-indigo-800 dark:text-indigo-200">
              <Sparkles className="h-3 w-3 shrink-0" />
              <span>{t.calculator.savingsCardBadge}</span>
            </span>

            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {t.calculator.savingsCardTitle}
            </h2>

            <p className="text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {cheaperAlternative
                ? t.calculator.savingsCardCompareDesc
                    .replace('{targetModel}', cheaperAlternative.model.modelName)
                    .replace('{amount}', formatCurrency(cheaperAlternative.savingsUsd))
                    .replace('{pct}', String(cheaperAlternative.savingsPct))
                : t.calculator.savingsCardFloorDesc.replace('{model}', model.modelName)}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <TrackedAffiliateLink
              href={openRouterFallbackUrl}
              modelId={model.modelId}
              pageType="calculator_detail"
              locale={locale}
              placement="calculator_savings_card_openrouter"
              provider="openrouter"
              includeRef={true}
              extraParams={{
                batch_offload_pct: Math.round(effectiveBatchRate * 100),
                long_context_enabled: isLongContextActive,
                monthly_savings_usd: Number(
                  (cheaperAlternative ? cheaperAlternative.savingsUsd : cost.totalSavingsMonthly).toFixed(4)
                ),
                target_model: 'openrouter_gateway',
              }}
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-500/20 transition-all active:scale-[0.98] whitespace-nowrap"
            >
              <span>{t.calculator.ctaRouteOpenRouter}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </TrackedAffiliateLink>

            <Link
              href={secondaryCompareHref}
              onClick={() =>
                trackEvent('calculator_savings_cta', {
                  model_id: model.modelId,
                  locale,
                  batch_offload_pct: Math.round(effectiveBatchRate * 100),
                  long_context_enabled: isLongContextActive,
                  monthly_savings_usd: Number(
                    (cheaperAlternative ? cheaperAlternative.savingsUsd : cost.totalSavingsMonthly).toFixed(4)
                  ),
                  target_model: compareTargetId || 'compare_hub',
                  placement: 'calculator_savings_card',
                  outbound_url: secondaryCompareHref,
                })
              }
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
            >
              <Scale className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                {cheaperAlternative
                  ? t.calculator.ctaCompareModel.replace(
                      '{targetModel}',
                      cheaperAlternative.model.modelName
                    )
                  : t.calculator.ctaCompareCheaper}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-70" />
            </Link>
          </div>
        </div>

        <p className="mt-3 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
          {t.calculator.ctaOpenRouterNote}
        </p>
      </div>
    </div>
  );
}
