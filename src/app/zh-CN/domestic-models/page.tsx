import type { Metadata } from 'next';
import Link from 'next/link';
import data from '@/data/domestic_models.json';
import DomesticCostComparison from '@/components/DomesticCostComparison';
import { getTranslation } from '@/i18n';
import { buildLocalizedCanonical } from '@/lib/seo-alternates';
import type { DomesticProvider, UsdQuote } from '@/lib/domestic-pricing';

const { domestic: t } = getTranslation('zh-CN');
const providers: DomesticProvider[] = data.providers;
const quotes = data.usdQuotes as UsdQuote[];
const cny = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 4 });
const rate = (value: number | null) => value === null ? t.missing : cny.format(value);

export const metadata: Metadata = {
  title: `${t.title} | TokenCosts AI`,
  description: t.description,
  alternates: { canonical: buildLocalizedCanonical('/domestic-models/', 'zh-CN') },
};

export default function DomesticModelsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.description}</p>
      </header>
      <DomesticCostComparison quotes={quotes} />
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.cnRates}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map(provider => <li key={provider.id} className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h3><Link href={`/zh-CN/models/${provider.modelId}/`} className="font-semibold text-indigo-700 underline dark:text-indigo-300">{provider.name}</Link></h3>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-2"><dt>{t.input}</dt><dd>{rate(provider.cnyPerMillion.input)}</dd></div>
              <div className="flex justify-between gap-2"><dt>{t.output}</dt><dd>{rate(provider.cnyPerMillion.output)}</dd></div>
              <div className="flex justify-between gap-2"><dt>{t.cached}</dt><dd>{rate(provider.cnyPerMillion.cached)}</dd></div>
              <div className="flex justify-between gap-2"><dt>{t.payments}</dt><dd>{provider.paymentMethods?.join(' · ') ?? t.missing}</dd></div>
            </dl>
            {provider.paymentSource && <p className="text-xs">
              <a href={provider.paymentSource} target="_blank" rel="noopener noreferrer" className="text-indigo-700 underline dark:text-indigo-300">{t.paymentSource}</a>
              {provider.paymentVerifiedAt && ` · ${provider.paymentVerifiedAt}`}
            </p>}
            <a href={provider.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-700 underline dark:text-indigo-300">{t.source}</a>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">{t.verified.replace('{date}', provider.priceVerifiedAt ?? t.missing)}</p>
          </li>)}
        </ul>
      </section>
      <Link href="/zh-CN/" className="text-sm text-indigo-700 underline dark:text-indigo-300">{t.simulator}</Link>
    </div>
  );
}
