import React from 'react';
import type { Metadata } from 'next';
import HomePage from '../page';
import { SUPPORTED_LOCALES, getTranslation, formatModelCount } from '@/i18n';
import { MODELS_DATA } from '@/lib/models-data';
import { buildAlternates, resolveLocale } from '@/lib/seo-alternates';

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
  const count = MODELS_DATA.length;
  const alternates = buildAlternates('/', locale);
  const title = `${t.common.brand} | ${t.simulator.heroTitle} (${count}+)`;
  const description = formatModelCount(t.simulator.heroDesc, count);

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: alternates.canonical,
      siteName: 'TokenCosts AI',
      type: 'website',
    },
  };
}

export default function LocalizedHomePage() {
  return <HomePage />;
}
