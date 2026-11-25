import SubscriptionsPage, { subscriptionMetadata } from '@/components/SubscriptionsPage';
import { notFound } from 'next/navigation';
import { subscriptionProducts } from '@/lib/ai-subscriptions';

export function generateStaticParams() {
  return subscriptionProducts.map(item => ({ locale: 'zh-CN', product: item.id }));
}

export function generateMetadata({ params }: { params: { locale: string; product: string } }) {
  if (params.locale !== 'zh-CN') notFound();
  return subscriptionMetadata({ locale: 'zh-CN' as const, productId: params.product });
}

export default function Page({ params }: { params: { locale: string; product: string } }) {
  if (params.locale !== 'zh-CN') notFound();
  return <SubscriptionsPage {...{ locale: 'zh-CN' as const, productId: params.product }} />;
}
