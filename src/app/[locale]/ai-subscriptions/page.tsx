import SubscriptionsPage, { subscriptionMetadata } from '@/components/SubscriptionsPage';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return [{ locale: 'zh-CN' }];
}

export function generateMetadata({ params }: { params: { locale: string } }) {
  if (params.locale !== 'zh-CN') notFound();
  return subscriptionMetadata({ locale: 'zh-CN' as const });
}

export default function Page({ params }: { params: { locale: string } }) {
  if (params.locale !== 'zh-CN') notFound();
  return <SubscriptionsPage {...{ locale: 'zh-CN' as const }} />;
}
