'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n/I18nProvider';
import { selectSubscription, subscriptionHref, subscriptionUses } from '@/lib/ai-subscriptions';
import type { Budget, SubscriptionUse } from '@/lib/ai-subscriptions';
import { trackEvent } from '@/lib/analytics';

export default function SubscriptionPicker() {
  const { locale, t: { subscriptions: t } } = useI18n();
  const [use, setUse] = useState<SubscriptionUse>('chat');
  const [budget, setBudget] = useState<Budget>('20');
  const [china, setChina] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof selectSubscription>>();
  return (
    <section
      className="relative overflow-hidden space-y-4 rounded-2xl border border-indigo-200/90 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50/80 via-white/95 to-zinc-50/80 dark:from-indigo-950/35 dark:via-zinc-900/75 dark:to-zinc-950/80 p-4 sm:p-6 backdrop-blur-md shadow-sm dark:shadow-xl"
      id="picker"
    >
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t.pickerTitle}</h2>
      <form
        onSubmit={event => {
          event.preventDefault();
          const selected = selectSubscription(use, budget, china);
          setResult(selected);
          trackEvent('subs_picker_complete', selected ? { value: selected.product.id } : {});
        }}
        className="grid gap-3 sm:grid-cols-3"
      >
        <label className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
          {t.pickerUse}
          <select
            className="mt-1 block w-full min-h-[42px] rounded-xl border border-zinc-300/90 dark:border-zinc-700/80 bg-white dark:bg-zinc-950/80 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={use}
            onChange={event => setUse(event.target.value as SubscriptionUse)}
          >
            {subscriptionUses.map(option => (
              <option key={option} value={option}>
                {t[option]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
          {t.pickerBudget}
          <select
            className="mt-1 block w-full min-h-[42px] rounded-xl border border-zinc-300/90 dark:border-zinc-700/80 bg-white dark:bg-zinc-950/80 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={budget}
            onChange={event => setBudget(event.target.value as Budget)}
          >
            <option value="20">≤ US$20</option>
            <option value="100">≤ US$100</option>
            <option value="any">{t.anyBudget}</option>
          </select>
        </label>
        <label className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
          {t.pickerChina}
          <select
            className="mt-1 block w-full min-h-[42px] rounded-xl border border-zinc-300/90 dark:border-zinc-700/80 bg-white dark:bg-zinc-950/80 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={china ? 'yes' : 'no'}
            onChange={event => setChina(event.target.value === 'yes')}
          >
            <option value="no">{t.no}</option>
            <option value="yes">{t.yes}</option>
          </select>
        </label>
        <button
          type="submit"
          className="min-h-[44px] sm:min-h-[40px] justify-self-start rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all active:scale-[0.98]"
        >
          {t.pickerSubmit}
        </button>
      </form>
      {result !== undefined && (
        <div role="status" className="space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
          {result ? (
            <>
              <Link
                className="font-semibold text-indigo-800 underline dark:text-indigo-200"
                href={subscriptionHref(locale, `${result.product.id}/`)}
              >
                {result.product.name} {result.plan.name}
              </Link>
              <p className="tabular-nums">
                {t.pickerReason.replace('{price}', `US$${result.plan.monthlyUSD}`)}
              </p>
            </>
          ) : (
            <p>{t.pickerNoMatch}</p>
          )}
        </div>
      )}
    </section>
  );
}
