import React from 'react';
import type { Metadata } from 'next';
import PricingHubView from '@/components/PricingHubView';
import { SUPPORTED_LOCALES, getTranslation } from '@/i18n';
import {
  buildAlternates,
  resolveLocale,
  getOgLocale,
  getAlternateOgLocales,
  DEFAULT_OG_IMAGES,
  DEFAULT_OG_IMAGE_URL,
} from '@/lib/seo-alternates';

export async function generateStaticParams() {
  return SUPPORTED_LOCALES
    .filter((l) => l.code !== 'en')
    .map((l) => ({ locale: l.code }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = resolveLocale(params.locale);
  const t = getTranslation(locale);
  const alternates = buildAlternates('/pricing/', locale);
  const title = `${t.nav.guides} (2026) | TokenCosts AI`;
  const description =
    'Deep-dive LLM API pricing guides, prompt caching math, real-time voice/world models, and Dec 1 migration strategies.';

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: alternates.canonical,
      siteName: 'TokenCosts AI',
      locale: getOgLocale(locale),
      alternateLocale: getAlternateOgLocales(locale),
      type: 'website',
      images: DEFAULT_OG_IMAGES,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE_URL],
    },
  };
}

export default function LocalizedPricingPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = resolveLocale(params.locale);
  return <PricingHubView locale={locale} />;
}
