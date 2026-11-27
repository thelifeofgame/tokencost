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
          <button
            key={filter}
            type="button"
            onClick={() => setUse(filter)}
            aria-pressed={use === filter}
            className="min-h-[36px] rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/70 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-500/40 aria-pressed:border-indigo-600 aria-pressed:bg-indigo-600 aria-pressed:text-white aria-pressed:font-semibold transition-colors"
          >
            {t[filter]}
          </button>
        )}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {products.filter(product => use === 'all' || product.useCases.includes(use)).map(product => {
          const usdRates = product.plans.map(plan => plan.monthlyUSD).filter((price): price is number => price !== null);
          const cnyRates = product.plans.map(plan => plan.monthlyCNY).filter((price): price is number => price !== null);
          const priceLabel = usdRates.length
            ? t.priceFrom.replace('{price}', `US$${Math.min(...usdRates)}`)
            : cnyRates.length
            ? t.priceFrom.replace('{price}', `¥${Math.min(...cnyRates)}`)
            : t.missing;
          return (
            <li
              key={product.id}
              className="group relative rounded-xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 p-4 backdrop-blur-sm shadow-sm shadow-zinc-950/[0.03] dark:shadow-none hover:border-indigo-300/80 dark:hover:border-indigo-500/40 transition-colors"
            >
              <Link
                className="text-sm font-semibold text-indigo-700 hover:text-indigo-600 underline underline-offset-2 dark:text-indigo-300 dark:hover:text-indigo-200"
                href={subscriptionHref(locale, `${product.id}/`)}
              >
                {product.name}
              </Link>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{product.vendor}</p>
              <p className="mt-2 font-mono tabular-nums text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {priceLabel}
              </p>
              <p className="mt-1 font-mono tabular-nums text-xs text-zinc-600 dark:text-zinc-400">
                {t.verified.replace('{date}', product.source.verifiedAt ?? t.missing)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
