'use client';

import { useEffect, useState } from 'react';
import { Ban, Clock } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';

const DAY_MS = 86_400_000;

interface DealDeadlineProps {
  endsAt: string;
  variant?: 'inline' | 'pill';
  tone?: 'emerald' | 'neutral';
}

export default function DealDeadline({
  endsAt,
  variant = 'inline',
  tone = 'neutral',
}: DealDeadlineProps) {
  const { t } = useI18n();
  const [now, setNow] = useState<number>();

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const absolute = endsAt.includes('T')
    ? endsAt.replace('T', ' ').replace(/:00Z$/, ' UTC')
    : endsAt;
  const timestamp = Date.parse(endsAt);
  const dateOnly = endsAt.length === 10;
  const daysLeft =
    now === undefined
      ? null
      : dateOnly
      ? Math.floor(timestamp / DAY_MS) - Math.floor(now / DAY_MS)
      : Math.ceil((timestamp - now) / DAY_MS);
  const ended =
    now !== undefined && (dateOnly ? (daysLeft ?? 0) < 0 : now >= timestamp);

  if (variant === 'pill') {
    const isUrgent = !ended && daysLeft !== null && Number.isFinite(daysLeft) && daysLeft <= 3;

    let badgeClasses =
      'border-zinc-200/90 bg-white text-zinc-700 dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:text-zinc-300';
    let iconClasses = 'text-zinc-500 dark:text-zinc-400';

    if (ended) {
      badgeClasses =
        'border-rose-200/90 bg-rose-50/90 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300';
      iconClasses = 'text-rose-700 dark:text-rose-300';
    } else if (isUrgent) {
      badgeClasses =
        'border-amber-300/95 bg-amber-50 text-amber-900 shadow-xs shadow-amber-950/[0.04] dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200';
      iconClasses = 'text-amber-700 dark:text-amber-300';
    } else if (tone === 'emerald') {
      badgeClasses =
        'border-emerald-200/90 bg-emerald-50/85 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300';
      iconClasses = 'text-emerald-700 dark:text-emerald-400';
    }

    const countdownLabel =
      daysLeft !== null && Number.isFinite(daysLeft)
        ? ended
          ? t.growth.expired
          : isUrgent && daysLeft >= 0
          ? `T-${daysLeft} · ${t.growth.daysRemaining.replace('{days}', String(daysLeft))}`
          : t.growth.daysRemaining.replace('{days}', String(daysLeft))
        : null;

    return (
      <span className="inline-flex flex-wrap items-center gap-1.5 min-h-[22px]">
        <time
          dateTime={endsAt}
          className="font-mono text-[10px] tabular-nums text-zinc-600 dark:text-zinc-400 whitespace-nowrap"
        >
          {absolute}
        </time>
        {countdownLabel !== null && (
          <span
            className={`inline-flex items-center gap-1 h-[22px] rounded-full border px-1.5 py-0.5 text-[10px] font-mono tabular-nums font-semibold leading-none whitespace-nowrap shrink-0 ${badgeClasses}`}
          >
            {ended ? (
              <Ban className={`h-2.5 w-2.5 shrink-0 ${iconClasses}`} aria-hidden="true" />
            ) : (
              <Clock className={`h-2.5 w-2.5 shrink-0 ${iconClasses}`} aria-hidden="true" />
            )}
            <span>{countdownLabel}</span>
          </span>
        )}
      </span>
    );
  }

  return (
    <>
      {t.growth.deadline} <time dateTime={endsAt}>{absolute}</time>
      {daysLeft !== null && Number.isFinite(daysLeft) && (
        <> · {ended ? t.growth.expired : t.growth.daysRemaining.replace('{days}', String(daysLeft))}</>
      )}
    </>
  );
}
