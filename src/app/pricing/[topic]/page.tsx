import React from 'react';
import { notFound } from 'next/navigation';
import { PRICING_TOPICS, MODELS_DATA } from '@/lib/models-data';
import { BookOpen, ChevronLeft, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import SchemaOrg from '@/components/seo/SchemaOrg';

export async function generateStaticParams() {
  return PRICING_TOPICS.map((t) => ({
    topic: t.slug,
  }));
}

export default function PricingTopicPage({ params }: { params: { topic: string } }) {
  const topic = PRICING_TOPICS.find((t) => t.slug === params.topic);

  if (!topic) {
    return notFound();
  }

  const sortedByPrice = [...MODELS_DATA].sort((a, b) => a.inputPerM - b.inputPerM);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <SchemaOrg
        name={topic.title}
        description={topic.description}
        url={`https://tokencostsai.com/pricing/${topic.slug}`}
      />

      {/* Back button */}
      <div>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Guides Hub</span>
        </Link>
      </div>

      {/* Article Header */}
      <div className="space-y-4 pb-6 border-b border-zinc-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Engineering Whitepaper • Updated 2026</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-100">
          {topic.title}
        </h1>
        <p className="text-base text-zinc-300 leading-relaxed">
          {topic.description}
        </p>
      </div>

      {/* Core Insights Callout */}
      <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-6 space-y-3">
        <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Zap className="h-4 w-4 text-indigo-400" />
          <span>Key Architectural Takeaways</span>
        </h2>
        <ul className="space-y-2 text-xs text-zinc-300 leading-relaxed list-disc list-inside">
          <li>
            <strong>Prompt Caching Invalidation:</strong> Anthropic caches expire in 5 minutes unless refreshed by subsequent hits. For low-traffic apps (&lt;1 req/5min), write surcharges can increase total bills.
          </li>
          <li>
            <strong>The Ground-Floor Pricing Era:</strong> DeepSeek-V3 ($0.27/M) and Gemini 1.5 Flash ($0.075/M) have made commodity classification and extraction nearly free.
          </li>
          <li>
            <strong>Hybrid Cascading:</strong> Never route 100% of traffic to a single flagship model. 60%-80% of agent tasks can be handled by fast tiers with zero loss in end-to-end task success.
          </li>
        </ul>
      </div>

      {/* Models Ranking Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-100">
          Provider Cost Index (Per 1M Tokens)
        </h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase">
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Provider</th>
                <th className="py-2.5 px-3">Input / 1M</th>
                <th className="py-2.5 px-3">Output / 1M</th>
                <th className="py-2.5 px-3">Cache Read / 1M</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
              {sortedByPrice.slice(0, 6).map((m) => (
                <tr key={m.modelId} className="hover:bg-zinc-800/30">
                  <td className="py-2.5 px-3 font-sans font-medium text-zinc-100">
                    <Link href={`/models/${m.modelId}`} className="hover:text-indigo-400">
                      {m.modelName}
                    </Link>
                  </td>
                  <td className="py-2.5 px-3 font-sans">{m.providerOrg}</td>
                  <td className="py-2.5 px-3">${m.inputPerM.toFixed(m.inputPerM < 0.1 ? 3 : 2)}</td>
                  <td className="py-2.5 px-3">${m.outputPerM.toFixed(m.outputPerM < 0.1 ? 3 : 2)}</td>
                  <td className="py-2.5 px-3 text-emerald-400">${m.cachedInputPerM.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action CTA */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-100">
            Want to simulate your exact workload?
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Use the TokenCosts AI interactive calculator with custom volume, cache %, and batch rates.
          </p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all inline-flex items-center gap-1.5 shrink-0"
        >
          <span>Launch Simulator</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
