import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MODELS_DATA } from '@/lib/models-data';
import ModelCachingCalculatorClient from '@/components/ModelCachingCalculatorClient';
import SchemaOrg from '@/components/seo/SchemaOrg';

export async function generateStaticParams() {
  return MODELS_DATA.map((m) => ({
    model: m.modelId,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { model: string };
}): Promise<Metadata> {
  const model = MODELS_DATA.find((m) => m.modelId === params.model);
  if (!model) {
    return {
      title: 'Calculator Not Found | TokenCosts AI',
      description: 'The requested model prompt caching calculator does not exist.',
    };
  }

  const title = `${model.modelName} Prompt Caching Calculator & ROI Simulator | TokenCosts AI`;
  const description = `Simulate prompt cache read savings (-${model.cacheDiscountPercent}% off), write surcharge amortization, and monthly net bills for ${model.modelName} ($${model.inputPerM}/1M base, $${model.cachedInputPerM}/1M cached).`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://tokencostsai.com/calculator/${model.modelId}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://tokencostsai.com/calculator/${model.modelId}`,
      siteName: 'TokenCosts AI',
    },
  };
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
        url={`https://tokencostsai.com/calculator/${model.modelId}`}
      />
      <ModelCachingCalculatorClient model={model} />
    </>
  );
}
