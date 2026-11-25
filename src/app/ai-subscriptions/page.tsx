import SubscriptionsPage, { subscriptionMetadata } from '@/components/SubscriptionsPage';

export function generateMetadata() {
  return subscriptionMetadata({ locale: 'en' as const });
}

export default function Page() {
  return <SubscriptionsPage {...{ locale: 'en' as const }} />;
}
