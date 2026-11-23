import React from 'react';
import { generateHreflangTags, isValidLocale } from '@/i18n';
import { Locale } from '@/i18n/types';
import { getHtmlLang } from '@/lib/seo-alternates';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ModelOfferSchema {
  price: string;
  provider?: string;
  contextWindow?: number;
}

interface SchemaOrgProps {
  type?: 'software' | 'compare' | 'model' | 'faq' | 'collection';
  name?: string;
  description?: string;
  url?: string;
  inLanguage?: Locale | string;
  modelOffer?: ModelOfferSchema;
  faqs?: FAQItem[];
  breadcrumbs?: BreadcrumbItem[];
  includeHreflang?: boolean;
}

function resolveInLanguage(inLanguage?: Locale | string): string | undefined {
  if (!inLanguage) return undefined;
  if (isValidLocale(inLanguage)) {
    return getHtmlLang(inLanguage);
  }
  return inLanguage;
}

export default function SchemaOrg({
  type = 'software',
  name = 'TokenCosts AI - Real-Time LLM API Cost Intelligence & Smart Router',
  description = 'Real-time LLM API cost simulator, prompt caching discount calculator, and multi-model adaptive routing engine.',
  url = 'https://tokencostsai.com/',
  inLanguage,
  modelOffer,
  faqs,
  breadcrumbs,
  includeHreflang = false,
}: SchemaOrgProps) {
  const schemas: Record<string, unknown>[] = [];
  const normalizedLang = resolveInLanguage(inLanguage);

  // 1. SoftwareApplication Schema (Primary for Homepage & Calculator pages)
  if (type === 'software') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': url,
      name,
      description,
      url,
      ...(normalizedLang ? { inLanguage: normalizedLang } : {}),
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'All',
      softwareVersion: '2.0.0',
      offers: {
        '@type': 'Offer',
        price: '0.00',
        priceCurrency: 'USD',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '128',
        bestRating: '5',
        worstRating: '1',
      },
      author: {
        '@type': 'Organization',
        name: 'TokenCosts AI',
        url: 'https://tokencostsai.com',
      },
      featureList: [
        'Real-time LLM API pricing calculation',
        'Prompt Caching write-surcharge & read-discount ROI analysis',
        'Batch API 50% discount offload simulator',
        'Multi-model Pareto-optimal adaptive routing',
        'Context window tiered escalation rate detection',
        'Global 6-Language Internationalization (English, 简体中文, 繁體中文, 日本語, 한국어, Español)',
      ],
    });
  }

  // 2. Model Page Schema (WebPage + mainEntity SoftwareApplication with Offer)
  if (type === 'model') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': url,
      name,
      description,
      url,
      ...(normalizedLang ? { inLanguage: normalizedLang } : {}),
      mainEntity: {
        '@type': 'SoftwareApplication',
        '@id': `${url}#model`,
        name,
        description,
        url,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'All',
        ...(modelOffer?.provider
          ? {
              provider: {
                '@type': 'Organization',
                name: modelOffer.provider,
              },
            }
          : {}),
        offers: {
          '@type': 'Offer',
          price: modelOffer?.price ?? '0.00',
          priceCurrency: 'USD',
          description: 'USD per 1M input tokens',
        },
      },
      publisher: {
        '@type': 'Organization',
        name: 'TokenCosts AI',
        url: 'https://tokencostsai.com',
      },
    });
  }

  // 3. CollectionPage Schema (For Official Deals & Billing Watch Directory)
  if (type === 'collection') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': url,
      name,
      description,
      url,
      ...(normalizedLang ? { inLanguage: normalizedLang } : {}),
      isPartOf: {
        '@type': 'WebSite',
        name: 'TokenCosts AI',
        url: 'https://tokencostsai.com/',
      },
      publisher: {
        '@type': 'Organization',
        name: 'TokenCosts AI',
        url: 'https://tokencostsai.com',
      },
    });
  }

  // 4. FAQPage Schema (For Compare, Deals and Topic Pages)
  if (faqs && faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      ...(normalizedLang ? { inLanguage: normalizedLang } : {}),
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer,
        },
      })),
    });
  }

  // 5. BreadcrumbList Schema
  if (breadcrumbs && breadcrumbs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((b, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: b.name,
        item: b.url,
      })),
    });
  }

  // 6. TechArticle Schema for Compare Pages
  if (type === 'compare') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      '@id': url,
      headline: name,
      description,
      url,
      ...(normalizedLang ? { inLanguage: normalizedLang } : {}),
      author: {
        '@type': 'Organization',
        name: 'TokenCosts AI Engineering',
        url: 'https://tokencostsai.com',
      },
      publisher: {
        '@type': 'Organization',
        name: 'TokenCosts AI',
        url: 'https://tokencostsai.com',
      },
    });
  }

  // Alternate hreflangs (disabled by default; Next.js Metadata.alternates.languages is the single source of truth)
  const hreflangs = includeHreflang && url ? generateHreflangTags(url) : [];

  return (
    <>
      {hreflangs.map((hl) => (
        <link key={hl.hrefLang} rel="alternate" hrefLang={hl.hrefLang} href={hl.href} />
      ))}

      {schemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
