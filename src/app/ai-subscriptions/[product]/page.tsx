import SubscriptionsPage, { subscriptionMetadata } from '@/components/SubscriptionsPage';
import { subscriptionProducts } from '@/lib/ai-subscriptions';

export function generateStaticParams() {
  return subscriptionProducts.map(item => ({ product: item.id }));
}

export function generateMetadata({ params }: { params: { product: string } }) {
  return subscriptionMetadata({ locale: 'en' as const, productId: params.product });
}

export default function Page({ params }: { params: { product: string } }) {
  return <SubscriptionsPage {...{ locale: 'en' as const, productId: params.product }} />;
}
