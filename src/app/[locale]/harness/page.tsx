import React from 'react';
import type { Metadata } from 'next';
import HarnessDirectoryClient from '@/components/HarnessDirectoryClient';
import SchemaOrg from '@/components/seo/SchemaOrg';
import { HARNESS_TOOLS } from '@/lib/harness-data';
import { SUPPORTED_LOCALES, getTranslation } from '@/i18n';
import {
  buildAlternates,
  buildLocalizedCanonical,
  resolveLocale,
  getOgLocale,
  getAlternateOgLocales,
  DEFAULT_OG_IMAGES,
  DEFAULT_OG_IMAGE_URL,
} from '@/lib/seo-alternates';

const totalHarnesses = HARNESS_TOOLS.length;
const minMultiplier = Math.min(...HARNESS_TOOLS.map((t) => t.tokenMultiplierMin)).toFixed(1);
const maxMultiplier = Math.max(...HARNESS_TOOLS.map((t) => t.tokenMultiplierMax)).toFixed(1);

export async function generateStaticParams() {
  return SUPPORTED_LOCALES
    .filter((l) => l.code !== 'en')
    .map((l) => ({ locale: l.code }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = resolveLocale(params.locale);
  const t = getTranslation(locale);
  const alternates = buildAlternates('/harness/', locale);
  const title = `${t.nav.harness} (2026) | TokenCosts AI`;
  const description = `Audit real token multipliers (${minMultiplier}x Aider to ${maxMultiplier}x DeepSeek Harness), AST repo-map pruning, Prompt Caching hit rates, and BYOK configs across ${totalHarnesses} AI coding agents.`;

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: alternates.canonical,
      siteName: 'TokenCosts AI',
      locale: getOgLocale(locale),
      alternateLocale: getAlternateOgLocales(locale),
      type: 'website',
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

export default function LocalizedHarnessPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = resolveLocale(params.locale);
  const t = getTranslation(locale);
  const canonicalUrl = buildLocalizedCanonical('/harness/', locale);

  return (
    <>
      <SchemaOrg
        type="software"
        name={`${t.nav.harness} (2026)`}
        description={`Real token multiplier audit (${minMultiplier}x–${maxMultiplier}x) and BYOK cost optimization directory across ${totalHarnesses} top AI coding agents.`}
        url={canonicalUrl}
        inLanguage={locale}
        breadcrumbs={[
          { name: 'Home', url: buildLocalizedCanonical('/', locale) },
          { name: t.nav.harness, url: canonicalUrl },
        ]}
      />
      <HarnessDirectoryClient />
    </>
  );
}
