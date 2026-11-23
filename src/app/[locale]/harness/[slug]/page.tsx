import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getAllHarnessSlugs,
  getHarnessBySlug,
  getLocalizedHarnessSeoMeta,
} from '@/lib/harness-data';
import { SUPPORTED_LOCALES } from '@/i18n';
import {
  buildAlternates,
  buildLocalizedCanonical,
  resolveLocale,
  getOgLocale,
  getAlternateOgLocales,
  DEFAULT_OG_IMAGES,
  DEFAULT_OG_IMAGE_URL,
} from '@/lib/seo-alternates';
import SchemaOrg from '@/components/seo/SchemaOrg';
import HarnessDetailClient from '@/components/HarnessDetailClient';

export async function generateStaticParams() {
  const slugs = getAllHarnessSlugs();
  const nonEnLocales = SUPPORTED_LOCALES.filter((l) => l.code !== 'en');

  return nonEnLocales.flatMap((locale) =>
    slugs.map((slug) => ({
      locale: locale.code,
      slug,
    }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const tool = getHarnessBySlug(params.slug);
  if (!tool) {
    return {
      title: 'Coding Harness Not Found | TokenCosts AI',
      description: 'The requested coding agent harness profile could not be found.',
    };
  }

  const locale = resolveLocale(params.locale);
  const seo = getLocalizedHarnessSeoMeta(tool.slug, locale);
  const alternates = buildAlternates(`/harness/${tool.slug}/`, locale);

  return {
    title: seo.title,
    description: seo.description,
    alternates,
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: 'article',
      locale: getOgLocale(locale),
      alternateLocale: getAlternateOgLocales(locale),
      url: alternates.canonical,
      siteName: 'TokenCosts AI',
      images: DEFAULT_OG_IMAGES,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: [DEFAULT_OG_IMAGE_URL],
    },
  };
}

export default function LocalizedHarnessDetailPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const tool = getHarnessBySlug(params.slug);
  if (!tool) {
    return notFound();
  }

  const locale = resolveLocale(params.locale);
  const seo = getLocalizedHarnessSeoMeta(tool.slug, locale);
  const canonicalUrl = buildLocalizedCanonical(`/harness/${tool.slug}/`, locale);
  const homeUrl = buildLocalizedCanonical('/', locale);
  const harnessHubUrl = buildLocalizedCanonical('/harness/', locale);
  const isZh = locale === 'zh-CN' || locale === 'zh-TW';

  const faqs = tool.topFaqs.map((f) => ({
    question: isZh && f.questionZh ? f.questionZh : f.question,
    answer: isZh && f.answerZh ? f.answerZh : f.answer,
  }));

  const breadcrumbs = [
    { name: 'Home', url: homeUrl },
    { name: 'Harnesses', url: harnessHubUrl },
    { name: tool.name, url: canonicalUrl },
  ];

  return (
    <>
      <SchemaOrg
        type="software"
        name={seo.h1}
        description={seo.description}
        url={canonicalUrl}
        inLanguage={locale}
        faqs={faqs}
        breadcrumbs={breadcrumbs}
        includeHreflang={false}
      />
      <HarnessDetailClient tool={tool} seoH1={seo.h1} />
    </>
  );
}
