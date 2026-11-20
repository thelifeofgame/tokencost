import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PRICING_TOPICS, MODELS_DATA } from '@/lib/models-data';
import { getTopicSeoMeta, getTopicFaqs } from '@/lib/pricing-topics-seo';
import { buildAlternates, buildLocalizedCanonical } from '@/lib/seo-alternates';
import { DEFAULT_LOCALE, Locale } from '@/i18n';
import SchemaOrg from '@/components/seo/SchemaOrg';
import RealtimeVoiceWorldModelSimulator from '@/components/pricing/RealtimeVoiceWorldModelSimulator';
import GeminiCarbonMigrationSimulator from '@/components/pricing/GeminiCarbonMigrationSimulator';
import TopicB2BAuditCard from '@/components/pricing/TopicB2BAuditCard';
import { BookOpen, ChevronLeft, Zap } from 'lucide-react';

export async function generateStaticParams() {
  return PRICING_TOPICS.map((t) => ({
    topic: t.slug,
  }));
}

export function buildTopicMetadata(
  topicSlug: string,
  locale: Locale = DEFAULT_LOCALE
): Metadata {
  const topic = PRICING_TOPICS.find((t) => t.slug === topicSlug);
  if (!topic) {
    return {
      title: 'Guide Not Found | TokenCosts AI',
      description: 'The requested LLM API pricing guide could not be found.',
    };
  }

  const seo = getTopicSeoMeta(topic.slug, locale);
  const alternates = buildAlternates(`/pricing/${topic.slug}/`, locale);

  return {
    title: seo.title,
    description: seo.description,
    alternates,
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: 'article',
      url: alternates.canonical,
      siteName: 'TokenCosts AI',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: { topic: string };
}): Promise<Metadata> {
  return buildTopicMetadata(params.topic, DEFAULT_LOCALE);
}

export default function PricingTopicPage({
  params,
  locale = DEFAULT_LOCALE,
}: {
  params: { topic: string };
  locale?: Locale;
}) {
  const topic = PRICING_TOPICS.find((t) => t.slug === params.topic);

  if (!topic) {
    return notFound();
  }

  const seo = getTopicSeoMeta(topic.slug, locale);
  const faqs = getTopicFaqs(topic.slug);
  const canonicalUrl = buildLocalizedCanonical(`/pricing/${topic.slug}/`, locale);
  const homeUrl = buildLocalizedCanonical('/', locale);
  const pricingHubUrl = buildLocalizedCanonical('/pricing/', locale);
  const pricingHubHref = locale === DEFAULT_LOCALE ? '/pricing/' : `/${locale}/pricing/`;

  const breadcrumbs = [
    { name: 'Home', url: homeUrl },
    { name: 'Guides', url: pricingHubUrl },
    { name: seo.h1, url: canonicalUrl },
  ];

  const isRealtimeVoiceTopic = topic.slug === 'realtime-voice-world-model-api-costs';
  const isCarbonMigrationTopic = topic.slug === 'gemini-4-carbon-dec-1-migration-guide';
  const sortedByPrice = [...MODELS_DATA].sort((a, b) => a.inputPerM - b.inputPerM);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <SchemaOrg
        type="faq"
        name={seo.h1}
        description={seo.description}
        url={canonicalUrl}
        faqs={faqs}
        breadcrumbs={breadcrumbs}
        includeHreflang={false}
      />

      {/* Back button & Topic Quick Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={pricingHubHref}
          className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Guides Hub</span>
        </Link>

        {isRealtimeVoiceTopic && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full px-2.5 py-0.5 text-[11px] font-mono font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300">
              Voice Standby (-60%)
            </span>
            <span className="rounded-full px-2.5 py-0.5 text-[11px] font-mono font-semibold bg-purple-500/10 border border-purple-500/25 text-purple-700 dark:text-purple-300">
              World Model GA
            </span>
          </div>
        )}

        {isCarbonMigrationTopic && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full px-2.5 py-0.5 text-[11px] font-mono font-semibold bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300">
              Cutoff Nov 30 · 2x Hike
            </span>
            <span className="rounded-full px-2.5 py-0.5 text-[11px] font-mono font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300">
              Azure o3 Retired Nov 19
            </span>
          </div>
        )}
      </div>

      {/* Article Header */}
      <div className="space-y-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-600 dark:text-indigo-400">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Engineering Whitepaper • Updated Nov 20, 2026</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          {seo.h1}
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
          {seo.description}
        </p>
      </div>

      {/* Interactive Topic Body */}
      {isRealtimeVoiceTopic ? (
        <RealtimeVoiceWorldModelSimulator faqs={faqs} />
      ) : isCarbonMigrationTopic ? (
        <GeminiCarbonMigrationSimulator faqs={faqs} />
      ) : (
        <>
          {/* Generic Whitepaper Insights Callout */}
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-50/70 dark:bg-indigo-950/20 p-6 space-y-3">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Key Architectural Takeaways</span>
            </h2>
            <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed list-disc list-inside">
              <li>
                <strong>Prompt Caching Invalidation:</strong> Anthropic caches expire in 5 minutes unless refreshed by subsequent hits. For low-traffic apps (&lt;1 req/5min), write surcharges can increase total bills.
              </li>
              <li>
                <strong>The Ground-Floor Pricing Era:</strong> DeepSeek-V4.1-Flash ($0.30/M official, $0.036/M OpenRouter) and Gemini 3.1 Flash-Lite have made commodity classification and extraction nearly free.
              </li>
              <li>
                <strong>Hybrid Cascading:</strong> Never route 100% of traffic to a single flagship model. 60%-80% of agent tasks can be handled by fast tiers with zero loss in end-to-end task success.
              </li>
            </ul>
          </div>

          {/* Models Ranking Table */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Provider Cost Index (Per 1M Tokens)
            </h2>
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/85 dark:bg-zinc-900/60 p-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                    <th className="py-2.5 px-3">Model</th>
                    <th className="py-2.5 px-3">Provider</th>
                    <th className="py-2.5 px-3">Input / 1M</th>
                    <th className="py-2.5 px-3">Output / 1M</th>
                    <th className="py-2.5 px-3">Cache Read / 1M</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 font-mono text-zinc-700 dark:text-zinc-300">
                  {sortedByPrice.slice(0, 6).map((m) => (
                    <tr key={m.modelId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                      <td className="py-2.5 px-3 font-sans font-medium text-zinc-900 dark:text-zinc-100">
                        <Link
                          href={
                            locale === DEFAULT_LOCALE
                              ? `/models/${m.modelId}/`
                              : `/${locale}/models/${m.modelId}/`
                          }
                          className="hover:text-indigo-600 dark:hover:text-indigo-400"
                        >
                          {m.modelName}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-sans">{m.providerOrg}</td>
                      <td className="py-2.5 px-3">
                        ${m.inputPerM.toFixed(m.inputPerM < 0.1 ? 3 : 2)}
                      </td>
                      <td className="py-2.5 px-3">
                        ${m.outputPerM.toFixed(m.outputPerM < 0.1 ? 3 : 2)}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">
                        ${m.cachedInputPerM.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* B2B FinOps Audit Conversion Card (/contact + www.smeng@gmail.com) */}
      <TopicB2BAuditCard topicSlug={topic.slug} />
    </div>
  );
}
