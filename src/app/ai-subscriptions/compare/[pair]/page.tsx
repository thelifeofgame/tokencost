import SubscriptionsPage, { subscriptionMetadata } from '@/components/SubscriptionsPage';
import { subscriptionComparisons } from '@/lib/ai-subscriptions';

export function generateStaticParams() {
  return subscriptionComparisons.map(item => ({ pair: item.slug }));
}

export function generateMetadata({ params }: { params: { pair: string } }) {
  return subscriptionMetadata({ locale: 'en' as const, comparisonId: params.pair });
}

export default function Page({ params }: { params: { pair: string } }) {
  return <SubscriptionsPage {...{ locale: 'en' as const, comparisonId: params.pair }} />;
}
