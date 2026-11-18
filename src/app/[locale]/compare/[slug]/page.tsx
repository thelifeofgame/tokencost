import React from 'react';
import ComparePage, {
  generateStaticParams as originalGenerateStaticParams,
  generateMetadata as originalGenerateMetadata,
} from '@/app/compare/[slug]/page';
import { SUPPORTED_LOCALES } from '@/i18n';

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
  return originalGenerateMetadata({ params: { slug: params.slug } });
}

export default function LocalizedCompareDetailPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  return <ComparePage params={{ slug: params.slug }} />;
}
