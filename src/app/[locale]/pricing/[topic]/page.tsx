import React from 'react';
import PricingTopicPage, {
  generateStaticParams as originalGenerateStaticParams,
} from '@/app/pricing/[topic]/page';
import { SUPPORTED_LOCALES } from '@/i18n';

export async function generateStaticParams() {
  const topics = await originalGenerateStaticParams();
  const nonEnLocales = SUPPORTED_LOCALES.filter((l) => l.code !== 'en');

  return nonEnLocales.flatMap((locale) =>
    topics.map((t) => ({
      locale: locale.code,
      topic: t.topic,
    }))
  );
}

export default function LocalizedPricingTopicPage({
  params,
}: {
  params: { locale: string; topic: string };
}) {
  return <PricingTopicPage params={{ topic: params.topic }} />;
}
