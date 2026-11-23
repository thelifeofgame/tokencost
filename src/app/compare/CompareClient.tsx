'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MODELS_DATA, compareHref } from '@/lib/models-data';
import trendingComparisonsData from '@/data/trending_comparisons.json';
import { ArrowRight, Scale, ChevronRight, Sparkles, Flame } from 'lucide-react';
import SchemaOrg from '@/components/seo/SchemaOrg';
import { useI18n } from '@/i18n/I18nProvider';
import { buildLocalizedCanonical } from '@/lib/seo-alternates';

interface TrendingComparisonItem {
  id: string;
  slug: string;
  canonicalSlug?: string;
  category: string;
  categoryName?: string;
  badge?: string;
  heatScore?: number;
  headline?: string;
  title: string;
  summary?: string;
  description?: string;
  metricsDelta?: {
    cheaperModel?: string;
    inputSavingsPercent?: number;
    outputSavingsPercent?: number;
    throughputMultiplier?: number;
  };
}

interface TrendingCategory {
  id: string;
  name: string;
  nameEn: string;
  badgeEmoji: string;
  description: string;
}

export default function CompareClient() {
  const router = useRouter();
  const { t, locale, getLocalizedPath } = useI18n();
  const [modelA, setModelA] = useState('gpt-6.2-sol');
  const [modelB, setModelB] = useState('deepseek-v4.1-flash');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const comparisons: TrendingComparisonItem[] = (trendingComparisonsData.comparisons || []) as unknown as TrendingComparisonItem[];
  const categories: TrendingCategory[] = (trendingComparisonsData.categories || []) as unknown as TrendingCategory[];

  const filteredComparisons = activeCategory === 'all'
    ? comparisons
    : comparisons.filter((c: TrendingComparisonItem) => c.category === activeCategory);

  const handleStartCompare = () => {
    if (modelA && modelB && modelA !== modelB) {
      const href = compareHref(modelA, modelB);
      const [pathname, query] = href.split('?');
      router.push(getLocalizedPath(pathname) + (query ? `?${query}` : ''));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <SchemaOrg
        name={t.compare.hubTitle}
        description={t.compare.hubDesc}
        url={buildLocalizedCanonical('/compare/', locale)}
        inLanguage={locale}
        breadcrumbs={[
          { name: 'Home', url: buildLocalizedCanonical('/', locale) },
          { name: 'Compare', url: buildLocalizedCanonical('/compare/', locale) },
        ]}
      />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
          <Scale className="h-3.5 w-3.5" />
          <span>{t.compare.hubBadge}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          {t.compare.hubTitle}
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {t.compare.hubDesc}
        </p>
      </div>

      {/* Interactive Picker Card */}
      <div className="max-w-2xl mx-auto rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-md shadow-sm dark:shadow-xl space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t.compare.selectModelA}</label>
            <select
              value={modelA}
              onChange={(e) => setModelA(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-950 text-xs font-medium text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {MODELS_DATA.map((m) => (
                <option key={m.modelId} value={m.modelId}>
                  {m.modelName} ({m.providerOrg})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t.compare.selectModelB}</label>
            <select
              value={modelB}
              onChange={(e) => setModelB(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-950 text-xs font-medium text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {MODELS_DATA.map((m) => (
                <option key={m.modelId} value={m.modelId}>
                  {m.modelName} ({m.providerOrg})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStartCompare}
          disabled={modelA === modelB}
          className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
        >
          <span>{t.compare.compareBtn} {modelA} {t.common.vs} {modelB}</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        {/* Quick Open-Weight Presets */}
        <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-wrap items-center justify-center gap-2 text-[11px]">
          <Link
            href={getLocalizedPath('/compare/gpt-6.2-sol-vs-gpt-oss-120b/')}
            className="px-2.5 py-1 rounded-lg bg-zinc-100/80 dark:bg-zinc-950/70 border border-zinc-200/90 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-colors"
          >
            GPT-6.2 Sol vs GPT-OSS 120B
          </Link>
          <Link
            href={getLocalizedPath('/compare/gemini-4-neon-vs-gemma-3-27b-it/')}
            className="px-2.5 py-1 rounded-lg bg-zinc-100/80 dark:bg-zinc-950/70 border border-zinc-200/90 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-colors"
          >
            Gemini 4 Neon vs Gemma 3 27B
          </Link>
        </div>
      </div>

      {/* 2026 Breakthrough Comparison Matrix */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>2026 热门对比矩阵 (Trending Matchups)</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
              基于 OpenRouter 实时调用量、Artificial Analysis 跑分与官方费率每日自动化挖掘推荐
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-200 font-semibold'
                  : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300'
              }`}
            >
              全部对决 ({comparisons.length})
            </button>
            {categories.map((cat: TrendingCategory) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-indigo-600 text-white border-indigo-600 dark:border-indigo-500 font-semibold'
                    : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300'
                }`}
              >
                <span>{cat.badgeEmoji} {cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredComparisons.map((pair: TrendingComparisonItem) => {
            const savings = pair.metricsDelta?.inputSavingsPercent;
            const hasSavings = savings && savings > 0;
            const cardSummary = pair.summary || pair.description || '';

            return (
              <Link
                key={pair.slug}
                href={getLocalizedPath(`/compare/${pair.slug}/`)}
                className="group rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/50 p-5 hover:border-indigo-400/70 dark:hover:border-indigo-500/40 hover:bg-white dark:hover:bg-zinc-900/80 shadow-sm hover:shadow-md dark:shadow-none transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400">
                      {pair.badge || 'Head to Head'}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                      <Flame className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span>{pair.heatScore?.toFixed(1) || '95.0'}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors line-clamp-2">
                    {pair.headline || pair.title}
                  </h3>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
                    {cardSummary}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between text-xs font-medium">
                  {hasSavings ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                      节省高达 {savings}%
                    </span>
                  ) : (
                    <span className="text-zinc-600 dark:text-zinc-400 font-mono">
                      同级旗舰 PK
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                    <span>详细对比测算</span>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
