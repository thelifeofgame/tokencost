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
    <section className="space-y-4 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900 dark:bg-indigo-950/40 sm:p-6">
      <h2 className="text-xl font-semibold">{t.comparison}</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{t.fxNote}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">{t.domesticModel}
          <select className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900" value={left} onChange={event => setLeft(event.target.value)}>
            {domestic.map(quote => <option key={quote.key} value={quote.key}>{quote.name}</option>)}
          </select>
        </label>
        <label className="text-sm">{t.foreignModel}
          <select className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900" value={right} onChange={event => setRight(event.target.value)}>
            {foreign.map(quote => <option key={quote.key} value={quote.key}>{quote.name}</option>)}
          </select>
        </label>
        <label className="text-sm">{t.fxRate}
          <input className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
            type="number" inputMode="decimal" min="0.0001" max="1000" step="any" value={fx} onChange={event => setFx(event.target.value)} />
        </label>
      </div>
      <div aria-live="polite" className="grid gap-3 sm:grid-cols-2">
        {[reference, alternative].map(quote => {
          if (!quote) return null;
          const converted = compare(quote);
          return <article key={quote.key} className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="font-semibold">{quote.name}{quote.peak ? ` · ${t.peak}` : ''}</h3>
            <p>{t.usdReference} · {'US$'}{quote.input} / {'US$'}{quote.output}</p>
            <p><strong>{t.converted}</strong> · {converted ? `${cny.format(converted.input)} / ${cny.format(converted.output)}` : t.enterRate}</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">{t.verified.replace('{date}', quote.verifiedAt)}</p>
            <a href={quote.url} className="text-indigo-700 underline dark:text-indigo-300" target="_blank" rel="noopener noreferrer">{t.source}</a>
          </article>;
        })}
      </div>
    </section>
  );
}
