import React from 'react';
import type { Metadata } from 'next';
import ContactClient from '@/app/contact/ContactClient';
import { SUPPORTED_LOCALES, getTranslation } from '@/i18n';
import {
  buildAlternates, resolveLocale,
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
  const alternates = buildAlternates('/contact/', locale);
  const title = `${t.nav.contact} | ${t.common.brand}`;
  const description = t.footer.contactDesc;

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
      images: DEFAULT_OG_IMAGES,
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [DEFAULT_OG_IMAGE_URL],
    },
  };
}

export default function LocalizedContactPage() {
  return <ContactClient />;
}
