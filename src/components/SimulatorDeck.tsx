'use client';

import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, Share2 } from 'lucide-react';
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
  children: ReactNode;
}

const presets = {
  short: { inputTokens: 1000, outputTokens: 300 },
  document: { inputTokens: 24000, outputTokens: 1400 },
  agent: { inputTokens: 25000, outputTokens: 1500 },
};
const numberInput = 'w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm tabular-nums dark:border-zinc-700 dark:bg-zinc-950';

function ScenarioNumber({ value, min, max, onChange }: {
  value: number; min: number; max: number; onChange: (value: number) => void;
}) {
  const [empty, setEmpty] = useState(false);
  return (
    <input type="number" className={numberInput} min={min} max={max} value={empty ? '' : value}
      onChange={event => {
        const n = event.target.valueAsNumber;
        setEmpty(!Number.isFinite(n));
        if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, Math.trunc(n))));
      }}
      onBlur={() => setEmpty(false)} />
  );
}

export default function SimulatorDeck(props: Props) {
  const { params, onChange, advanced, children } = props;
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

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
      <h2 className="text-lg font-semibold">{t.nav.simulator}</h2>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(presets) as Array<keyof typeof presets>).map(key => (
          <button key={key} type="button" className="rounded-lg border border-zinc-300 px-3 py-2 text-xs hover:bg-indigo-50 dark:border-zinc-700 dark:hover:bg-indigo-950"
            onClick={() => { onChange({ ...params, ...presets[key] }); trackEventThrottled('calculator_interact', { action: `preset:${key}` }); }}>
            {labels[key]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {basic.map(({ key, name, min, max }) => (
          <label key={key} className="block space-y-1 text-xs font-medium">
            <span>{name}</span>
            <ScenarioNumber value={params[key]} min={min} max={max} onChange={value => onChange({ ...params, [key]: value })} />
          </label>
        ))}
      </div>
      <div className="rounded-xl bg-indigo-50 p-3 dark:bg-indigo-950" aria-live="polite">
        <p className="text-xs text-zinc-600 dark:text-zinc-300">{labels.estimate} · {props.modelName}</p>
        <strong className="text-2xl font-semibold tabular-nums">{props.monthlyCost}</strong>
        <span className="ml-2 text-xs text-zinc-600 dark:text-zinc-300">{t.common.monthly}</span>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
          {t.simulator.controls.cacheHitRate} {format.format(params.cacheHitRate * 100)}% · {t.simulator.controls.batchOffload} {format.format(params.batchRate * 100)}%
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-expanded={advanced} aria-controls={advancedId} onClick={props.onToggleAdvanced}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-2 text-xs dark:border-zinc-700">
          {labels.advanced}<ChevronDown className={`h-4 w-4 ${advanced ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        <button type="button" onClick={props.onSave} className="rounded-lg border border-zinc-300 px-3 py-2 text-xs dark:border-zinc-700">{labels.save}</button>
        <button type="button" onClick={props.onShare} className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-600">
          <Share2 className="h-4 w-4" aria-hidden="true" />{labels.share}
        </button>
      </div>
      {props.feedback && <p role="status" className="text-sm text-zinc-700 dark:text-zinc-200">{props.feedback}</p>}
      {props.saved.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">{labels.recent}</h3>
          <ul className="flex flex-wrap gap-2">
            {props.saved.map(encoded => {
              const { params } = decodeScenario(new URLSearchParams(encoded));
              return (
                <li key={encoded}>
                  <button aria-label={labels.restore.replace('{requests}', format.format(params.monthlyRequests))
                    .replace('{input}', format.format(params.inputTokens)).replace('{output}', format.format(params.outputTokens))}
                    className="rounded-lg border border-zinc-300 px-2 py-2 text-xs dark:border-zinc-700" type="button" onClick={() => props.onRestore(encoded)}>
                    {format.format(params.monthlyRequests)} · {format.format(params.inputTokens)} → {format.format(params.outputTokens)}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <div id={advancedId} hidden={!advanced}>
        <div className="space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <div className="grid gap-3 sm:grid-cols-2">
            {rateControls.map(({ key, name }) => (
              <label key={key} className="block space-y-1 text-xs">
                <span>{name} · {format.format(params[key] * 100)}%</span>
                <input type="range" min={0} max={100} step={1} className="block w-full accent-indigo-600 relative"
                  value={params[key] * 100} onChange={event => onChange({ ...params, [key]: event.target.valueAsNumber / 100 })} />
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={params.enableLongContext}
              onChange={event => onChange({ ...params, enableLongContext: event.target.checked })} />
            {t.simulator.controls.longContext}
          </label>
          <label className="block max-w-xs space-y-1 text-xs">
            <span>{labels.cacheReuse}</span>
            <ScenarioNumber value={params.cacheLifetimeMultiplier ?? 5} min={1} max={100}
              onChange={cacheLifetimeMultiplier => onChange({ ...params, cacheLifetimeMultiplier })} />
          </label>
          <fieldset className="flex flex-wrap gap-1.5">
            <legend className="mb-1 text-xs">{t.models.filterByProvider}</legend>
            {SCENARIO_PROVIDERS.map(provider => (
              <button key={provider} type="button" aria-pressed={props.selectedProviders.includes(provider)}
                onClick={() => props.onToggleProvider(provider)}
                className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs aria-pressed:bg-indigo-700 aria-pressed:text-white dark:border-zinc-700">
                {provider === 'All' ? t.models.allProviders : provider}
              </button>
            ))}
          </fieldset>
          {children}
        </div>
      </div>
    </section>
  );
}
