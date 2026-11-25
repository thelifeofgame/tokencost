'use client';

import { useI18n } from '@/i18n/I18nProvider';
import type { AnalyticsOverviewResponse } from '@/types/analytics';
import { formatExactInt, formatPct } from './formatters';

export default function AdminGrowth({ growth }: { growth: NonNullable<AnalyticsOverviewResponse['growth']> }) {
  const { t } = useI18n();
  const labels = t.growth;
  const percentage = (value: number | null) => value === null ? '—' : formatPct(value);
  const metrics = [
    [labels.day1, percentage(growth.day1Rate)],
    [labels.day7, percentage(growth.day7Rate)],
    [labels.cohort, formatExactInt(growth.cohortSize)],
    [labels.submitted, formatExactInt(growth.submitted)],
    [labels.confirmed, formatExactInt(growth.confirmed)],
    [labels.confirmationRate, percentage(growth.submitted ? 100 * growth.confirmed / growth.submitted : null)],
  ];

  return (
    <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <h2 className="text-sm font-semibold">{labels.growthTitle}</h2>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">{labels.retentionWindow}</p>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-zinc-600 dark:text-zinc-400">{label}</dt>
            <dd className="font-mono text-lg font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <details className="text-xs">
        <summary className="cursor-pointer font-semibold">{labels.eventCounts}</summary>
        <dl className="mt-2 grid gap-2 sm:grid-cols-2">
          {growth.events.map(({ event, count }) => (
            <div key={event} className="flex justify-between gap-2">
              <dt className="font-mono">{event}</dt>
              <dd className="tabular-nums">{formatExactInt(count)}</dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  );
}
