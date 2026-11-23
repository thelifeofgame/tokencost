import React from 'react';
import type { Metadata } from 'next';
import PricingHubView from '@/components/PricingHubView';
import {
  buildAlternates,
  getOgLocale,
  getAlternateOgLocales,
  DEFAULT_OG_IMAGES,
  DEFAULT_OG_IMAGE_URL,
} from '@/lib/seo-alternates';

export const metadata: Metadata = {
  title: 'LLM API Pricing Guides & FinOps Strategies (2026) | TokenCosts AI',
  description:
    'Deep-dive analyses on foundational model unit economics, prompt caching discounts, batch APIs, real-time voice/world models, and Dec 1 migration strategies.',
  alternates: buildAlternates('/pricing/', 'en'),
  openGraph: {
    title: 'LLM API Pricing Guides & FinOps Strategies | TokenCosts AI',
    description:
      'Comprehensive price-performance benchmarks, prompt caching tutorials, and provider breakdown.',
    url: 'https://tokencostsai.com/pricing/',
    siteName: 'TokenCosts AI',
    locale: getOgLocale('en'),
    alternateLocale: getAlternateOgLocales('en'),
    type: 'website',
    images: DEFAULT_OG_IMAGES,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LLM API Pricing Guides & FinOps Strategies | TokenCosts AI',
    description: 'Comprehensive price-performance benchmarks, prompt caching tutorials, and provider breakdown.',
    images: [DEFAULT_OG_IMAGE_URL],
  },
};

export default function PricingHubPage() {
  return <PricingHubView locale="en" />;
}
