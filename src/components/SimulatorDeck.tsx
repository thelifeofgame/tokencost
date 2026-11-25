'use client';

import { useId, useState } from 'react';
import { Check, ChevronDown, Share2, SlidersHorizontal } from 'lucide-react';
import type { SimulationParams } from '@/types/pricing';
import { useI18n } from '@/i18n/I18nProvider';
import { decodeScenario, SCENARIO_PROVIDERS } from '@/lib/scenarios';
import { trackEventThrottled } from '@/lib/analytics';

interface Props {
  params: SimulationParams;
  onChange: (params: SimulationParams) => void;
  selectedProviders: string[];
  onToggleProvider: (provider: string) => void;
  advanced: boolean;
  onToggleAdvanced: () => void;
  onShare: () => void;
  onSave: () => void;
  onRestore: (scenario: string) => void;
  saved: string[];
  feedback: string;
  monthlyCost: string;
  modelName: string;
  onOpenEstimator?: () => void;
  className?: string;
}

const presets = {
  short: { inputTokens: 1000, outputTokens: 300 },
  document: { inputTokens: 24000, outputTokens: 1400 },
  agent: { inputTokens: 25000, outputTokens: 1500 },
};

const numberInput =
  'w-full min-w-0 rounded-lg border border-zinc-300/90 bg-white px-2.5 py-2 text-xs sm:text-sm font-mono tabular-nums text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700/80 dark:bg-zinc-950/80 dark:text-zinc-100';

function ScenarioNumber({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const [empty, setEmpty] = useState(false);
  return (
    <input
      type="number"
      className={numberInput}
      min={min}
      max={max}
      value={empty ? '' : value}
      onChange={(event) => {
        const n = event.target.valueAsNumber;
        setEmpty(!Number.isFinite(n));
        if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, Math.trunc(n))));
      }}
      onBlur={() => setEmpty(false)}
    />
  );
}

