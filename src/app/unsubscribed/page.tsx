import type { Metadata } from 'next';
import SubscriptionStatus from '@/components/SubscriptionStatus';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return <SubscriptionStatus unsubscribed />;
}
