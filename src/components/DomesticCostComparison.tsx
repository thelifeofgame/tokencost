'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { convertUsdPriceRate } from '@/lib/domestic-pricing';
import type { UsdQuote } from '@/lib/domestic-pricing';

const cny = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 4 });

export default function DomesticCostComparison({ quotes }: { quotes: UsdQuote[] }) {
  const { t: { domestic: t } } = useI18n();
  const domestic = quotes.filter(quote => quote.region === 'domestic');
  const foreign = quotes.filter(quote => quote.region === 'foreign');
  const [left, setLeft] = useState(domestic[0]?.key ?? '');
  const [right, setRight] = useState(foreign[0]?.key ?? '');
  const [fx, setFx] = useState('');
  const reference = quotes.find(quote => quote.key === left);
  const alternative = quotes.find(quote => quote.key === right);
  const compare = (quote: UsdQuote) => convertUsdPriceRate(quote, Number(fx));
  return (
    <section className="relative overflow-hidden space-y-4 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/65 p-4 sm:p-6 backdrop-blur-md shadow-sm dark:shadow-xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 dark:via-amber-400/35 to-transparent"
      />
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{t.comparison}</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{t.fxNote}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm text-zinc-700 dark:text-zinc-300">
          {t.domesticModel}
          <select
            className="mt-1 block w-full min-h-[42px] rounded-xl border border-zinc-300/90 dark:border-zinc-700/80 bg-white dark:bg-zinc-950/80 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={left}
            onChange={event => setLeft(event.target.value)}
          >
            {domestic.map(quote => <option key={quote.key} value={quote.key}>{quote.name}</option>)}
          </select>
        </label>
        <label className="text-sm text-zinc-700 dark:text-zinc-300">
          {t.foreignModel}
          <select
            className="mt-1 block w-full min-h-[42px] rounded-xl border border-zinc-300/90 dark:border-zinc-700/80 bg-white dark:bg-zinc-950/80 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={right}
            onChange={event => setRight(event.target.value)}
          >
            {foreign.map(quote => <option key={quote.key} value={quote.key}>{quote.name}</option>)}
          </select>
        </label>
        <label className="text-sm text-zinc-700 dark:text-zinc-300">
          {t.fxRate}
          <input
            className="mt-1 block w-full min-h-[42px] rounded-xl border border-zinc-300/90 dark:border-zinc-700/80 bg-white dark:bg-zinc-950/80 px-3 py-2 font-mono tabular-nums text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            type="number"
            inputMode="decimal"
            min="0.0001"
            max="1000"
            step="any"
            value={fx}
            onChange={event => setFx(event.target.value)}
          />
        </label>
      </div>
      <div aria-live="polite" className="grid gap-3 sm:grid-cols-2">
        {[reference, alternative].map(quote => {
          if (!quote) return null;
          const converted = compare(quote);
          return (
            <article
              key={quote.key}
              className="space-y-2 rounded-xl border border-zinc-200/85 dark:border-zinc-800/85 bg-zinc-50/90 dark:bg-zinc-950/60 p-3.5 text-sm"
            >
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                {quote.name}{quote.peak ? ` · ${t.peak}` : ''}
              </h3>
              <p className="text-zinc-700 dark:text-zinc-300">
                {t.usdReference} ·{' '}
                <span className="font-mono tabular-nums font-medium">
                  {'US$'}{quote.input} / {'US$'}{quote.output}
                </span>
              </p>
              <p className="text-zinc-800 dark:text-zinc-200">
                <strong>{t.converted}</strong> ·{' '}
                <span className="font-mono tabular-nums">
                  {converted ? `${cny.format(converted.input)} / ${cny.format(converted.output)}` : t.enterRate}
                </span>
              </p>
              <p className="font-mono tabular-nums text-xs text-zinc-600 dark:text-zinc-400">
                {t.verified.replace('{date}', quote.verifiedAt)}
              </p>
              <a
                href={quote.url}
                className="inline-block text-indigo-700 underline dark:text-indigo-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.source}
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
