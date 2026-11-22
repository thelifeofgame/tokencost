import React from 'react';
import ModelCalculatorPage, {
  generateStaticParams as originalGenerateStaticParams,
  buildCalculatorMetadata,
} from '@/app/calculator/[model]/page';
import { SUPPORTED_LOCALES } from '@/i18n';
import { resolveLocale } from '@/lib/seo-alternates';

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
  return buildCalculatorMetadata(params.model, resolveLocale(params.locale));
}

export default function LocalizedModelCalculatorPage({
  params,
}: {
  params: { locale: string; model: string };
}) {
  const locale = resolveLocale(params.locale);
  return <ModelCalculatorPage params={{ model: params.model }} locale={locale} />;
}
