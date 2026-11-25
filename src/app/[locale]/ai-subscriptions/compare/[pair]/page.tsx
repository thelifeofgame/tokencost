import SubscriptionsPage, { subscriptionMetadata } from '@/components/SubscriptionsPage';
import { notFound } from 'next/navigation';
import { subscriptionComparisons } from '@/lib/ai-subscriptions';

export function generateStaticParams() {
  return subscriptionComparisons.map(item => ({ locale: 'zh-CN', pair: item.slug }));
}

export function generateMetadata({ params }: { params: { locale: string; pair: string } }) {
  if (params.locale !== 'zh-CN') notFound();
  return subscriptionMetadata({ locale: 'zh-CN' as const, comparisonId: params.pair });
}

export default function Page({ params }: { params: { locale: string; pair: string } }) {
  if (params.locale !== 'zh-CN') notFound();
  return <SubscriptionsPage {...{ locale: 'zh-CN' as const, comparisonId: params.pair }} />;
}
