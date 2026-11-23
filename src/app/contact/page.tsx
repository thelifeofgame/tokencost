import type { Metadata } from 'next';
import ContactClient from './ContactClient';
import {
  buildAlternates,
  getOgLocale,
  getAlternateOgLocales,
  DEFAULT_OG_IMAGES,
  DEFAULT_OG_IMAGE_URL,
} from '@/lib/seo-alternates';

export const metadata: Metadata = {
  title: 'Contact & Enterprise FinOps Migration Audit | TokenCosts AI',
  description:
    'Book a 48-hour LLM FinOps cost audit before the Dec 1 Gemini 4 Carbon price hike, migrate off retired Azure o3/o4-mini endpoints, or email www.smeng@gmail.com directly.',
  alternates: buildAlternates('/contact/', 'en'),
  openGraph: {
    title: 'Contact TokenCosts AI & Enterprise FinOps Audits',
    description:
      'Direct engineering support for LLM caching optimization, model routing, and migration cost audits.',
    url: 'https://tokencostsai.com/contact/',
    siteName: 'TokenCosts AI',
    locale: getOgLocale('en'),
    alternateLocale: getAlternateOgLocales('en'),
    type: 'website',
    images: DEFAULT_OG_IMAGES,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact TokenCosts AI & Enterprise FinOps Audits',
    description: 'Direct engineering support for LLM caching optimization, model routing, and migration cost audits.',
    images: [DEFAULT_OG_IMAGE_URL],
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
