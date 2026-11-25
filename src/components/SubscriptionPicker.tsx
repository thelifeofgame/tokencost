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
    <section className="space-y-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40 sm:p-6" id="picker">
      <h2 className="text-lg font-semibold">{t.pickerTitle}</h2>
      <form onSubmit={event => {
        event.preventDefault();
        const selected = selectSubscription(use, budget, china);
        setResult(selected);
        trackEvent('subs_picker_complete', selected ? { value: selected.product.id } : {});
      }} className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1 text-sm">{t.pickerUse}
          <select className="block w-full rounded-lg border bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900" value={use} onChange={event => setUse(event.target.value as SubscriptionUse)}>
            {subscriptionUses.map(option => <option key={option} value={option}>{t[option]}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm">{t.pickerBudget}
          <select className="block w-full rounded-lg border bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900" value={budget} onChange={event => setBudget(event.target.value as Budget)}>
            <option value="20">≤ US$20</option><option value="100">≤ US$100</option><option value="any">{t.anyBudget}</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">{t.pickerChina}
          <select className="block w-full rounded-lg border bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900" value={china ? 'yes' : 'no'} onChange={event => setChina(event.target.value === 'yes')}>
            <option value="no">{t.no}</option><option value="yes">{t.yes}</option>
          </select>
        </label>
        <button type="submit" className="justify-self-start rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-600">{t.pickerSubmit}</button>
      </form>
      {result !== undefined && <div role="status" className="space-y-1 text-sm">
        {result ? <>
          <Link className="font-semibold text-indigo-800 underline dark:text-indigo-200" href={subscriptionHref(locale, `${result.product.id}/`)}>{result.product.name} {result.plan.name}</Link>
          <p>{t.pickerReason.replace('{price}', `US$${result.plan.monthlyUSD}`)}</p>
        </> : <p>{t.pickerNoMatch}</p>}
      </div>}
    </section>
  );
}
