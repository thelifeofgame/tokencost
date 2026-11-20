import React from 'react';
import { generateHreflangTags } from '@/i18n';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SchemaOrgProps {
  type?: 'software' | 'compare' | 'model' | 'faq';
  name?: string;
  description?: string;
  url?: string;
  faqs?: FAQItem[];
  breadcrumbs?: BreadcrumbItem[];
  includeHreflang?: boolean;
}

export default function SchemaOrg({
  type = 'software',
  name = 'TokenCosts AI - Real-Time LLM API Cost Intelligence & Smart Router',
  description = 'Real-time LLM API cost simulator, prompt caching discount calculator, and multi-model adaptive routing engine.',
  url = 'https://tokencostsai.com/',
  faqs,
  breadcrumbs,
  includeHreflang = false,
}: SchemaOrgProps) {
  const schemas: Record<string, unknown>[] = [];

  // 1. SoftwareApplication Schema (Primary for Homepage)
  if (type === 'software') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name,
      description,
      url,
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

  // 2. FAQPage Schema (For Compare and Topic Pages)
  if (faqs && faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
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

  // 3. BreadcrumbList Schema
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

  // 4. TechArticle Schema for Compare Pages
  if (type === 'compare') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: name,
      description,
      url,
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
