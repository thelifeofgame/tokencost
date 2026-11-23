import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getComparisonData,
  getAllCompareStaticSlugs,
} from '@/lib/models-data';
import SchemaOrg from '@/components/seo/SchemaOrg';
import TrackedAffiliateLink from '@/components/TrackedAffiliateLink';
import {
  buildAlternates,
  buildLocalizedCanonical,
  getOgLocale,
  DEFAULT_OG_IMAGES,
  DEFAULT_OG_IMAGE_URL,
} from '@/lib/seo-alternates';
import { BREADCRUMB_LABELS, getLocalizedCompareMeta } from '@/lib/detail-seo';
import { getLocalizedPath } from '@/i18n';
import { Locale } from '@/i18n/types';
import { formatPerMillionPrice } from '@/lib/utils';
import { ModelPricingRule } from '@/types/pricing';

function formatQualityIndex(m: ModelPricingRule): string {
  if (m.benchmarks?.intelligenceIndex != null) return `AA ${m.benchmarks.intelligenceIndex.toFixed(1)}`;
  if (m.benchmarks?.arenaElo != null) return `Elo ${m.benchmarks.arenaElo}`;
  if (m.benchmarks?.codingIndex != null) {
    return m.benchmarks.codingIndex <= 100 ? `Code ${m.benchmarks.codingIndex}%` : `Code ${m.benchmarks.codingIndex}`;
  }
  return 'Eval N/A';
}
import CompareDetailClient from '@/components/CompareDetailClient';
import {
  Scale,
  Zap,
  Bot,
  Cpu,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';

export async function generateStaticParams() {
  const slugs = getAllCompareStaticSlugs();
  return slugs.map((slug) => ({ slug }));
}

export function buildCompareMetadata(slug: string, locale: Locale = 'en'): Metadata {
  const data = getComparisonData(slug);
  if (!data) {
    return {
      title: 'Comparison Not Found | TokenCosts AI',
      description: 'The requested LLM API comparison does not exist or has been relocated.',
    };
  }

  const { title, description, keywords } = getLocalizedCompareMeta(
    data.modelA,
    data.modelB,
    data.canonicalSlug,
    locale
  );
  const alternates = buildAlternates(`/compare/${data.canonicalSlug}/`, locale);

  return {
    title,
    description,
    keywords,
    alternates,
    openGraph: {
      title,
      description,
      type: 'article',
      locale: getOgLocale(locale),
      url: alternates.canonical,
      siteName: 'TokenCosts AI',
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

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  return buildCompareMetadata(params.slug, 'en');
}

export default function ComparePage({
  params,
  locale = 'en',
}: {
  params: { slug: string };
  locale?: Locale;
}) {
  const data = getComparisonData(params.slug);

  if (!data) {
    return notFound();
  }

  const { modelA, modelB, canonicalSlug, scenarios, faqs } = data;

  const canonicalUrl = buildLocalizedCanonical(`/compare/${canonicalSlug}/`, locale);
  const { title: localizedTitle, description: localizedDescription } = getLocalizedCompareMeta(
    modelA,
    modelB,
    canonicalSlug,
    locale
  );
  const bc = BREADCRUMB_LABELS[locale];
  const breadcrumbs = [
    { name: bc.home, url: buildLocalizedCanonical('/', locale) },
    { name: bc.compare, url: buildLocalizedCanonical('/compare/', locale) },
    { name: `${modelA.modelName} vs ${modelB.modelName}`, url: canonicalUrl },
  ];

  // Key pricing and mathematical differentials
  const inputDelta = Math.abs(modelA.inputPerM - modelB.inputPerM);
  const cheaperInputModel = modelA.inputPerM <= modelB.inputPerM ? modelA : modelB;
  const inputSavingsPct =
    Math.max(modelA.inputPerM, modelB.inputPerM) > 0
      ? Math.round((inputDelta / Math.max(modelA.inputPerM, modelB.inputPerM)) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* 1. Structured Data Schema (JSON-LD FAQPage, TechArticle & Breadcrumbs) */}
      <SchemaOrg
        type="compare"
        name={localizedTitle}
        description={localizedDescription}
        url={canonicalUrl}
        inLanguage={locale}
        faqs={faqs}
        breadcrumbs={breadcrumbs}
      />

      {/* 2. Breadcrumb Navigation for SEO Hierarchy */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-zinc-500 dark:text-zinc-400">
        <Link href={getLocalizedPath('/', locale)} className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
          {bc.home}
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-400 dark:text-zinc-600" />
        <Link href={getLocalizedPath('/compare/', locale)} className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
          {bc.compare}
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-400 dark:text-zinc-600" />
        <span className="text-zinc-800 dark:text-zinc-200 font-medium truncate">
          {modelA.modelName} vs {modelB.modelName}
        </span>
      </nav>

      {/* 3. Hero Header Section */}
      <header className="relative text-center max-w-4xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
          <Scale className="h-3.5 w-3.5" />
          <span>Verified 2026 API Rates • Prompt Caching &amp; Batch ROI</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:leading-tight">
          {modelA.modelName}{' '}
          <span className="text-zinc-400 dark:text-zinc-500 font-sans font-light">vs</span>{' '}
          {modelB.modelName}
        </h1>

        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          {data.description}
        </p>

        {/* Quick Executive Verdict Badge */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              {cheaperInputModel.modelName} saves up to {inputSavingsPct}% on base input tokens
            </span>
          </span>
        </div>
      </header>

      {/* P1-1 Bidirectional Migration Alert Banner for Carbon/Argon/o3-mini */}
      {(modelA.modelId === 'gemini-4-carbon' ||
        modelB.modelId === 'gemini-4-carbon' ||
        modelA.modelId === 'gemini-4-argon' ||
        modelB.modelId === 'gemini-4-argon' ||
        modelA.modelId === 'o3-mini' ||
        modelB.modelId === 'o3-mini') && (
        <div className="rounded-2xl border border-rose-500/35 bg-rose-50 dark:bg-rose-950/35 px-4 py-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5 text-xs sm:text-sm text-rose-900 dark:text-rose-200">
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong>Migration Alert:</strong> Gemini 4 Carbon &amp; Argon double from $2/$10 to $4/$20 on Dec 1 (and Azure o3/o4-mini retired Nov 19).
            </span>
          </div>
          <Link
            href={getLocalizedPath('/pricing/gemini-4-carbon-dec-1-migration-guide/', locale)}
            className="min-h-[38px] shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
          >
            <span>Read the Migration Playbook</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* 4. Side-by-Side Model Spec & Pricing Matrix */}
      <section aria-label="Side-by-Side Pricing Matrix">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Card Model A */}
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-6 backdrop-blur-md shadow-sm dark:shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200/80 dark:border-zinc-800">
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                    {modelA.providerOrg}
                  </span>
                  <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
                    {modelA.modelName}
                  </h3>
                </div>
                <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded">
                  {modelA.modelId}
                </span>
              </div>

              <dl className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-zinc-200/70 dark:border-zinc-800/50">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">Base Input Rate</dt>
                  <dd className="text-zinc-900 dark:text-zinc-100 font-bold">{formatPerMillionPrice(modelA.inputPerM)} / 1M</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/70 dark:border-zinc-800/50">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">Output Rate</dt>
                  <dd className="text-zinc-900 dark:text-zinc-100 font-bold">{formatPerMillionPrice(modelA.outputPerM)} / 1M</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/70 dark:border-zinc-800/50">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">Prompt Cache Read</dt>
                  <dd className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatPerMillionPrice(modelA.cachedInputPerM)} / 1M (-{modelA.cacheDiscountPercent}%)
                  </dd>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/70 dark:border-zinc-800/50">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">Cache Write Surcharge</dt>
                  <dd className="text-zinc-700 dark:text-zinc-300">
                    {modelA.cacheWritePerM ? `${formatPerMillionPrice(modelA.cacheWritePerM)} / 1M (+25%)` : '$0.00 (Free write)'}
                  </dd>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/70 dark:border-zinc-800/50">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">Batch API Discount</dt>
                  <dd className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {modelA.batchDiscountPercent > 0 ? `-${modelA.batchDiscountPercent}% Off` : 'Not Supported'}
                  </dd>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/70 dark:border-zinc-800/50">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">Context Window</dt>
                  <dd className="text-zinc-800 dark:text-zinc-200 font-sans">{(modelA.contextWindow / 1000).toLocaleString()}k tokens</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">Quality Index (AA / ELO)</dt>
                  <dd className="text-indigo-600 dark:text-indigo-300 font-bold">{formatQualityIndex(modelA)}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
              <Link
                href={getLocalizedPath(`/models/${modelA.modelId}/`, locale)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium"
              >
                Inspect Full Specs →
              </Link>
              {modelA.affiliateUrl && (
                <TrackedAffiliateLink
                  href={modelA.affiliateUrl}
                  modelId={modelA.modelId}
                  pageType="compare_detail"
                  locale={locale}
                  placement="compare_card_a_cta"
                  compareSlug={canonicalSlug}
                  provider="openrouter"
                  includeRef={true}
                  className="min-h-[36px] sm:min-h-[32px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-indigo-500/35 dark:border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white hover:border-indigo-600 shadow-sm shadow-indigo-500/5 hover:shadow-indigo-500/20 transition-all active:scale-[0.98] whitespace-nowrap"
                >
                  <span>Connect API</span>
                  <ExternalLink className="h-3 w-3" />
                </TrackedAffiliateLink>
              )}
            </div>
          </div>

          {/* Card Model B */}
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-6 backdrop-blur-md shadow-sm dark:shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200/80 dark:border-zinc-800">
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                    {modelB.providerOrg}
                  </span>
                  <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
                    {modelB.modelName}
                  </h3>
                </div>
                <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded">
                  {modelB.modelId}
                </span>
              </div>

              <dl className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-zinc-200/70 dark:border-zinc-800/50">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">Base Input Rate</dt>
                  <dd className="text-zinc-900 dark:text-zinc-100 font-bold">{formatPerMillionPrice(modelB.inputPerM)} / 1M</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/70 dark:border-zinc-800/50">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">Output Rate</dt>
                  <dd className="text-zinc-900 dark:text-zinc-100 font-bold">{formatPerMillionPrice(modelB.outputPerM)} / 1M</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/70 dark:border-zinc-800/50">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">Prompt Cache Read</dt>
                  <dd className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatPerMillionPrice(modelB.cachedInputPerM)} / 1M (-{modelB.cacheDiscountPercent}%)
                  </dd>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/70 dark:border-zinc-800/50">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">Cache Write Surcharge</dt>
                  <dd className="text-zinc-700 dark:text-zinc-300">
                    {modelB.cacheWritePerM ? `${formatPerMillionPrice(modelB.cacheWritePerM)} / 1M (+25%)` : '$0.00 (Free write)'}
                  </dd>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/70 dark:border-zinc-800/50">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">Batch API Discount</dt>
                  <dd className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {modelB.batchDiscountPercent > 0 ? `-${modelB.batchDiscountPercent}% Off` : 'Not Supported'}
                  </dd>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/70 dark:border-zinc-800/50">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">Context Window</dt>
                  <dd className="text-zinc-800 dark:text-zinc-200 font-sans">{(modelB.contextWindow / 1000).toLocaleString()}k tokens</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">Quality Index (AA / ELO)</dt>
                  <dd className="text-indigo-600 dark:text-indigo-300 font-bold">{formatQualityIndex(modelB)}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
              <Link
                href={getLocalizedPath(`/models/${modelB.modelId}/`, locale)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium"
              >
                Inspect Full Specs →
              </Link>
              {modelB.affiliateUrl && (
                <TrackedAffiliateLink
                  href={modelB.affiliateUrl}
                  modelId={modelB.modelId}
                  pageType="compare_detail"
                  locale={locale}
                  placement="compare_card_b_cta"
                  compareSlug={canonicalSlug}
                  provider="openrouter"
                  includeRef={true}
                  className="min-h-[36px] sm:min-h-[32px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-indigo-500/35 dark:border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white hover:border-indigo-600 shadow-sm shadow-indigo-500/5 hover:shadow-indigo-500/20 transition-all active:scale-[0.98] whitespace-nowrap"
                >
                  <span>Connect API</span>
                  <ExternalLink className="h-3 w-3" />
                </TrackedAffiliateLink>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Server-Rendered Differential Module 1: Prompt Caching Surcharge & Discount Analysis */}
      <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-md shadow-sm dark:shadow-xl space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <Zap className="h-4 w-4" />
            <span>Differential Module 1</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Prompt Caching ROI &amp; Write Surcharge Break-Even Analysis
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Prompt caching drastically reduces input token costs for static prefixes like system prompts, tool schemas, and document chunks. Compare caching mechanisms between {modelA.modelName} and {modelB.modelName}:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 p-4 space-y-3">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-200 flex items-center justify-between">
              <span>{modelA.modelName} Caching Profile</span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">-{modelA.cacheDiscountPercent}% read discount</span>
            </h3>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc list-inside">
              <li><strong>Cached Read Price:</strong> {formatPerMillionPrice(modelA.cachedInputPerM)} per 1M tokens.</li>
              <li><strong>Write Surcharge:</strong> {modelA.cacheWritePerM ? `${formatPerMillionPrice(modelA.cacheWritePerM)}/1M (+25% fee on initial cache write)` : '$0.00 (automatic caching with zero write penalty)'}.</li>
              <li><strong>Minimum Cache Prefix:</strong> 1,024 tokens.</li>
              <li><strong>Amortization Rule:</strong> {modelA.cacheWritePerM ? 'Net cost savings begin when prefix is reused > 1.25 times within TTL.' : 'Immediate net savings from first cached read call.'}</li>
            </ul>
          </div>

          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 p-4 space-y-3">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-200 flex items-center justify-between">
              <span>{modelB.modelName} Caching Profile</span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">-{modelB.cacheDiscountPercent}% read discount</span>
            </h3>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc list-inside">
              <li><strong>Cached Read Price:</strong> {formatPerMillionPrice(modelB.cachedInputPerM)} per 1M tokens.</li>
              <li><strong>Write Surcharge:</strong> {modelB.cacheWritePerM ? `${formatPerMillionPrice(modelB.cacheWritePerM)}/1M (+25% fee on initial cache write)` : '$0.00 (automatic caching with zero write penalty)'}.</li>
              <li><strong>Minimum Cache Prefix:</strong> 1,024 tokens.</li>
              <li><strong>Amortization Rule:</strong> {modelB.cacheWritePerM ? 'Net cost savings begin when prefix is reused > 1.25 times within TTL.' : 'Immediate net savings from first cached read call.'}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. Server-Rendered Differential Module 2: Batch API 50% Off & SLA Analysis */}
      <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-md shadow-sm dark:shadow-xl space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            <Cpu className="h-4 w-4" />
            <span>Differential Module 2</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Batch API 50% Discount Offload vs Real-Time SLA
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Asynchronous Batch APIs cut total token expenditures in half (50% off input and output) in exchange for non-realtime execution (up to 24-hour turnaround SLA).
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-zinc-700 dark:text-zinc-300 font-sans border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden">
            <thead className="bg-zinc-100/80 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 font-semibold uppercase text-[10px] tracking-wider border-b border-zinc-200/80 dark:border-zinc-800">
              <tr>
                <th className="p-3">Model / Architecture</th>
                <th className="p-3">Standard Input / Output</th>
                <th className="p-3">Batch 50% Off Input / Output</th>
                <th className="p-3">Turnaround SLA</th>
                <th className="p-3">Optimal Use Cases</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/60 bg-white/50 dark:bg-zinc-900/40">
              <tr>
                <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">{modelA.modelName}</td>
                <td className="p-3 font-mono">{formatPerMillionPrice(modelA.inputPerM)} / {formatPerMillionPrice(modelA.outputPerM)}</td>
                <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {modelA.batchDiscountPercent > 0
                    ? `${formatPerMillionPrice(modelA.inputPerM * 0.5)} / ${formatPerMillionPrice(modelA.outputPerM * 0.5)} (-50%)`
                    : 'Standard on-demand rate'}
                </td>
                <td className="p-3 text-zinc-600 dark:text-zinc-400">{modelA.batchDiscountPercent > 0 ? '24 Hours max (typically 30m - 2h)' : 'Instant real-time'}</td>
                <td className="p-3 text-zinc-600 dark:text-zinc-400">Bulk evaluation, dataset labeling, background summarization</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">{modelB.modelName}</td>
                <td className="p-3 font-mono">{formatPerMillionPrice(modelB.inputPerM)} / {formatPerMillionPrice(modelB.outputPerM)}</td>
                <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {modelB.batchDiscountPercent > 0
                    ? `${formatPerMillionPrice(modelB.inputPerM * 0.5)} / ${formatPerMillionPrice(modelB.outputPerM * 0.5)} (-50%)`
                    : 'Standard on-demand rate'}
                </td>
                <td className="p-3 text-zinc-600 dark:text-zinc-400">{modelB.batchDiscountPercent > 0 ? '24 Hours max (typically 30m - 2h)' : 'Instant real-time'}</td>
                <td className="p-3 text-zinc-600 dark:text-zinc-400">Offline document translation, embedding backfills, test suites</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. Server-Rendered Differential Module 3: Long Context Window & Tiered Escalation Tax */}
      <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-md shadow-sm dark:shadow-xl space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4" />
            <span>Differential Module 3</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Context Window Escalation &amp; Tiered Pricing Architecture
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Massive context windows allow ingesting entire repositories or books, but pricing models differ drastically between flat-rate vendors and tiered step-up pricing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 p-4 space-y-2">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 block">{modelA.modelName} Context Capacity</span>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Provides a <strong>{(modelA.contextWindow / 1000).toLocaleString()}k token</strong> context window with a maximum output limit of <strong>{(modelA.maxOutputTokens / 1000).toLocaleString()}k tokens</strong>.
              {modelA.tierThreshold ? (
                <span className="block mt-2 text-amber-700 dark:text-amber-400 font-medium">
                  ⚠️ Note: Prompts exceeding {(modelA.tierThreshold / 1000).toLocaleString()}k tokens double in price to {formatPerMillionPrice(modelA.tierInputPerM ?? 0)}/1M in and {formatPerMillionPrice(modelA.tierOutputPerM ?? 0)}/1M out.
                </span>
              ) : (
                <span className="block mt-2 text-emerald-600 dark:text-emerald-400">
                  ✓ Flat-rate billing across all prompt sizes up to max context ceiling.
                </span>
              )}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 p-4 space-y-2">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 block">{modelB.modelName} Context Capacity</span>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Provides a <strong>{(modelB.contextWindow / 1000).toLocaleString()}k token</strong> context window with a maximum output limit of <strong>{(modelB.maxOutputTokens / 1000).toLocaleString()}k tokens</strong>.
              {modelB.tierThreshold ? (
                <span className="block mt-2 text-amber-700 dark:text-amber-400 font-medium">
                  ⚠️ Note: Prompts exceeding {(modelB.tierThreshold / 1000).toLocaleString()}k tokens double in price to {formatPerMillionPrice(modelB.tierInputPerM ?? 0)}/1M in and {formatPerMillionPrice(modelB.tierOutputPerM ?? 0)}/1M out.
                </span>
              ) : (
                <span className="block mt-2 text-emerald-600 dark:text-emerald-400">
                  ✓ Flat-rate billing across all prompt sizes up to max context ceiling.
                </span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* 8. Server-Rendered Differential Module 4 (Quill SEO Original Information): 3 Production Scenario Projections */}
      <section className="space-y-4" aria-label="Production Scenarios">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            <Bot className="h-4 w-4" />
            <span>Quill Strategic Content</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Real-World Production Scenarios: Monthly Spend Projections
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Pre-computed monthly engineering bill projections across 3 representative enterprise application workloads:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {scenarios.map((sc, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-5 backdrop-blur-md shadow-sm dark:shadow-xl flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase">
                  Scenario {idx + 1}
                </span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {sc.scenarioName}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {sc.description}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800 space-y-2 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-sans">{modelA.modelName}:</span>
                  <span className="text-zinc-900 dark:text-zinc-200 font-bold">${sc.costA.toFixed(2)}/mo</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-sans">{modelB.modelName}:</span>
                  <span className="text-zinc-900 dark:text-zinc-200 font-bold">${sc.costB.toFixed(2)}/mo</span>
                </div>
                <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800 flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Delta Savings:</span>
                  <span>-${sc.savingsAmount.toFixed(2)} ({sc.savingsPercent}%)</span>
                </div>
              </div>

              <div className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800">
                <span className="text-zinc-900 dark:text-zinc-200 font-semibold block mb-0.5">Architecture Verdict:</span>
                {sc.verdict}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Interactive Live Workload Simulator Client Component */}
      <section aria-label="Interactive Simulator">
        <CompareDetailClient
          modelA={modelA}
          modelB={modelB}
        />
      </section>

      {/* 10. Server-Rendered Pre-Indexed FAQ Accordion (Corresponding to FAQPage JSON-LD Schema) */}
      <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-md shadow-sm dark:shadow-xl space-y-6" aria-label="Frequently Asked Questions">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            <HelpCircle className="h-4 w-4" />
            <span>Developer FAQs</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Frequently Asked Questions: {modelA.modelName} vs {modelB.modelName}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Authoritative answers on API rate limits, pricing math, break-even thresholds, and architectural migration.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-4 space-y-2"
            >
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-mono">
                  {index + 1}
                </span>
                <span>{faq.question}</span>
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pl-7">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
