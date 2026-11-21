import React from 'react';
import type { Metadata } from 'next';
import ModelsClient from '@/app/models/ModelsClient';
import { SUPPORTED_LOCALES, getTranslation, formatModelCount } from '@/i18n';
import { MODELS_DATA } from '@/lib/models-data';
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
  const count = MODELS_DATA.length;
  const alternates = buildAlternates('/models/', locale);
  const title = `${formatModelCount(t.models.title, count)} | TokenCosts AI`;
  const description = formatModelCount(t.models.desc, count);

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

export default function LocalizedModelsPage() {
  return <ModelsClient />;
}
