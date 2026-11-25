'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';

const DAY_MS = 86_400_000;

export default function DealDeadline({ endsAt }: { endsAt: string }) {
  const { t } = useI18n();
  const [now, setNow] = useState<number>();

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const absolute = endsAt.includes('T') ? endsAt.replace('T', ' ').replace(/:00Z$/, ' UTC') : endsAt;
  const timestamp = Date.parse(endsAt);
  const dateOnly = endsAt.length === 10;
  const daysLeft = now === undefined ? null : dateOnly
    ? Math.floor(timestamp / DAY_MS) - Math.floor(now / DAY_MS)
    : Math.ceil((timestamp - now) / DAY_MS);
  const ended = now !== undefined && (dateOnly ? (daysLeft ?? 0) < 0 : now >= timestamp);

  return (
    <>
      {t.growth.deadline} <time dateTime={endsAt}>{absolute}</time>
      {daysLeft !== null && Number.isFinite(daysLeft) && (
        <> · {ended ? t.growth.expired : t.growth.daysRemaining.replace('{days}', String(daysLeft))}</>
      )}
    </>
  );
}
