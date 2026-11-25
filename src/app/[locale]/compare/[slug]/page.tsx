import React from 'react';
import { generateStaticParams as originalGenerateStaticParams } from '@/app/compare/[slug]/page';
import ComparePage, { buildCompareMetadata } from '@/components/ComparePage';
import { SUPPORTED_LOCALES } from '@/i18n';
import { resolveLocale } from '@/lib/seo-alternates';

export async function generateStaticParams() {
  const slugs = await originalGenerateStaticParams();
  const nonEnLocales = SUPPORTED_LOCALES.filter((l) => l.code !== 'en');

  return nonEnLocales.flatMap((locale) =>
    slugs.map((s) => ({
      locale: locale.code,
      slug: s.slug,
    }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  return buildCompareMetadata(params.slug, resolveLocale(params.locale));
}

export default function LocalizedCompareDetailPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const locale = resolveLocale(params.locale);
  return <ComparePage params={{ slug: params.slug }} locale={locale} />;
}
