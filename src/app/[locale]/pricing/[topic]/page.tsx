import React from 'react';
import PricingTopicPage, {
  generateStaticParams as originalGenerateStaticParams,
  buildTopicMetadata,
} from '@/app/pricing/[topic]/page';
import { SUPPORTED_LOCALES } from '@/i18n';
import { resolveLocale } from '@/lib/seo-alternates';

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

export async function generateMetadata({
  params,
}: {
  params: { locale: string; topic: string };
}) {
  return buildTopicMetadata(params.topic, resolveLocale(params.locale));
}

export default function LocalizedPricingTopicPage({
  params,
}: {
  params: { locale: string; topic: string };
}) {
  const locale = resolveLocale(params.locale);
  return <PricingTopicPage params={{ topic: params.topic }} locale={locale} />;
}
