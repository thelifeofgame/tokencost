'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n/I18nProvider';
import { subscriptionHref, subscriptionUses } from '@/lib/ai-subscriptions';
import type { SubscriptionProduct, SubscriptionUse } from '@/lib/ai-subscriptions';

export default function SubscriptionCatalog({ products }: { products: SubscriptionProduct[] }) {
  const { t: { subscriptions: t }, locale } = useI18n();
  const [use, setUse] = useState<SubscriptionUse | 'all'>('all');
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{t.catalog}</h2>
      <div className="flex flex-wrap gap-2">
        {(['all', ...subscriptionUses] as const).map(filter =>
          <button key={filter} type="button" onClick={() => setUse(filter)} aria-pressed={use === filter}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-xs aria-pressed:bg-indigo-700 aria-pressed:text-white dark:border-zinc-700">{t[filter]}</button>
        )}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {products.filter(product => use === 'all' || product.useCases.includes(use)).map(product => {
          const rates = product.plans.map(plan => plan.monthlyUSD).filter((price): price is number => price !== null);
          return <li key={product.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <Link className="text-sm font-semibold text-indigo-700 underline dark:text-indigo-300" href={subscriptionHref(locale, `${product.id}/`)}>{product.name}</Link>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{product.vendor}</p>
            <p className="mt-2 text-sm">{rates.length ? t.priceFrom.replace('{price}', `US$${Math.min(...rates)}`) : t.missing}</p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{t.verified.replace('{date}', product.source.verifiedAt ?? t.missing)}</p>
          </li>;
        })}
      </ul>
    </section>
  );
}
