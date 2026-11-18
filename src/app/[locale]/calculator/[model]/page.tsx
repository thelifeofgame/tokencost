import React from 'react';
import ModelCalculatorPage, {
  generateStaticParams as originalGenerateStaticParams,
  generateMetadata as originalGenerateMetadata,
} from '@/app/calculator/[model]/page';
import { SUPPORTED_LOCALES } from '@/i18n';

export async function generateStaticParams() {
  const models = await originalGenerateStaticParams();
  const nonEnLocales = SUPPORTED_LOCALES.filter((l) => l.code !== 'en');

  return nonEnLocales.flatMap((locale) =>
    models.map((m) => ({
      locale: locale.code,
      model: m.model,
    }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; model: string };
}) {
  return originalGenerateMetadata({ params: { model: params.model } });
}

export default function LocalizedModelCalculatorPage({
  params,
}: {
  params: { locale: string; model: string };
}) {
  return <ModelCalculatorPage params={{ model: params.model }} />;
}
