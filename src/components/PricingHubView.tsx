import React from 'react';
import Link from 'next/link';
import { PRICING_TOPICS, MODELS_DATA } from '@/lib/models-data';
import { BookOpen, ChevronRight } from 'lucide-react';
import SchemaOrg from '@/components/seo/SchemaOrg';
import { buildLocalizedCanonical } from '@/lib/seo-alternates';
import { DEFAULT_LOCALE, Locale, getLocalizedPath } from '@/i18n';

interface PricingHubViewProps {
  locale?: Locale;
}

export default function PricingHubView({ locale = DEFAULT_LOCALE }: PricingHubViewProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <SchemaOrg
        name="LLM API Pricing Guides & FinOps Strategies"
        description="Comprehensive price-performance benchmarks, prompt caching tutorials, and provider breakdown."
        url={buildLocalizedCanonical('/pricing/', locale)}
        inLanguage={locale}
      />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-600 dark:text-indigo-400">
          <BookOpen className="h-3.5 w-3.5" />
          <span>FinOps Guides &amp; Architectural Strategy</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          LLM Cost Optimization Guides
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Deep-dive analyses on foundational model unit economics, context window caching gotchas, real-time voice/world-model billing, and multi-cloud fallback routing.
        </p>
      </div>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PRICING_TOPICS.map((topic) => {
          const featuredModel = MODELS_DATA.find((m) => m.modelId === topic.bestModel);
          const isAlertTopic = topic.slug === 'gemini-4-carbon-dec-1-migration-guide';

          return (
            <Link
              key={topic.slug}
              href={getLocalizedPath(`/pricing/${topic.slug}/`, locale)}
              className={`group rounded-2xl border p-6 transition-all flex flex-col justify-between ${
                isAlertTopic
                  ? 'border-rose-500/35 bg-rose-50/60 dark:bg-rose-950/20 hover:border-rose-500/60'
                  : 'border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700/80 hover:bg-zinc-50 dark:hover:bg-zinc-900/80'
              }`}
            >
              <div>
                <span
                  className={`text-xs font-semibold block mb-2 ${
                    isAlertTopic
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {isAlertTopic ? 'Time-Sensitive Playbook · Cutoff Nov 30' : 'Special Report'}
                </span>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                  {topic.title}
                </h2>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  {topic.description}
                </p>

                {featuredModel && (
                  <div className="mt-4 p-3 rounded-xl bg-zinc-100/80 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between text-xs gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400 font-sans">
                      Top Recommendation:
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                      {featuredModel.modelName} (${featuredModel.inputPerM}/M)
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-xs font-medium text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-300">
                <span>Read Full Guide</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
