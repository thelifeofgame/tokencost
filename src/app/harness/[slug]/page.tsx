import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getAllHarnessSlugs,
  getHarnessBySlug,
  getHarnessSeoMeta,
} from '@/lib/harness-data';
import {
  buildAlternates,
  DEFAULT_OG_IMAGES,
  DEFAULT_OG_IMAGE_URL,
} from '@/lib/seo-alternates';
import SchemaOrg from '@/components/seo/SchemaOrg';
import HarnessDetailClient from '@/components/HarnessDetailClient';

export async function generateStaticParams() {
  return getAllHarnessSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const tool = getHarnessBySlug(params.slug);
  if (!tool) {
    return {
      title: 'Coding Harness Not Found | TokenCosts AI',
      description: 'The requested coding agent harness profile could not be found.',
    };
  }

  const seo = getHarnessSeoMeta(tool.slug);
  const canonicalUrl = `https://tokencostsai.com/harness/${tool.slug}/`;

  return {
    title: seo.title,
    description: seo.description,
    alternates: buildAlternates(`/harness/${tool.slug}/`, 'en'),
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: 'article',
      url: canonicalUrl,
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

export default function HarnessDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const tool = getHarnessBySlug(params.slug);
  if (!tool) {
    return notFound();
  }

  const seo = getHarnessSeoMeta(tool.slug);
  const canonicalUrl = `https://tokencostsai.com/harness/${tool.slug}/`;
  const faqs = tool.topFaqs.map((f) => ({
    question: f.question,
    answer: f.answer,
  }));
  const breadcrumbs = [
    { name: 'Home', url: 'https://tokencostsai.com/' },
    { name: 'Harnesses', url: 'https://tokencostsai.com/harness/' },
    { name: tool.name, url: canonicalUrl },
  ];

  return (
    <>
      <SchemaOrg
        type="software"
        name={seo.h1}
        description={seo.description}
        url={canonicalUrl}
        faqs={faqs}
        breadcrumbs={breadcrumbs}
        includeHreflang={false}
      />
      <HarnessDetailClient tool={tool} seoH1={seo.h1} />
    </>
  );
}
