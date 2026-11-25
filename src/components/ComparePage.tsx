import ComparisonVerdict from "./ComparisonVerdict";
import PriceVerificationDate from "./PriceVerificationDate";
import { pricingDetailSeo, allowComparison, comparisonVerifiedAt, hasVerdict } from '@/lib/pricing-detail-seo';
import SubscribeBox from '@/components/SubscribeBox';
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getComparisonData,
} from '@/lib/models-data';
import SchemaOrg from '@/components/seo/SchemaOrg';
import TrackedAffiliateLink from '@/components/TrackedAffiliateLink';
import {
  buildLocalizedCanonical,
  getOgLocale,
  DEFAULT_OG_IMAGES,
  DEFAULT_OG_IMAGE_URL,
} from '@/lib/seo-alternates';
import { BREADCRUMB_LABELS, getLocalizedCompareMeta } from '@/lib/detail-seo';
import { getLocalizedPath, getTranslation } from '@/i18n';
import { Locale } from '@/i18n/types';
import { formatPerMillionPrice } from '@/lib/utils';
import { ModelPricingRule } from '@/types/pricing';

function formatQualityIndex(m: ModelPricingRule, missing: string): string {
  if (m.benchmarks?.intelligenceIndex != null) return `AA ${m.benchmarks.intelligenceIndex.toFixed(1)}`;
  if (m.benchmarks?.arenaElo != null) return `Elo ${m.benchmarks.arenaElo}`;
  if (m.benchmarks?.codingIndex != null) {
    return m.benchmarks.codingIndex <= 100 ? `Code ${m.benchmarks.codingIndex}%` : `Code ${m.benchmarks.codingIndex}`;
  }
  return missing;
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

export function buildCompareMetadata(slug: string, locale: Locale = 'en'): Metadata {
  const data = getComparisonData(slug);
  if (!data) {
    const { detail } = getTranslation(locale);
    const { alternates, robots } = pricingDetailSeo(`/compare/${slug}/`, locale, false);
    return {
      title: `${detail.unavailablePair} | TokenCosts AI`,
      description: detail.unavailablePairBody,
      alternates,
      robots,
    };
  }

  const { title, description, keywords } = getLocalizedCompareMeta(
    data.modelA,
    data.modelB,
    data.canonicalSlug,
    locale
  );
  const canonicalSlug = data.canonicalSlug;
  const { alternates, robots, alternateLocale } = pricingDetailSeo(`/compare/${canonicalSlug}/`, locale, slug === canonicalSlug && allowComparison(canonicalSlug));

  return {
    title,
    description,
    keywords,
    alternates,
    robots,
    openGraph: {
      title,
      description,
      type: 'article',
      locale: getOgLocale(locale),
      alternateLocale,
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

export default function ComparePage({
  params,
  locale = 'en',
}: {
  params: { slug: string };
  locale?: Locale;
}) {
  const { detail, growth } = getTranslation(locale);
  const benchmarkMissing = growth.noBenchmark;
  const data = getComparisonData(params.slug);

  if (!data) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 px-4 py-16">
        <h1 className="text-2xl font-semibold">{detail.unavailablePair}</h1>
        <p>{detail.unavailablePairBody}</p>
        <Link className="text-indigo-700 underline dark:text-indigo-300" href={getLocalizedPath('/compare/', locale)}>
          {getTranslation(locale).nav.compare}
        </Link>
      </section>
    );
  }

  const { modelA, modelB, canonicalSlug, scenarios } = data;
  const describe = (template: string, a: string, b: string) => template
    .replace('{a}', modelA.modelName).replace('{b}', modelB.modelName).replace('{ap}', a).replace('{bp}', b);
  const rates = (model: ModelPricingRule) => `${formatPerMillionPrice(model.inputPerM)} / ${formatPerMillionPrice(model.outputPerM)}`;
  const faqs = locale !== 'zh-CN' ? data.faqs : [
    { question: detail.faqPriceQ, answer: describe(detail.faqPriceA, rates(modelA), rates(modelB)) },
    { question: detail.faqCacheQ, answer: describe(detail.faqCacheA, formatPerMillionPrice(modelA.cachedInputPerM), formatPerMillionPrice(modelB.cachedInputPerM)) },
    { question: detail.faqContextQ, answer: describe(detail.faqContextA, modelA.contextWindow.toLocaleString(locale), modelB.contextWindow.toLocaleString(locale)) },
  ];

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
      <nav aria-label={detail.breadcrumb} className="flex items-center space-x-2 text-xs text-zinc-500 dark:text-zinc-400">
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
          <span>{detail.compareBadge}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:leading-tight">
          {modelA.modelName}{' '}
          <span className="text-zinc-400 dark:text-zinc-500 font-sans font-light">vs</span>{' '}
          {modelB.modelName}
        </h1>

        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          {locale === 'zh-CN' ? localizedDescription : data.description}
        </p>
        <PriceVerificationDate date={comparisonVerifiedAt(modelA.modelId, modelB.modelId)} locale={locale} />

        {hasVerdict(canonicalSlug) && scenarios[0] && <ComparisonVerdict
        a={modelA} b={modelB} costA={scenarios[0].costA} costB={scenarios[0].costB} locale={locale} />}

      {/* Quick Executive Verdict Badge */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              {detail.inputAdvantage.replace('{model}', cheaperInputModel.modelName).replace('{percent}', String(inputSavingsPct))}
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
              {detail.migrationNote}
            </span>
          </div>
          <Link
            href={getLocalizedPath('/pricing/gemini-4-carbon-dec-1-migration-guide/', locale)}
            className="min-h-[38px] shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
          >
            <span>{detail.migration}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* 4. Side-by-Side Model Spec & Pricing Matrix */}
      <section aria-label={getTranslation(locale).compare.directPricingTitle}>
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
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">{detail.input}</dt>
                  <dd className="text-zinc-900 dark:text-zinc-100 font-bold">{formatPerMillionPrice(modelA.inputPerM)} / 1M</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/70 dark:border-zinc-800/50">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">{detail.output}</dt>
                  <dd className="text-zinc-900 dark:text-zinc-100 font-bold">{formatPerMillionPrice(modelA.outputPerM)} / 1M</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/70 dark:border-zinc-800/50">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">{detail.cache}</dt>
                  <dd className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatPerMillionPrice(modelA.cachedInputPerM)} / 1M (-{modelA.cacheDiscountPercent}%)
                  </dd>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/70 dark:border-zinc-800/50">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">{detail.cacheWrite}</dt>
                  <dd className="text-zinc-700 dark:text-zinc-300">
                    {modelA.cacheWritePerM != null ? `${formatPerMillionPrice(modelA.cacheWritePerM)} / 1M` : detail.noWrite}
                  </dd>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/70 dark:border-zinc-800/50">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">{detail.batch}</dt>
                  <dd className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {modelA.batchDiscountPercent > 0 ? `-${modelA.batchDiscountPercent}% ${detail.discount}` : detail.missing}
                  </dd>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/70 dark:border-zinc-800/50">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">{detail.context}</dt>
                  <dd className="text-zinc-800 dark:text-zinc-200 font-sans">{(modelA.contextWindow / 1000).toLocaleString()}k tokens</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">{detail.quality}</dt>
                  <dd className="text-indigo-600 dark:text-indigo-300 font-bold">{formatQualityIndex(modelA, benchmarkMissing)}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
              <Link
                href={getLocalizedPath(`/models/${modelA.modelId}/`, locale)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium"
              >
                {detail.specs}
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
                  <span>{detail.connect}</span>
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
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">{detail.input}</dt>
                  <dd className="text-zinc-900 dark:text-zinc-100 font-bold">{formatPerMillionPrice(modelB.inputPerM)} / 1M</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/70 dark:border-zinc-800/50">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">{detail.output}</dt>
                  <dd className="text-zinc-900 dark:text-zinc-100 font-bold">{formatPerMillionPrice(modelB.outputPerM)} / 1M</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/70 dark:border-zinc-800/50">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">{detail.cache}</dt>
                  <dd className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatPerMillionPrice(modelB.cachedInputPerM)} / 1M (-{modelB.cacheDiscountPercent}%)
                  </dd>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/70 dark:border-zinc-800/50">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">{detail.cacheWrite}</dt>
                  <dd className="text-zinc-700 dark:text-zinc-300">
                    {modelB.cacheWritePerM != null ? `${formatPerMillionPrice(modelB.cacheWritePerM)} / 1M` : detail.noWrite}
                  </dd>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/70 dark:border-zinc-800/50">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">{detail.batch}</dt>
                  <dd className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {modelB.batchDiscountPercent > 0 ? `-${modelB.batchDiscountPercent}% ${detail.discount}` : detail.missing}
                  </dd>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/70 dark:border-zinc-800/50">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">{detail.context}</dt>
                  <dd className="text-zinc-800 dark:text-zinc-200 font-sans">{(modelB.contextWindow / 1000).toLocaleString()}k tokens</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-sans">{detail.quality}</dt>
                  <dd className="text-indigo-600 dark:text-indigo-300 font-bold">{formatQualityIndex(modelB, benchmarkMissing)}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
              <Link
                href={getLocalizedPath(`/models/${modelB.modelId}/`, locale)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium"
              >
                {detail.specs}
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
                  <span>{detail.connect}</span>
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
            <span>{detail.cachePricing}</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {detail.cacheTitle}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {detail.cacheDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 p-4 space-y-3">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-200 flex items-center justify-between">
              <span>{modelA.modelName} · {detail.cacheProfile}</span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">-{modelA.cacheDiscountPercent}% {detail.readDiscount}</span>
            </h3>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc list-inside">
              <li><strong>{detail.cache}</strong> {formatPerMillionPrice(modelA.cachedInputPerM)} {detail.priceUnit}.</li>
              <li><strong>{detail.cacheWrite}</strong> {modelA.cacheWritePerM != null ? formatPerMillionPrice(modelA.cacheWritePerM) : detail.noWrite}.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 p-4 space-y-3">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-200 flex items-center justify-between">
              <span>{modelB.modelName} · {detail.cacheProfile}</span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">-{modelB.cacheDiscountPercent}% {detail.readDiscount}</span>
            </h3>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc list-inside">
              <li><strong>{detail.cache}</strong> {formatPerMillionPrice(modelB.cachedInputPerM)} {detail.priceUnit}.</li>
              <li><strong>{detail.cacheWrite}</strong> {modelB.cacheWritePerM != null ? formatPerMillionPrice(modelB.cacheWritePerM) : detail.noWrite}.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. Server-Rendered Differential Module 2: Batch API 50% Off & SLA Analysis */}
      <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-md shadow-sm dark:shadow-xl space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            <Cpu className="h-4 w-4" />
            <span>{detail.batch}</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {detail.batchTitle}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {detail.batchDesc}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-zinc-700 dark:text-zinc-300 font-sans border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden">
            <thead className="bg-zinc-100/80 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 font-semibold uppercase text-[10px] tracking-wider border-b border-zinc-200/80 dark:border-zinc-800">
              <tr>
                <th className="p-3">{detail.model}</th>
                <th className="p-3">{detail.standard}</th>
                <th className="p-3">{detail.batchRates}</th>
                <th className="p-3">{detail.delivery}</th>
                <th className="p-3">{detail.use}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/60 bg-white/50 dark:bg-zinc-900/40">
              <tr>
                <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">{modelA.modelName}</td>
                <td className="p-3 font-mono">{formatPerMillionPrice(modelA.inputPerM)} / {formatPerMillionPrice(modelA.outputPerM)}</td>
                <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {modelA.batchDiscountPercent > 0
                    ? `${formatPerMillionPrice(modelA.inputPerM * (1 - modelA.batchDiscountPercent / 100))} / ${formatPerMillionPrice(modelA.outputPerM * (1 - modelA.batchDiscountPercent / 100))} (-${modelA.batchDiscountPercent}%)`
                    : detail.standardOnly}
                </td>
                <td className="p-3 text-zinc-600 dark:text-zinc-400">{modelA.batchDiscountPercent > 0 ? detail.async : detail.realtime}</td>
                <td className="p-3 text-zinc-600 dark:text-zinc-400">{detail.bulkUse}</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">{modelB.modelName}</td>
                <td className="p-3 font-mono">{formatPerMillionPrice(modelB.inputPerM)} / {formatPerMillionPrice(modelB.outputPerM)}</td>
                <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {modelB.batchDiscountPercent > 0
                    ? `${formatPerMillionPrice(modelB.inputPerM * (1 - modelB.batchDiscountPercent / 100))} / ${formatPerMillionPrice(modelB.outputPerM * (1 - modelB.batchDiscountPercent / 100))} (-${modelB.batchDiscountPercent}%)`
                    : detail.standardOnly}
                </td>
                <td className="p-3 text-zinc-600 dark:text-zinc-400">{modelB.batchDiscountPercent > 0 ? detail.async : detail.realtime}</td>
                <td className="p-3 text-zinc-600 dark:text-zinc-400">{detail.offlineUse}</td>
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
            <span>{detail.context}</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {detail.tierTitle}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {detail.tierDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 p-4 space-y-2">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 block">{detail.contextCapacity.replace('{model}', modelA.modelName)}</span>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {detail.contextSpec.replace('{context}', modelA.contextWindow.toLocaleString()).replace('{output}', modelA.maxOutputTokens.toLocaleString())}
              {modelA.tierThreshold ? (
                <span className="block mt-2 text-amber-700 dark:text-amber-400 font-medium">
                  {detail.tierSpec.replace('{threshold}', modelA.tierThreshold.toLocaleString()).replace('{input}', formatPerMillionPrice(modelA.tierInputPerM ?? modelA.inputPerM)).replace('{output}', formatPerMillionPrice(modelA.tierOutputPerM ?? modelA.outputPerM))}
                </span>
              ) : (
                <span className="block mt-2 text-emerald-600 dark:text-emerald-400">
                  {detail.flat}
                </span>
              )}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 p-4 space-y-2">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 block">{detail.contextCapacity.replace('{model}', modelB.modelName)}</span>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {detail.contextSpec.replace('{context}', modelB.contextWindow.toLocaleString()).replace('{output}', modelB.maxOutputTokens.toLocaleString())}
              {modelB.tierThreshold ? (
                <span className="block mt-2 text-amber-700 dark:text-amber-400 font-medium">
                  {detail.tierSpec.replace('{threshold}', modelB.tierThreshold.toLocaleString()).replace('{input}', formatPerMillionPrice(modelB.tierInputPerM ?? modelB.inputPerM)).replace('{output}', formatPerMillionPrice(modelB.tierOutputPerM ?? modelB.outputPerM))}
                </span>
              ) : (
                <span className="block mt-2 text-emerald-600 dark:text-emerald-400">
                  {detail.flat}
                </span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* 8. Server-Rendered Differential Module 4 (Quill SEO Original Information): 3 Production Scenario Projections */}
      <section className="space-y-4" aria-label={detail.scenarios}>
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            <Bot className="h-4 w-4" />
            <span>{detail.scenarios}</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {detail.monthlyCosts}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            {detail.scenarioIntro}
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
                  {detail.caseLabel.replace('{number}', String(idx + 1))}
                </span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {[detail.caseRag, detail.caseAgent, detail.caseExtract][idx] ?? sc.scenarioName}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {detail.workload.replace('{requests}', sc.monthlyRequests.toLocaleString())
                    .replace('{input}', sc.inputTokens.toLocaleString()).replace('{output}', sc.outputTokens.toLocaleString())
                    .replace('{cache}', String(sc.cacheHitRate * 100)).replace('{batch}', String(sc.batchRate * 100))}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800 space-y-2 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-sans">{modelA.modelName}:</span>
                  <span className="text-zinc-900 dark:text-zinc-200 font-bold">${sc.costA.toFixed(2)} {getTranslation(locale).common.monthly}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-sans">{modelB.modelName}:</span>
                  <span className="text-zinc-900 dark:text-zinc-200 font-bold">${sc.costB.toFixed(2)} {getTranslation(locale).common.monthly}</span>
                </div>
                <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800 flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>{detail.difference}</span>
                  <span>-${sc.savingsAmount.toFixed(2)} ({sc.savingsPercent}%)</span>
                </div>
              </div>

              <div className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800">
                <span className="text-zinc-900 dark:text-zinc-200 font-semibold block mb-0.5">{detail.result}</span>
                {sc.savingsAmount === 0 ? detail.tie : detail.lowerCase.replace('{model}', sc.recommendedModel).replace('{savings}', formatPerMillionPrice(sc.savingsAmount))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Interactive Live Workload Simulator Client Component */}
      <section aria-label={getTranslation(locale).compare.interactiveEngine}>
        <CompareDetailClient
          modelA={modelA}
          modelB={modelB}
        />
      </section>

      {/* 10. Server-Rendered Pre-Indexed FAQ Accordion (Corresponding to FAQPage JSON-LD Schema) */}
      <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-md shadow-sm dark:shadow-xl space-y-6" aria-label={detail.faq}>
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            <HelpCircle className="h-4 w-4" />
            <span>{detail.faq}</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {detail.faq} · {modelA.modelName} vs {modelB.modelName}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            {detail.faqIntro}
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
      <SubscribeBox key={params.slug} placement="compare" models={[modelA, modelB].map(model => ({ id: model.modelId, name: model.modelName }))} />
    </div>
  );
}
