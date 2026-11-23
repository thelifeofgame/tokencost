import type { Metadata } from 'next';
import DealsClient from '@/components/deals/DealsClient';
import SchemaOrg from '@/components/seo/SchemaOrg';
import { getTranslation } from '@/i18n';
import {
  buildAlternates,
  getOgLocale,
  getAlternateOgLocales,
  DEFAULT_OG_IMAGES,
  DEFAULT_OG_IMAGE_URL,
} from '@/lib/seo-alternates';

const t = getTranslation('en');

export const metadata: Metadata = {
  title: t.deals.seoTitle,
  description: t.deals.seoDesc,
  openGraph: {
    title: t.deals.seoTitle,
    description: t.deals.seoDesc,
    url: 'https://tokencostsai.com/deals/',
    siteName: 'TokenCosts AI',
    locale: getOgLocale('en'),
    alternateLocale: getAlternateOgLocales('en'),
    type: 'website',
    images: DEFAULT_OG_IMAGES,
  },
  twitter: {
    card: 'summary_large_image',
    title: t.deals.seoTitle,
    description: t.deals.seoDesc,
    images: [DEFAULT_OG_IMAGE_URL],
  },
  alternates: buildAlternates('/deals/', 'en'),
};

const DEALS_FAQS = [
  {
    question: 'Do OpenAI, Anthropic, Cursor, or DeepSeek have official Black Friday promos as of Nov 23, 2026?',
    answer:
      'No official Black Friday discounts for consumer subscriptions or direct API billing were verified on openai.com, claude.com, cursor.com, or api-docs.deepseek.com as of 2026-11-23. Each card explicitly marks "No Official BF Promo" and highlights recent pricing cuts or plan restructuring instead.',
  },
  {
    question: 'Why does TokenCosts AI only link to primary official vendor domains?',
    answer:
      'Seasonal Black Friday windows attract fake coupon sites and unauthorized top-up resellers. TokenCosts AI strictly links to primary official domains (such as one.google.com, grok.com, devin.ai, and openrouter.ai) and discloses regular price, promo window, eligible tiers, renewal rate, and verification date.',
  },
  {
    question: 'What major December 1 billing changes should API users watch out for?',
    answer:
      'Google Gemini 4 Carbon intro API pricing ($2/$10 per 1M tokens) expires on Nov 30 and doubles to $4/$20 on Dec 1, 2026, while Jules coding agent shuts down Dec 31. Anthropic Opus 4.8 Fast mode in Claude Code is also scheduled for removal on Nov 30.',
  },
];

export default function DealsPage() {
  return (
    <>
      <SchemaOrg
        type="collection"
        name={t.deals.heroTitle}
        description={t.deals.seoDesc}
        url="https://tokencostsai.com/deals/"
        inLanguage="en"
        faqs={DEALS_FAQS}
        breadcrumbs={[
          { name: 'Home', url: 'https://tokencostsai.com/' },
          { name: t.nav.dealsFull, url: 'https://tokencostsai.com/deals/' },
        ]}
      />
      <DealsClient />
    </>
  );
}
