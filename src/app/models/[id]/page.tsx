import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MODELS_DATA, TIER1_MODELS, compareHref } from '@/lib/models-data';
import { getRecommendedHarnessesForModel } from '@/lib/harness-data';
import { ExternalLink, ArrowRight, ChevronLeft, Sparkles, Terminal } from 'lucide-react';
import Link from 'next/link';
import SchemaOrg from '@/components/seo/SchemaOrg';
import {
  buildAlternates,
  DEFAULT_OG_IMAGES,
  DEFAULT_OG_IMAGE_URL,
} from '@/lib/seo-alternates';
import { Locale } from '@/i18n/types';

export async function generateStaticParams() {
  return MODELS_DATA.map((m) => ({
    id: m.modelId,
  }));
}

export function buildModelMetadata(id: string, locale: Locale = 'en'): Metadata {
  const model = MODELS_DATA.find((m) => m.modelId === id);
  if (!model) {
    return {
      title: 'Model Not Found | TokenCosts AI',
      description: 'The requested AI model pricing profile could not be found.',
    };
  }

  const title = `${model.modelName} API Pricing & Prompt Caching (2026) | TokenCosts AI`;
  const description = `Official token rates for ${model.modelName} (${model.providerOrg}): ${model.inputPerM}/1M input, ${model.outputPerM}/1M output. Cached prompt reads at ${model.cachedInputPerM}/1M (${model.cacheDiscountPercent}% discount). Context window: ${(model.contextWindow / 1000).toLocaleString()}k tokens.`;
  const alternates = buildAlternates(`/models/${model.modelId}/`, locale);

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      type: 'article',
      url: alternates.canonical,
      siteName: 'TokenCosts AI',
      images: DEFAULT_OG_IMAGES,
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [DEFAULT_OG_IMAGE_URL],
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return buildModelMetadata(params.id, 'en');
}

