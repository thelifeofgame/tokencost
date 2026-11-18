import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { PRICING_TOPICS, MODELS_DATA } from '@/lib/models-data';
import { BookOpen, ChevronRight } from 'lucide-react';
import SchemaOrg from '@/components/seo/SchemaOrg';

export const metadata: Metadata = {
  title: 'LLM API Pricing Guides & FinOps Strategies (2026) | TokenCosts AI',
  description: 'Deep-dive analyses on foundational model unit economics, prompt caching discounts, batch APIs, and cheapest provider comparisons.',
  alternates: {
    canonical: 'https://tokencostsai.com/pricing',
  },
  openGraph: {
    title: 'LLM API Pricing Guides & FinOps Strategies | TokenCosts AI',
    description: 'Comprehensive price-performance benchmarks, prompt caching tutorials, and provider breakdown.',
    url: 'https://tokencostsai.com/pricing',
    siteName: 'TokenCosts AI',
    type: 'website',
  },
};

export default function PricingHubPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <SchemaOrg
        name="LLM API Pricing Guides & FinOps Strategies"
        description="Comprehensive price-performance benchmarks, prompt caching tutorials, and provider breakdown."
        url="https://tokencostsai.com/pricing"
      />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400">
          <BookOpen className="h-3.5 w-3.5" />
          <span>FinOps Guides & Architectural Strategy</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-100">
          LLM Cost Optimization Guides
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
          Deep-dive analyses on foundational model unit economics, context window caching gotchas, and multi-cloud fallback routing.
        </p>
      </div>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PRICING_TOPICS.map((topic) => {
          const featuredModel = MODELS_DATA.find((m) => m.modelId === topic.bestModel);

          return (
            <Link
              key={topic.slug}
              href={`/pricing/${topic.slug}`}
              className="group rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 hover:border-zinc-700/80 hover:bg-zinc-900/80 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-indigo-400 block mb-2">
                  Special Report
                </span>
                <h2 className="text-xl font-bold text-zinc-100 group-hover:text-indigo-300 transition-colors">
                  {topic.title}
                </h2>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  {topic.description}
                </p>

                {featuredModel && (
                  <div className="mt-4 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-sans">Top Recommendation:</span>
                    <span className="font-semibold text-emerald-400">
                      {featuredModel.modelName} (${featuredModel.inputPerM}/M)
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-medium text-indigo-400 group-hover:text-indigo-300">
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
