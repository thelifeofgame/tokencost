import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MODELS_DATA } from '@/lib/models-data';
import ModelCachingCalculatorClient from '@/components/ModelCachingCalculatorClient';
import SchemaOrg from '@/components/seo/SchemaOrg';
import {
  buildAlternates,
  DEFAULT_OG_IMAGES,
  DEFAULT_OG_IMAGE_URL,
} from '@/lib/seo-alternates';
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

  const title = `${model.modelName} Prompt Caching Calculator & ROI Simulator | TokenCosts AI`;
  const description = `Simulate prompt cache read savings (-${model.cacheDiscountPercent}% off), write surcharge amortization, and monthly net bills for ${model.modelName} (${model.inputPerM}/1M base, ${model.cachedInputPerM}/1M cached).`;
  const alternates = buildAlternates(`/calculator/${model.modelId}/`, locale);

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      type: 'article',
      url: alternates.canonical,
      siteName: 'TokenCosts AI',
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

export async function generateMetadata({
  params,
}: {
  params: { model: string };
}): Promise<Metadata> {
  return buildCalculatorMetadata(params.model, 'en');
}

export default function ModelCachingCalculatorPage({
  params,
}: {
  params: { model: string };
}) {
  const model = MODELS_DATA.find((m) => m.modelId === params.model);

  if (!model) {
    return notFound();
  }

  return (
    <>
      <SchemaOrg
        name={`${model.modelName} Prompt Caching Calculator`}
        description={`Calculate monthly API bill savings with ${model.modelName} prompt caching discounts.`}
        url={`https://tokencostsai.com/calculator/${model.modelId}/`}
      />
      <ModelCachingCalculatorClient model={model} />
    </>
  );
}
