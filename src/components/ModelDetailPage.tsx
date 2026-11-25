import PriceVerificationDate from "@/components/PriceVerificationDate";
import { pricingDetailSeo, priceVerifiedAt, decodePricingModelId, isIndexablePricingModel } from '@/lib/pricing-detail-seo';
import SubscribeBox from '@/components/SubscribeBox';
import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MODELS_DATA, TIER1_MODELS, compareHref } from '@/lib/models-data';
import { HARNESS_TOOLS, getRecommendedHarnessesForModel } from '@/lib/harness-data';
import { ExternalLink, ArrowRight, ChevronLeft, Sparkles, Terminal, Calculator } from 'lucide-react';
import Link from 'next/link';
import SchemaOrg from '@/components/seo/SchemaOrg';
import TrackedAffiliateLink from '@/components/TrackedAffiliateLink';
import {
  buildLocalizedCanonical,
  getOgLocale,
  DEFAULT_OG_IMAGES,
  DEFAULT_OG_IMAGE_URL,
} from '@/lib/seo-alternates';
import { BREADCRUMB_LABELS, getLocalizedModelMeta } from '@/lib/detail-seo';
import { getLocalizedPath, getTranslation } from '@/i18n';
import { Locale } from '@/i18n/types';
import { formatPerMillionPrice } from '@/lib/utils';

