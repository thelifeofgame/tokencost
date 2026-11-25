import type { Metadata } from 'next';
import DealsClient from '@/components/deals/DealsClient';
import SchemaOrg from '@/components/seo/SchemaOrg';
import { getTranslation } from '@/i18n';
import { getDealsFaqs } from '@/lib/deals-faq-data';
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

export default function DealsPage() {
  const faqs = getDealsFaqs('en');

  return (
    <>
      <SchemaOrg
        type="collection"
        name={t.deals.heroTitle}
        description={t.deals.seoDesc}
        url="https://tokencostsai.com/deals/"
        inLanguage="en"
        faqs={faqs}
        breadcrumbs={[
          { name: 'Home', url: 'https://tokencostsai.com/' },
          { name: t.nav.dealsFull, url: 'https://tokencostsai.com/deals/' },
        ]}
      />
      <DealsClient />
    </>
  );
}