export default function SimulatorDeck(props: Props) {
  const { params, onChange, advanced } = props;
  const { t, locale } = useI18n();
  const labels = t.scenarios;
  const format = new Intl.NumberFormat(locale);
  const advancedId = useId();
  const basic = [
    { key: 'monthlyRequests', name: t.simulator.controls.monthlyRequests, min: 1, max: 2_000_000 },
    { key: 'inputTokens', name: t.simulator.controls.inputTokens, min: 0, max: 128000 },
    { key: 'outputTokens', name: t.simulator.controls.outputTokens, min: 0, max: 8192 },
  ] as const;
  const rateControls = [
    { key: 'cacheHitRate', name: t.simulator.controls.cacheHitRate },
    { key: 'batchRate', name: t.simulator.controls.batchOffload },
  ] as const;

  const hasCustomProviders = !props.selectedProviders.includes('All');

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md shadow-sm shadow-zinc-950/[0.04] dark:shadow-xl flex flex-col justify-between gap-3.5 ${props.className ?? ''}`}
    >
      {/* Top 1px sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-400/25 dark:via-zinc-400/20 to-transparent" />

      <div className="space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <SlidersHorizontal className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" aria-hidden="true" />
            <h2 className="text-sm font-semibold tracking-tight uppercase text-zinc-900 dark:text-zinc-100 truncate">
              {t.nav.simulator}
            </h2>
          </div>
          <span className="shrink-0 rounded-full border border-zinc-200/90 dark:border-zinc-700/70 bg-zinc-100/80 dark:bg-zinc-800/70 px-2 py-0.5 text-[10px] font-mono font-medium text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
            {advanced ? labels.modeAdvanced : labels.modeSimple}
          </span>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(presets) as Array<keyof typeof presets>).map((key) => {
            const isPresetActive =
              params.inputTokens === presets[key].inputTokens &&
              params.outputTokens === presets[key].outputTokens;
            return (
              <button
                key={key}
                type="button"
                className={`min-h-[36px] sm:min-h-[32px] px-2.5 py-1 rounded-lg border text-xs font-medium transition-all active:scale-[0.97] ${
                  isPresetActive
                    ? 'border-indigo-500/60 bg-indigo-50 text-indigo-700 shadow-sm dark:border-indigo-500/50 dark:bg-indigo-500/15 dark:text-indigo-300'
                    : 'border-zinc-200/90 bg-zinc-50/80 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-zinc-100'
                }`}
                onClick={() => {
                  onChange({ ...params, ...presets[key] });
                  trackEventThrottled('calculator_interact', { action: `preset:${key}` });
                }}
              >
                {labels[key]}
              </button>
            );
          })}
        </div>

        {/* 3 Core Numeric Inputs (adapts between Simple wide col & Advanced narrow col) */}
        <div className={advanced ? 'grid grid-cols-2 gap-2.5' : 'grid grid-cols-1 sm:grid-cols-3 gap-3'}>
          {basic.map(({ key, name, min, max }) => (
            <label
              key={key}
              className={`block space-y-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 min-w-0 ${
                advanced && key === 'monthlyRequests' ? 'col-span-2' : 'col-span-1'
              }`}
            >
              <span className="block truncate">{name}</span>
              <ScenarioNumber
                value={params[key]}
                min={min}
                max={max}
                onChange={(value) => onChange({ ...params, [key]: value })}
              />
            </label>
          ))}
        </div>

        {/* Primary Cost Readout Box */}
        <div
          aria-live="polite"
          className="relative overflow-hidden rounded-xl border border-indigo-200/80 dark:border-indigo-500/25 bg-gradient-to-br from-indigo-50/90 via-white/80 to-zinc-50/70 dark:from-indigo-950/40 dark:via-zinc-950/70 dark:to-zinc-950/90 p-3.5"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 truncate">
              {labels.estimate} ·{' '}
              <span className="font-semibold text-zinc-900 dark:text-zinc-200">{props.modelName}</span>
            </p>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <strong className="text-2xl sm:text-[26px] font-bold font-mono tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
              {props.monthlyCost}
            </strong>
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t.common.monthly}</span>
          </div>
          <p className="mt-1 text-[11px] font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
            {t.simulator.controls.cacheHitRate} {format.format(params.cacheHitRate * 100)}% ·{' '}
            {t.simulator.controls.batchOffload} {format.format(params.batchRate * 100)}%
          </p>
        </div>

        {/* Action Buttons + Inline Status Pill (Zero-CLS) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-expanded={advanced}
            aria-controls={advancedId}
            onClick={props.onToggleAdvanced}
            className={`min-h-[40px] sm:min-h-[36px] inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.98] ${
              advanced
                ? 'border-indigo-500/50 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-300'
                : 'border-zinc-200/90 bg-zinc-50/80 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700/80 dark:bg-zinc-950/60 dark:text-zinc-300 dark:hover:bg-zinc-800/80'
            }`}
          >
            <span>{labels.advanced}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${advanced ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={props.onSave}
            className="min-h-[40px] sm:min-h-[36px] inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/90 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700/80 dark:bg-zinc-950/60 dark:text-zinc-300 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100 transition-all active:scale-[0.98]"
          >
            {labels.save}
          </button>

          <button
            type="button"
            onClick={props.onShare}
            className="min-h-[40px] sm:min-h-[36px] inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all active:scale-[0.98]"
          >
            <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{labels.share}</span>
          </button>

          <div aria-live="polite" className="min-h-[26px] inline-flex items-center">
            {props.feedback && (
              <span
                role="status"
                className="inline-flex items-center gap-1 rounded-full border border-emerald-200/90 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 animate-fade-in"
              >
                <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span>{props.feedback}</span>
              </span>
            )}
          </div>
        </div>

        {/* Recently Saved Scenarios */}
        {props.saved.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{labels.recent}</h3>
            <ul className="flex flex-wrap gap-1.5 max-h-[68px] overflow-y-auto custom-scrollbar">
              {props.saved.map((encoded) => {
                const { params } = decodeScenario(new URLSearchParams(encoded));
                return (
                  <li key={encoded}>
                    <button
                      aria-label={labels.restore
                        .replace('{requests}', format.format(params.monthlyRequests))
                        .replace('{input}', format.format(params.inputTokens))
                        .replace('{output}', format.format(params.outputTokens))}
                      className="inline-flex items-center rounded-md border border-zinc-200/90 bg-zinc-50/80 px-2 py-1 text-[11px] font-mono tabular-nums text-zinc-700 hover:border-indigo-400/60 hover:text-indigo-700 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300 dark:hover:border-indigo-500/40 dark:hover:text-indigo-300 transition-colors"
                      type="button"
                      onClick={() => props.onRestore(encoded)}
                    >
                      {format.format(params.monthlyRequests)} · {format.format(params.inputTokens)} →{' '}
                      {format.format(params.outputTokens)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Advanced Controls (height-constrained for 3-col Bento parity) */}
      <div id={advancedId} hidden={!advanced}>
        <div className="space-y-3 border-t border-zinc-200/80 pt-3 dark:border-zinc-800/80">
          {/* Rate Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
            {rateControls.map(({ key, name }) => (
              <label key={key} className="block space-y-1 text-[11px]">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-zinc-600 dark:text-zinc-400 truncate">{name}</span>
                  <span className="font-mono tabular-nums font-semibold text-indigo-700 dark:text-indigo-300 shrink-0">
                    {format.format(params[key] * 100)}%
                  </span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  className="block w-full min-h-[36px] sm:min-h-[22px] accent-indigo-600 relative"
                  value={params[key] * 100}
                  onChange={(event) => onChange({ ...params, [key]: event.target.valueAsNumber / 100 })}
                />
              </label>
            ))}
          </div>

          {/* Long Context + Cache Reuse + Token Estimator */}
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/45 p-2.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer min-w-0">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 shrink-0"
                  checked={params.enableLongContext}
                  onChange={(event) => onChange({ ...params, enableLongContext: event.target.checked })}
                />
                <span className="truncate">{t.simulator.controls.longContext}</span>
              </label>
              {props.onOpenEstimator && (
                <button
                  type="button"
                  onClick={props.onOpenEstimator}
                  className="shrink-0 text-[11px] font-medium text-indigo-700 hover:text-indigo-600 dark:text-indigo-300 dark:hover:text-indigo-200 underline underline-offset-2"
                >
                  {t.simulator.controls.estimateTokensBtn}
                </button>
              )}
            </div>
            <label className="flex items-center justify-between gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
              <span className="truncate">{labels.cacheReuse}</span>
              <div className="w-20 shrink-0">
                <ScenarioNumber
                  value={params.cacheLifetimeMultiplier ?? 5}
                  min={1}
                  max={100}
                  onChange={(cacheLifetimeMultiplier) => onChange({ ...params, cacheLifetimeMultiplier })}
                />
              </div>
            </label>
          </div>

          {/* Collapsible Provider Filter */}
          <details
            open={hasCustomProviders || undefined}
            className="group rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/45 px-2.5 py-2"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 select-none">
              <span className="truncate">{t.models.filterByProvider}</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 shrink-0">
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                    hasCustomProviders
                      ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'bg-zinc-200/70 dark:bg-zinc-800'
                  }`}
                >
                  {hasCustomProviders
                    ? labels.selectedCount.replace('{count}', String(props.selectedProviders.length))
                    : t.models.allProviders}
                </span>
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
              </span>
            </summary>
            <fieldset className="flex flex-wrap gap-1.5 pt-2.5 mt-2 border-t border-zinc-200/70 dark:border-zinc-800/70">
              {SCENARIO_PROVIDERS.map((provider) => (
                <button
                  key={provider}
                  type="button"
                  aria-pressed={props.selectedProviders.includes(provider)}
                  onClick={() => props.onToggleProvider(provider)}
                  className="rounded-md border border-zinc-300/90 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/70 px-2 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:border-zinc-400 dark:hover:border-zinc-600 aria-pressed:border-indigo-600 aria-pressed:bg-indigo-600 aria-pressed:text-white"
                >
                  {provider === 'All' ? t.models.allProviders : provider}
                </button>
              ))}
            </fieldset>
          </details>
        </div>
      </div>
    </section>
  );
}
