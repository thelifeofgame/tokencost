'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Scale, ArrowLeft, AlertCircle } from 'lucide-react';
import { getComparisonData } from '@/lib/models-data';
import CompareDetailClient from '@/components/CompareDetailClient';

/**
 * 客户端渲染的长尾对比页。
 *
 * 入参优先级：
 *   1. ?slug=modelA-vs-modelB
 *   2. ?a=modelA&b=modelB
 *   3. 当前路径 /compare/<slug>/（兼容 404 页跳转过来的情况）
 *
 * 只做展示，不写入任何 SEO 索引（页面级已设 noindex）。
 */
export default function CompareFallbackClient() {
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let next = params.get('slug') || '';

    if (!next) {
      const a = params.get('a');
      const b = params.get('b');
      if (a && b) {
        const sorted = [a, b].sort();
        next = `${sorted[0]}-vs-${sorted[1]}`;
      }
    }

    if (!next) {
      const m = window.location.pathname.match(/\/compare\/([^/]+)\/?$/);
      if (m) next = decodeURIComponent(m[1]);
    }

    setSlug(next);
  }, []);

  const data = useMemo(() => (slug ? getComparisonData(slug) : null), [slug]);

  // 首帧与静态预渲染结果保持一致，避免 hydration 不匹配
  if (slug === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center text-sm text-zinc-500">
        Loading comparison…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center space-y-4">
        <AlertCircle className="h-10 w-10 mx-auto text-amber-400" />
        <h1 className="text-2xl font-bold text-zinc-100">Comparison not found</h1>
        <p className="text-sm text-zinc-400">
          We could not match “{slug}” to two models in our catalogue. Pick them
          again from the compare hub.
        </p>
        <Link
          href="/compare/"
          className="inline-flex items-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Compare
        </Link>
      </div>
    );
  }

  const { modelA, modelB } = data;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-zinc-400">
        <Link href="/" className="hover:text-zinc-200 transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3 text-zinc-600" />
        <Link href="/compare/" className="hover:text-zinc-200 transition-colors">Compare</Link>
        <ChevronRight className="h-3 w-3 text-zinc-600" />
        <span className="text-zinc-200 font-medium truncate">
          {modelA.modelName} vs {modelB.modelName}
        </span>
      </nav>

      <header className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-400">
          <Scale className="h-3.5 w-3.5" />
          <span>On-demand comparison</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-100">
          {modelA.modelName}{' '}
          <span className="text-zinc-500 font-sans font-light">vs</span>{' '}
          {modelB.modelName}
        </h1>
        <p className="text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          {data.description}
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[modelA, modelB].map((m) => (
          <div
            key={m.modelId}
            className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur-md"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              {m.providerOrg}
            </div>
            <h2 className="text-lg font-extrabold text-zinc-100 mt-1">{m.modelName}</h2>
            <div className="mt-3 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between border-b border-zinc-800/50 py-1">
                <span className="text-zinc-400 font-sans">Input / 1M</span>
                <span className="text-zinc-100 font-bold">${m.inputPerM.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/50 py-1">
                <span className="text-zinc-400 font-sans">Output / 1M</span>
                <span className="text-zinc-100 font-bold">${m.outputPerM.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400 font-sans">Model ID</span>
                <span className="text-zinc-300">{m.modelId}</span>
              </div>
            </div>
          </div>
        ))}
      </section>

      <CompareDetailClient modelA={modelA} modelB={modelB} />

      <div className="text-center text-xs text-zinc-500">
        This long-tail comparison is generated on demand and is not indexed.{' '}
        <Link href="/compare/" className="text-indigo-400 hover:text-indigo-300">
          Browse curated comparisons →
        </Link>
      </div>
    </div>
  );
}
