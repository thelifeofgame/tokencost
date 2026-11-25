'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n/I18nProvider';
import { getAlertsApiOrigin } from '@/lib/alert-api';
import type { PriceChange } from '../../workers/visits-24h/src/alerts-logic';

export default function RecentPriceChanges() {
  const { t, getLocalizedPath } = useI18n();
  const [changes, setChanges] = useState<PriceChange[]>([]);
  useEffect(() => {
    const request = new AbortController();
    const origin = getAlertsApiOrigin();
    if (!origin && ['localhost', '127.0.0.1'].includes(window.location.hostname)) return;
    fetch(`${origin}/api/price-changes?days=30`, { signal: request.signal })
      .then(async response => response.ok ? await response.json() as { changes: PriceChange[] } : null)
      .then(data => { if (Array.isArray(data?.changes)) setChanges(data.changes.slice(0, 8)); })
      .catch(() => {});
    return () => request.abort();
  }, []);

  if (!changes.length) return null;
  const rate = (value: number | null) => value === null ? t.alerts.noRate : `$${value}/1M`;
  return (
    <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-semibold">{t.alerts.recent}</h2>
      <ul className="mt-2 divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
        {changes.map(change => (
          <li key={`${change.modelId}:${change.field}:${change.foundAt}`} className="flex flex-wrap gap-x-3 py-2">
            <Link className="font-medium text-indigo-700 underline dark:text-indigo-300" href={getLocalizedPath(`/models/${change.modelId}/`)}>
              {change.modelName}
            </Link>
            <span>{t.alerts[change.field]}{change.field !== 'new' ? ` · ${rate(change.oldValue)} → ${rate(change.newValue)}` : ''}</span>
            <time dateTime={change.foundAt} className="text-zinc-600 dark:text-zinc-400">{change.foundAt.slice(0, 10)}</time>
          </li>
        ))}
      </ul>
    </section>
  );
}
