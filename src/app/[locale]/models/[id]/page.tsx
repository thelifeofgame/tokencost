import React from 'react';
import ModelDetailPage, {
  generateStaticParams as originalGenerateStaticParams,
  buildModelMetadata,
} from '@/app/models/[id]/page';
import { SUPPORTED_LOCALES } from '@/i18n';
import { resolveLocale } from '@/lib/seo-alternates';

export async function generateStaticParams() {
  const models = await originalGenerateStaticParams();
  const nonEnLocales = SUPPORTED_LOCALES.filter((l) => l.code !== 'en');

  return nonEnLocales.flatMap((locale) =>
    models.map((m) => ({
      locale: locale.code,
      id: m.id,
    }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; id: string };
}) {
  return buildModelMetadata(params.id, resolveLocale(params.locale));
}

export default function LocalizedModelDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  return <ModelDetailPage params={{ id: params.id }} />;
}
