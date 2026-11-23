import React from 'react';
import type { Metadata } from 'next';
import DealsClient from '@/components/deals/DealsClient';
import SchemaOrg from '@/components/seo/SchemaOrg';
import { SUPPORTED_LOCALES, getTranslation } from '@/i18n';
import {
  buildAlternates,
  buildLocalizedCanonical,
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
  const alternates = buildAlternates('/deals/', locale);
  const title = t.deals.seoTitle;
  const description = t.deals.seoDesc;

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

export default function LocalizedDealsPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = resolveLocale(params.locale);
  const t = getTranslation(locale);
  const canonicalUrl = buildLocalizedCanonical('/deals/', locale);

  return (
    <>
      <SchemaOrg
        type="collection"
        name={t.deals.heroTitle}
        description={t.deals.seoDesc}
        url={canonicalUrl}
        inLanguage={locale}
        breadcrumbs={[
          { name: t.nav.simulator, url: buildLocalizedCanonical('/', locale) },
          { name: t.nav.dealsFull, url: canonicalUrl },
        ]}
      />
      <DealsClient />
    </>
  );
}
