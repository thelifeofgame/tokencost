'use client';

import React, { useState } from 'react';
import { ModelPricingRule } from '@/types/pricing';
import { calculateModelCost } from '@/lib/calculator-engine';
import { formatCurrency, formatPerMillionPrice } from '@/lib/utils';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/i18n/I18nProvider';
import { trackEventThrottled } from '@/lib/analytics';
import TrackedAffiliateLink from '@/components/TrackedAffiliateLink';

interface ModelCachingCalculatorClientProps {
  model: ModelPricingRule;
}

export default function ModelCachingCalculatorClient({
  model,
}: ModelCachingCalculatorClientProps) {
  const { locale, t, getLocalizedPath } = useI18n();
  const [requests, setRequests] = useState(100000);
  const [inputTokens, setInputTokens] = useState(8000);
  const [outputTokens, setOutputTokens] = useState(800);
  const [cacheHitRate, setCacheHitRate] = useState(0.75);
  const [cacheLifetime, setCacheLifetime] = useState(5);

  const cost = calculateModelCost(model, {
    monthlyRequests: requests,
    inputTokens,
    outputTokens,
    cacheHitRate,
    batchRate: 0,
    enableLongContext: false,
    cacheLifetimeMultiplier: cacheLifetime,
  });

  const isAnthropic = model.providerOrg === 'Anthropic';

  return (
    <div data-analytics-module="calculator" className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
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
              className="min-h-[40px] w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm shadow-indigo-500/25 transition-all active:scale-[0.98] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
            >
              <span>{t.simulator.leaderboard.connectApi}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </TrackedAffiliateLink>
          )}
        </div>

        {/* Pricing rules highlight */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 font-mono text-xs">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-sans block">Base Input Rate</span>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {formatPerMillionPrice(model.inputPerM)}/M
            </span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-emerald-500/25">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-sans block">{t.calculator.cacheHitRead}</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {formatPerMillionPrice(model.cachedInputPerM)}/M
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-sans block">
              (-{model.cacheDiscountPercent}%)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-sans block">Cache Write Surcharge</span>
            <span className="text-base font-bold text-zinc-800 dark:text-zinc-200">
              {model.cacheWritePerM ? `${formatPerMillionPrice(model.cacheWritePerM)}/M (+25%)` : 'Free (Automatic)'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-sans block">Output Rate</span>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {formatPerMillionPrice(model.outputPerM)}/M
            </span>
          </div>
        </div>
      </div>

      {/* Simulator Deck */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-md shadow-sm dark:shadow-xl space-y-6">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
          Simulation Parameters
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">{t.simulator.controls.monthlyRequests}</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-200">{requests.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={5000}
              max={1000000}
              step={5000}
              value={requests}
              onChange={(e) => { setRequests(Number(e.target.value)); trackEventThrottled('calculator_interact', { source: 'model_calculator', model_id: model.modelId }); }}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">{t.simulator.controls.inputTokens}</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-200">{inputTokens.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={1000}
              max={100000}
              step={1000}
              value={inputTokens}
              onChange={(e) => { setInputTokens(Number(e.target.value)); trackEventThrottled('calculator_interact', { source: 'model_calculator', model_id: model.modelId }); }}
              className="w-full"
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
              onChange={(e) => { setCacheHitRate(Number(e.target.value)); trackEventThrottled('calculator_interact', { source: 'model_calculator', model_id: model.modelId }); }}
              className="w-full"
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
              max={4096}
              step={100}
              value={outputTokens}
              onChange={(e) => { setOutputTokens(Number(e.target.value)); trackEventThrottled('calculator_interact', { source: 'model_calculator', model_id: model.modelId }); }}
              className="w-full"
            />
          </div>
        </div>

        {/* Amortization Slider for Anthropic */}
        {isAnthropic && (
          <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800 space-y-2">
            <div className="flex justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-zinc-800 dark:text-zinc-300 font-medium block">
                  Cache Lifetime Multiplier ($K$ Rounds)
                </span>
                <span className="text-[11px] text-zinc-500 block">
                  Amortizes the +25% cache write surcharge across average user conversation turns
                </span>
              </div>
              <span className="font-mono text-indigo-600 dark:text-indigo-300 font-semibold">{cacheLifetime} turns</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={cacheLifetime}
              onChange={(e) => { setCacheLifetime(Number(e.target.value)); trackEventThrottled('calculator_interact', { source: 'model_calculator', model_id: model.modelId }); }}
              className="w-full"
            />
          </div>
        )}

        {/* Calculation Result Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-200/80 dark:border-zinc-800">
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800 font-mono">
            <span className="text-[10px] uppercase text-zinc-500 font-sans block">
              {t.simulator.chart.baseCost}
            </span>
            <span className="text-lg font-bold text-zinc-500 dark:text-zinc-300 line-through">
              {formatCurrency(cost.baseMonthlyCost)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 font-mono">
            <span className="text-[10px] uppercase text-emerald-700 dark:text-emerald-400 font-sans block font-semibold">
              {t.simulator.chart.netCost}
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(cost.monthlyNetCost)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800 font-mono">
            <span className="text-[10px] uppercase text-zinc-500 font-sans block">
              {t.simulator.chart.cacheSavings}
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(cost.totalSavingsMonthly)} (-{Math.round(cost.savingsPercent)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
