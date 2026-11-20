import React from 'react';
import type { Metadata } from 'next';
import HarnessDirectoryClient from '@/components/HarnessDirectoryClient';
import { SUPPORTED_LOCALES, getTranslation } from '@/i18n';
import { buildAlternates, resolveLocale } from '@/lib/seo-alternates';

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
  const description =
    'Audit real token multipliers (1.2x Aider to 3.5x Cursor), AST repo-map pruning, Prompt Caching hit rates, and BYOK configs across 7 AI coding agents.';

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: alternates.canonical,
      siteName: 'TokenCosts AI',
      type: 'website',
    },
  };
}

export default function LocalizedHarnessPage() {
  return <HarnessDirectoryClient />;
}