export default function ModelDetailPage({ params }: { params: { id: string } }) {
  const model = MODELS_DATA.find((m) => m.modelId === params.id);

  if (!model) {
    return notFound();
  }

  // Related models for comparison
  // 与 Tier-1 名单内其他模型的对比（按价格接近度排序，优先展示最相关的）
  const tier1Siblings = TIER1_MODELS.filter((id) => id !== model.modelId)
    .map((id) => MODELS_DATA.find((m) => m.modelId === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .sort(
      (a, b) =>
        Math.abs(a.inputPerM - model.inputPerM) -
        Math.abs(b.inputPerM - model.inputPerM)
    );
  const isTier1Model = TIER1_MODELS.includes(model.modelId);
  // Tier-1 模型：全部兄弟页都是可索引的静态页，可以多链
  // 非 Tier-1 模型：链出去的组合只有兜底页（noindex），控制数量避免浪费抓取预算
  const featuredSiblings = tier1Siblings.slice(0, isTier1Model ? 8 : 4);
  const restSiblings = isTier1Model ? tier1Siblings.slice(8) : [];
  const recommendedHarnesses = getRecommendedHarnessesForModel(model.modelId);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <SchemaOrg
        type="model"
        name={`${model.modelName} API Pricing & Prompt Caching Rates`}
        description={model.notes}
        url={`https://tokencostsai.com/models/${model.modelId}/`}
      />

      {/* Back button */}
      <div>
        <Link
          href="/models"
          className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Models Directory</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-md shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="rounded-md bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                {model.providerOrg}
              </span>
              <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-400">
                {model.modelId}
              </span>
              {model.isFrontier && (
                <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>2026 Frontier</span>
                </span>
              )}
              {model.isSponsored && (
                <span className="rounded-md bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
                  Featured Partner
                </span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100">
              {model.modelName} API Pricing
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={model.officialDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <span>Official Pricing</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {model.affiliateUrl && (
              <a
                href={model.affiliateUrl}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm shadow-indigo-500/20 transition-all inline-flex items-center gap-1.5 active:scale-[0.98]"
              >
                <span>Call via OpenRouter</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        <p className="text-sm text-zinc-300 mt-4 leading-relaxed">
          {model.notes}
        </p>

        {/* Core Pricing Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 font-mono">
            <span className="text-[10px] uppercase text-zinc-500 block font-sans">
              Base Input Price
            </span>
            <span className="text-xl font-bold text-zinc-100">
              ${model.inputPerM.toFixed(model.inputPerM < 0.1 ? 3 : 2)}
            </span>
            <span className="text-[11px] text-zinc-500 block mt-0.5">/ 1M tokens</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 font-mono">
            <span className="text-[10px] uppercase text-zinc-500 block font-sans">
              Base Output Price
            </span>
            <span className="text-xl font-bold text-zinc-100">
              ${model.outputPerM.toFixed(model.outputPerM < 0.1 ? 3 : 2)}
            </span>
            <span className="text-[11px] text-zinc-500 block mt-0.5">/ 1M tokens</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/70 border border-emerald-500/20 font-mono">
            <span className="text-[10px] uppercase text-emerald-400 block font-sans font-medium">
              Prompt Cache Read
            </span>
            <span className="text-xl font-bold text-emerald-400">
              ${model.cachedInputPerM.toFixed(3)}
            </span>
            <span className="text-[11px] text-emerald-500 block mt-0.5">
              -{model.cacheDiscountPercent}% discount
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/70 border border-indigo-500/20 font-mono">
            <span className="text-[10px] uppercase text-indigo-400 block font-sans font-medium">
              Batch API Rate
            </span>
            <span className="text-xl font-bold text-indigo-300">
              {model.batchDiscountPercent > 0 ? `-${model.batchDiscountPercent}%` : 'N/A'}
            </span>
            <span className="text-[11px] text-zinc-500 block mt-0.5">24h async offload</span>
          </div>
        </div>
      </div>

      {/* Recommended Coding Agents & Harnesses Cross-Link Widget */}
      {recommendedHarnesses.length > 0 && (
        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 sm:p-6 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-indigo-400 shrink-0" />
              <h2 className="text-base font-bold text-zinc-100">
                Recommended Coding Agents &amp; Harnesses
              </h2>
            </div>
            <Link
              href="/harness/"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 transition-colors"
            >
              <span>Compare all 7 harnesses →</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedHarnesses.map(({ tool, matchType }) => {
              const formLabel =
                tool.category === 'cli-agent'
                  ? 'CLI'
                  : tool.category === 'ai-ide'
                  ? 'IDE'
                  : 'Plugin';
              const hitMin = tool.promptCachingSupport.hitRateRangePercent?.[0] ?? 70;
              const hitMax = tool.promptCachingSupport.hitRateRangePercent?.[1] ?? 85;
              const avgHit = Math.round((hitMin + hitMax) / 2);

              return (
                <div
                  key={tool.slug}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 flex flex-col justify-between gap-3 hover:border-indigo-500/50 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-bold text-zinc-100 truncate">
                        {tool.name}
                      </span>
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                        {formLabel}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        matchType === 'Native'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                      }`}
                    >
                      {matchType}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Multiplier</span>
                      <span className="font-mono font-semibold text-emerald-400">
                        {tool.tokenMultiplierMin.toFixed(1)}x – {tool.tokenMultiplierMax.toFixed(1)}x
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Cache Match</span>
                      <span className="font-mono font-semibold text-zinc-200">
                        ~{avgHit}% Hit
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/harness/${tool.slug}/`}
                    className="min-h-[36px] inline-flex items-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Setup Config →
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Hosting Alternatives and Aggregators Table */}
      {model.hostedProviders && model.hostedProviders.length > 0 && (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Inference Hosts & Aggregator Providers
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Compare rates and latency across direct APIs, OpenRouter, and hyperscale cloud providers
              </p>
            </div>
            <span className="text-[11px] text-zinc-500">Live verified rates</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase">
                  <th className="py-2.5 px-3">Provider Name</th>
                  <th className="py-2.5 px-3">Input / 1M</th>
                  <th className="py-2.5 px-3">Output / 1M</th>
                  <th className="py-2.5 px-3">Prompt Caching</th>
                  <th className="py-2.5 px-3 text-right">Access Endpoint</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
                {model.hostedProviders.map((hp) => (
                  <tr key={hp.name} className="hover:bg-zinc-800/30">
                    <td className="py-3 px-3 font-sans font-medium text-zinc-100 flex items-center gap-2">
                      <span>{hp.name}</span>
                      {hp.isSponsored && (
                        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-400 border border-amber-500/20 font-medium">
                          Partner
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">${hp.inputPerM.toFixed(hp.inputPerM < 0.1 ? 3 : 2)}</td>
                    <td className="py-3 px-3">${hp.outputPerM.toFixed(hp.outputPerM < 0.1 ? 3 : 2)}</td>
                    <td className="py-3 px-3 font-sans">
                      {hp.supportsCaching ? (
                        <span className="text-emerald-400 font-medium">Supported</span>
                      ) : (
                        <span className="text-zinc-500">Not available</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-sans">
                      <a
                        href={hp.affiliateUrl}
                        target="_blank"
                        rel="nofollow sponsored noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <span>Connect</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Versus Comparisons Quick Matrix */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-md shadow-xl space-y-4">
        <h2 className="text-base font-bold text-zinc-100">
          Head-to-Head Comparisons for {model.modelName}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {featuredSiblings.map((other) => {
            const href = compareHref(model.modelId, other.modelId);
            return (
            <Link
              key={other.modelId}
              href={href}
              rel={href.startsWith('/compare/view/') ? 'nofollow' : undefined}
              className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/50 hover:border-indigo-500/50 hover:bg-zinc-900/60 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-semibold text-zinc-200 group-hover:text-indigo-300">
                  {model.modelName} vs {other.modelName}
                </span>
                <span className="text-[11px] text-zinc-500 block">
                  ${model.inputPerM}/M vs ${other.inputPerM}/M
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
            </Link>
            );
          })}
        </div>

        {restSiblings.length > 0 && (
          <div className="pt-1">
            <p className="text-xs font-semibold text-zinc-500 mb-2">
              All {model.modelName} comparisons
            </p>
            <div className="flex flex-wrap gap-1.5">
              {restSiblings.map((other) => (
                <Link
                  key={other.modelId}
                  href={compareHref(model.modelId, other.modelId)}
                  className="rounded-md border border-zinc-800/80 bg-zinc-950/50 px-2 py-1 text-[11px] text-zinc-400 hover:border-indigo-500/50 hover:text-indigo-300 transition-colors"
                >
                  vs {other.modelName}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
