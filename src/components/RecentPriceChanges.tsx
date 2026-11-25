'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n/I18nProvider';
import { getAlertsApiOrigin } from '@/lib/alert-api';
import type { PriceChange } from '../../workers/visits-24h/src/alerts-logic';

export default function RecentPriceChanges({ className = 'lg:col-span-7' }: { className?: string }) {
  const { t, getLocalizedPath } = useI18n();
  const [changes, setChanges] = useState<PriceChange[]>([]);
  useEffect(() => {
    const request = new AbortController();
    const origin = getAlertsApiOrigin();
    if (!origin && ['localhost', '127.0.0.1'].includes(window.location.hostname)) return;
    fetch(`${origin}/api/price-changes?days=30`, { signal: request.signal })
      .then(async (response) => (response.ok ? ((await response.json()) as { changes: PriceChange[] }) : null))
      .then((data) => {
        if (Array.isArray(data?.changes)) setChanges(data.changes.slice(0, 8));
      })
      .catch(() => {});
    return () => request.abort();
  }, []);

  if (!changes.length) return null;
  const rate = (value: number | null) => (value === null ? t.alerts.noRate : `$${value}/1M`);

  return (
    <section
      data-price-changes
      className={`${className} relative overflow-hidden h-full rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md shadow-sm shadow-zinc-950/[0.04] dark:shadow-xl flex flex-col justify-between min-w-0`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-400/25 dark:via-zinc-400/20 to-transparent" />
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t.alerts.recent}</h2>
        <ul className="mt-3 divide-y divide-zinc-200/70 dark:divide-zinc-800/70 text-xs sm:text-sm">
          {changes.map((change) => {
            const isDrop =
              change.oldValue !== null &&
              change.newValue !== null &&
              change.newValue < change.oldValue;
            const isHike =
              change.oldValue !== null &&
              change.newValue !== null &&
              change.newValue > change.oldValue;

            return (
              <li
                key={`${change.modelId}:${change.field}:${change.foundAt}`}
                className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3"
              >
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <Link
                    className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
                    href={getLocalizedPath(`/models/${change.modelId}/`)}
                  >
                    {change.modelName}
                  </Link>
                  <span className="rounded-md px-1.5 py-0.5 text-[10px] font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                    {t.alerts[change.field]}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {change.field !== 'new' && (
                    <span
                      className={`font-mono tabular-nums text-xs ${
                        isDrop
                          ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                          : isHike
                            ? 'text-rose-700 dark:text-rose-400 font-semibold'
                            : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {isDrop ? '▼ ' : isHike ? '▲ ' : ''}
                      {rate(change.oldValue)} → {rate(change.newValue)}
                    </span>
                  )}
                  <time
                    dateTime={change.foundAt}
                    className="text-[11px] font-mono tabular-nums text-zinc-600 dark:text-zinc-400 shrink-0"
                  >
                    {change.foundAt.slice(0, 10)}
                  </time>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
