import type { Metadata } from 'next';
import { PRICING_TOPICS } from '@/lib/models-data';
import PricingTopicPage, { buildTopicMetadata } from '@/components/PricingTopicPage';

export async function generateStaticParams() {
  return PRICING_TOPICS.map((t) => ({
    topic: t.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { topic: string };
}): Promise<Metadata> {
  return buildTopicMetadata(params.topic);
}

export default function Page({ params }: { params: { topic: string } }) {
  return <PricingTopicPage params={params} />;
}
