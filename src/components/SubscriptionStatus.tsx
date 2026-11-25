'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n/I18nProvider';

export default function SubscriptionStatus({ unsubscribed = false }: { unsubscribed?: boolean }) {
  const { t, getLocalizedPath } = useI18n();
  const [valid, setValid] = useState<boolean>();
  useEffect(() => setValid(new URLSearchParams(window.location.search).get('status') !== 'invalid'), []);
  return (
    <div className="mx-auto w-full max-w-xl space-y-4 px-4 py-16">
      <h1 className="text-2xl font-bold">{t.alerts.title}</h1>
      {valid !== undefined && <p role="status">
        {valid ? (unsubscribed ? t.alerts.unsubscribed : t.alerts.subscribed) : t.alerts.invalid}
      </p>}
      <Link className="text-indigo-700 underline dark:text-indigo-300" href={getLocalizedPath('/')}>{t.nav.simulator}</Link>
    </div>
  );
}