export function buildModelMetadata(id: string, locale: Locale = 'en'): Metadata {
  const model = MODELS_DATA.find((m) => m.modelId === decodePricingModelId(id));
  if (!model) {
    return {
      title: 'Model Not Found | TokenCosts AI',
      description: 'The requested AI model pricing profile could not be found.',
    };
  }

  const { title, description, keywords } = getLocalizedModelMeta(model, locale);
  const { alternates, robots, alternateLocale } = pricingDetailSeo(`/models/${model.modelId}/`, locale, isIndexablePricingModel(model.modelId));

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

export default function ModelDetailPage({
  params,
  locale = 'en',
}: {
  params: { id: string };
  locale?: Locale;
}) {
  const detail = getTranslation(locale).detail;
  const model = MODELS_DATA.find((m) => m.modelId === decodePricingModelId(params.id));

  if (!model) {
    return notFound();
  }

  const tier1Siblings = TIER1_MODELS.filter((id) => id !== model.modelId)
    .map((id) => MODELS_DATA.find((m) => m.modelId === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .sort(
      (a, b) =>
        Math.abs(a.inputPerM - model.inputPerM) -
        Math.abs(b.inputPerM - model.inputPerM)
    );
  const isTier1Model = TIER1_MODELS.includes(model.modelId);
  const featuredSiblings = tier1Siblings.slice(0, isTier1Model ? 8 : 4);
  const restSiblings = isTier1Model ? tier1Siblings.slice(8) : [];
  const recommendedHarnesses = getRecommendedHarnessesForModel(model.modelId);

  const canonicalUrl = buildLocalizedCanonical(`/models/${model.modelId}/`, locale);
  const { title: localizedTitle, description: localizedDescription } = getLocalizedModelMeta(model, locale);
  const bc = BREADCRUMB_LABELS[locale];
  const breadcrumbs = [
    { name: bc.home, url: buildLocalizedCanonical('/', locale) },
    { name: bc.models, url: buildLocalizedCanonical('/models/', locale) },
    { name: model.modelName, url: canonicalUrl },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <SchemaOrg
        type="model"
        name={localizedTitle}
        description={locale === 'zh-CN' ? localizedDescription : model.notes || localizedDescription}
        url={canonicalUrl}
        inLanguage={locale}
        modelOffer={{
          price: String(model.inputPerM),
          provider: model.providerOrg,
          contextWindow: model.contextWindow,
        }}
        breadcrumbs={breadcrumbs}
      />

      {/* Back button */}
      <div>
        <Link
          href={getLocalizedPath('/models/', locale)}
          className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{detail.backModels}</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-md shadow-sm dark:shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="rounded-md bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                {model.providerOrg}
              </span>
              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                {model.modelId}
              </span>
              {model.isFrontier && (
                <span className="rounded-md bg-indigo-500/15 dark:bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>{detail.frontier}</span>
                </span>
              )}
              {model.isSponsored && (
                <span className="rounded-md bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  {detail.partnerFeature}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              {detail.modelPriceHeading.replace('{model}', model.modelName)}
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <Link
              href={getLocalizedPath(`/calculator/${model.modelId}/`, locale)}
              className="min-h-[40px] w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-[0.98] whitespace-nowrap"
            >
              <Calculator className="h-3.5 w-3.5" />
              <span>{detail.roi}</span>
            </Link>

            <TrackedAffiliateLink
              href={model.officialDocUrl}
              modelId={model.modelId}
              pageType="model_detail"
              locale={locale}
              placement="model_hero_official_docs"
              includeRef={false}
              rel="noopener noreferrer"
              className="min-h-[40px] w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-[0.98] whitespace-nowrap"
            >
              <span>{detail.official}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </TrackedAffiliateLink>

            {model.affiliateUrl && (
              <TrackedAffiliateLink
                href={model.affiliateUrl}
                modelId={model.modelId}
                pageType="model_detail"
                locale={locale}
                placement="model_hero_openrouter_cta"
                provider="openrouter"
                includeRef={true}
                className="min-h-[40px] w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm shadow-indigo-500/25 transition-all active:scale-[0.98] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
              >
                <span>{detail.openrouter}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </TrackedAffiliateLink>
            )}
          </div>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-4 leading-relaxed">
          {locale === 'zh-CN' ? localizedDescription : model.notes}
        </p>
        <PriceVerificationDate date={priceVerifiedAt(model.modelId)} locale={locale} />

        {/* Core Pricing Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800/80 font-mono">
            <span className="text-[10px] uppercase text-zinc-500 block font-sans">
              {detail.input}
            </span>
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {formatPerMillionPrice(model.inputPerM)}
            </span>
            <span className="text-[11px] text-zinc-500 block mt-0.5">{detail.perMillion}</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800/80 font-mono">
            <span className="text-[10px] uppercase text-zinc-500 block font-sans">
              {detail.output}
            </span>
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {formatPerMillionPrice(model.outputPerM)}
            </span>
            <span className="text-[11px] text-zinc-500 block mt-0.5">{detail.perMillion}</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-emerald-500/25 font-mono">
            <span className="text-[10px] uppercase text-emerald-700 dark:text-emerald-400 block font-sans font-medium">
              {detail.cache}
            </span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatPerMillionPrice(model.cachedInputPerM)}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-500 block mt-0.5">
              -{model.cacheDiscountPercent}% {detail.discount}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-indigo-500/25 font-mono">
            <span className="text-[10px] uppercase text-indigo-700 dark:text-indigo-400 block font-sans font-medium">
              {detail.batch}
            </span>
            <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
              {model.batchDiscountPercent > 0 ? `-${model.batchDiscountPercent}%` : detail.missing}
            </span>
            <span className="text-[11px] text-zinc-500 block mt-0.5">{detail.asyncBatch}</span>
          </div>
        </div>
      </div>

      {/* Recommended Coding Agents & Harnesses Cross-Link Widget */}
      {recommendedHarnesses.length > 0 && (
        <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-5 sm:p-6 backdrop-blur-md shadow-sm dark:shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {detail.harness}
              </h2>
            </div>
            <Link
              href={getLocalizedPath('/harness/', locale)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 inline-flex items-center gap-1 transition-colors"
            >
              <span>{detail.compareHarness.replace('{count}', String(HARNESS_TOOLS.length))}</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedHarnesses.map(({ tool, matchType }) => {
              const formLabel =
                tool.category === 'cli-agent'
                  ? 'CLI'
                  : tool.category === 'ai-ide'
                  ? 'IDE'
                  : detail.plugin;
              const hitMin = tool.promptCachingSupport.hitRateRangePercent?.[0] ?? 70;
              const hitMax = tool.promptCachingSupport.hitRateRangePercent?.[1] ?? 85;
              const avgHit = Math.round((hitMin + hitMax) / 2);

              return (
                <div
                  key={tool.slug}
                  className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-4 flex flex-col justify-between gap-3 hover:border-indigo-500/50 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {tool.name}
                      </span>
                      <span className="rounded bg-zinc-200/80 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
                        {formLabel}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        matchType === 'Native'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                      }`}
                    >
                      {matchType === 'Native' ? detail.native : detail.gateway}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">{detail.multiplier}</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {tool.tokenMultiplierMin.toFixed(1)}x – {tool.tokenMultiplierMax.toFixed(1)}x
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">{detail.cacheMatch}</span>
                      <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                        ~{avgHit}% {detail.hit}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={getLocalizedPath(`/harness/${tool.slug}/`, locale)}
                    className="min-h-[36px] inline-flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                  >
                    {detail.setup}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Hosting Alternatives and Aggregators Table */}
      {model.hostedProviders && model.hostedProviders.length > 0 && (
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-6 backdrop-blur-md shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {detail.providers}
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                {detail.providersDesc}
              </p>
            </div>
            <span className="text-[11px] text-zinc-500">{detail.rateSource}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                  <th className="py-2.5 px-3">{detail.providerName}</th>
                  <th className="py-2.5 px-3">{detail.inputMillion}</th>
                  <th className="py-2.5 px-3">{detail.outputMillion}</th>
                  <th className="py-2.5 px-3">{detail.cached}</th>
                  <th className="py-2.5 px-3 text-right">{detail.access}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/60 font-mono text-zinc-700 dark:text-zinc-300">
                {model.hostedProviders.map((hp) => {
                  const isOpenRouterRow = hp.affiliateUrl.toLowerCase().includes('openrouter.ai');
                  const rowCampaign = `${model.modelId}_${hp.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
                  return (
                    <tr key={hp.name.endsWith(' Direct') ? detail.officialProvider.replace('{provider}', hp.name.slice(0,-7)) : hp.name} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                      <td className="py-3 px-3 font-sans font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <span>{hp.name.endsWith(' Direct') ? detail.officialProvider.replace('{provider}', hp.name.slice(0,-7)) : hp.name}</span>
                        {hp.isSponsored && (
                          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-700 dark:text-amber-400 border border-amber-500/20 font-medium">
                            {detail.partner}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">{formatPerMillionPrice(hp.inputPerM)}</td>
                      <td className="py-3 px-3">{formatPerMillionPrice(hp.outputPerM)}</td>
                      <td className="py-3 px-3 font-sans">
                        {hp.supportsCaching ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">{detail.supported}</span>
                        ) : (
                          <span className="text-zinc-500">{detail.missing}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-sans">
                        <TrackedAffiliateLink
                          href={hp.affiliateUrl}
                          modelId={model.modelId}
                          pageType="model_detail"
                          locale={locale}
                          placement="model_hosted_table_row"
                          campaign={rowCampaign}
                          includeRef={isOpenRouterRow}
                          className="min-h-[36px] sm:min-h-[32px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-indigo-500/35 dark:border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white hover:border-indigo-600 shadow-sm shadow-indigo-500/5 hover:shadow-indigo-500/20 transition-all active:scale-[0.98] whitespace-nowrap"
                        >
                          <span>{detail.connect}</span>
                          <ExternalLink className="h-3 w-3" />
                        </TrackedAffiliateLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Versus Comparisons Quick Matrix */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-6 backdrop-blur-md shadow-sm dark:shadow-xl space-y-4">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
          {detail.comparisonMatrix.replace('{model}', model.modelName)}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {featuredSiblings.map((other) => {
            const rawHref = compareHref(model.modelId, other.modelId);
            const localizedHref = getLocalizedPath(rawHref, locale);
            return (
              <Link
                key={other.modelId}
                href={localizedHref}
                rel={rawHref.startsWith('/compare/view/') ? 'nofollow' : undefined}
                className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/50 hover:border-indigo-500/50 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 transition-all flex items-center justify-between group"
              >
                <div>
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                    {model.modelName} vs {other.modelName}
                  </span>
                  <span className="text-[11px] text-zinc-500 block font-mono">
                    {formatPerMillionPrice(model.inputPerM)}/M vs {formatPerMillionPrice(other.inputPerM)}/M
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400 dark:text-zinc-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </Link>
            );
          })}
        </div>

        {restSiblings.length > 0 && (
          <div className="pt-1">
            <p className="text-xs font-semibold text-zinc-500 mb-2">
              {detail.moreComparisons.replace('{model}', model.modelName)}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {restSiblings.map((other) => {
                const rawHref = compareHref(model.modelId, other.modelId);
                return (
                  <Link
                    key={other.modelId}
                    href={getLocalizedPath(rawHref, locale)}
                    rel={rawHref.startsWith('/compare/view/') ? 'nofollow' : undefined}
                    className="rounded-md border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/50 px-2 py-1 text-[11px] text-zinc-600 dark:text-zinc-400 hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                  >
                    vs {other.modelName}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <SubscribeBox key={params.id} placement="model" models={[{ id: model.modelId, name: model.modelName }]} />
    </div>
  );
}
