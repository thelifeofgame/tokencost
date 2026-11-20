import React from 'react';
import type { Metadata } from 'next';
import CompareClient from '@/app/compare/CompareClient';
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
  const alternates = buildAlternates('/compare/', locale);
  const title = `${t.compare.hubTitle} | TokenCosts AI`;
  const description = formatModelCount(t.compare.hubDesc, count);

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

export default function LocalizedComparePage() {
  return <CompareClient />;
}
