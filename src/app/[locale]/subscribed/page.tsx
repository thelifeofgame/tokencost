import type { Metadata } from 'next';
import { SUPPORTED_LOCALES } from '@/i18n';
import SubscriptionStatus from '@/components/SubscriptionStatus';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return SUPPORTED_LOCALES.filter(locale => locale.code !== 'en').map(locale => ({ locale: locale.code }));
}

export default function Page() {
  return <SubscriptionStatus />;
}
