import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MODELS_DATA } from '@/lib/models-data';
import ModelCachingCalculatorClient from '@/components/ModelCachingCalculatorClient';
import SchemaOrg from '@/components/seo/SchemaOrg';
import {
  buildAlternates,
  buildLocalizedCanonical,
  getOgLocale,
  DEFAULT_OG_IMAGES,
  DEFAULT_OG_IMAGE_URL,
} from '@/lib/seo-alternates';
import { BREADCRUMB_LABELS, getLocalizedCalculatorMeta } from '@/lib/detail-seo';
import { Locale } from '@/i18n/types';

export async function generateStaticParams() {
  return MODELS_DATA.map((m) => ({
    model: m.modelId,
  }));
}

export function buildCalculatorMetadata(modelId: string, locale: Locale = 'en'): Metadata {
  const model = MODELS_DATA.find((m) => m.modelId === modelId);
  if (!model) {
    return {
      title: 'Calculator Not Found | TokenCosts AI',
      description: 'The requested model prompt caching calculator does not exist.',
    };
  }

  const { title, description, keywords } = getLocalizedCalculatorMeta(model, locale);
  const alternates = buildAlternates(`/calculator/${model.modelId}/`, locale);

  return {
    title,
    description,
    keywords,
    alternates,
    openGraph: {
      title,
      description,
      type: 'article',
      locale: getOgLocale(locale),
      url: alternates.canonical,
      siteName: 'TokenCosts AI',
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

export async function generateMetadata({
  params,
}: {
  params: { model: string };
}): Promise<Metadata> {
  return buildCalculatorMetadata(params.model, 'en');
}

export default function ModelCachingCalculatorPage({
  params,
  locale = 'en',
}: {
  params: { model: string };
  locale?: Locale;
}) {
  const model = MODELS_DATA.find((m) => m.modelId === params.model);

  if (!model) {
    return notFound();
  }

  const canonicalUrl = buildLocalizedCanonical(`/calculator/${model.modelId}/`, locale);
  const { title: localizedTitle, description: localizedDescription } = getLocalizedCalculatorMeta(
    model,
    locale
  );
  const bc = BREADCRUMB_LABELS[locale];
  const breadcrumbs = [
    { name: bc.home, url: buildLocalizedCanonical('/', locale) },
    { name: bc.calculators, url: buildLocalizedCanonical('/calculator/', locale) },
    { name: model.modelName, url: canonicalUrl },
  ];

  return (
    <>
      <SchemaOrg
        type="software"
        name={localizedTitle}
        description={localizedDescription}
        url={canonicalUrl}
        inLanguage={locale}
        breadcrumbs={breadcrumbs}
      />
      <ModelCachingCalculatorClient model={model} />
    </>
  );
}
