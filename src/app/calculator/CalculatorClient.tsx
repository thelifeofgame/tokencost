'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { MODELS_DATA } from '@/lib/models-data';
import { formatPerMillionPrice } from '@/lib/utils';
import { Calculator, ChevronRight, Search, Sparkles } from 'lucide-react';
import SchemaOrg from '@/components/seo/SchemaOrg';
import { useI18n } from '@/i18n/I18nProvider';

export default function CalculatorClient() {
  const { t, getLocalizedPath } = useI18n();
  const [search, setSearch] = useState('');
  const [displayCount, setDisplayCount] = useState(36);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return MODELS_DATA;
    return MODELS_DATA.filter(
      (m) =>
        m.modelName.toLowerCase().includes(q) ||
        m.modelId.toLowerCase().includes(q) ||
        m.providerOrg.toLowerCase().includes(q)
    );
  }, [search]);

  const displayed = filtered.slice(0, displayCount);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <SchemaOrg
        name={t.calculator.title}
        description={t.calculator.desc}
        url="https://tokencostsai.com/calculator"
      />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400">
          <Calculator className="h-3.5 w-3.5" />
          <span>{t.calculator.badge}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-100">
          {t.calculator.title}
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
          {t.calculator.desc}
        </p>
      </div>

      {/* Search Input */}
      <div className="max-w-md mx-auto relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          placeholder={t.models.searchPlaceholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setDisplayCount(36);
          }}
          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-lg"
        />
      </div>

      {/* Calculator Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayed.map((model) => (
          <Link
            key={model.modelId}
            href={getLocalizedPath(`/calculator/${model.modelId}`)}
            className="group rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 hover:border-zinc-700/80 hover:bg-zinc-900/80 transition-all flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-indigo-400">{model.providerOrg}</span>
                  {model.isFrontier && (
                    <span className="rounded bg-indigo-500/20 px-1 py-0.5 text-[9px] text-indigo-300 border border-indigo-500/30 flex items-center gap-0.5">
                      <Sparkles className="h-2 w-2" />
                      <span>2026</span>
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-medium">
                  Up to -{model.cacheDiscountPercent}% off
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-100 group-hover:text-indigo-300 transition-colors">
                {model.modelName} Prompt Caching
              </h3>
              <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                {model.notes || 'Calculate prompt caching discounts and monthly bill amortization.'}
              </p>

              <div className="mt-4 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 font-mono text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-sans">{t.calculator.baseInput}:</span>
                  <span className="text-zinc-200">{formatPerMillionPrice(model.inputPerM)}/M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-sans">{t.calculator.cacheHitRead}:</span>
                  <span className="text-emerald-400 font-bold">{formatPerMillionPrice(model.cachedInputPerM)}/M</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-zinc-800/50 text-[11px]">
                  <span className="text-zinc-500 font-sans">Context Window:</span>
                  <span className="text-zinc-300">{(model.contextWindow / 1000).toLocaleString()}k tokens</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-medium text-indigo-400 group-hover:text-indigo-300">
              <span>{t.calculator.launchCalculator}</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {filtered.length > displayCount && (
        <div className="pt-6 flex justify-center">
          <button
            onClick={() => setDisplayCount((prev) => Math.min(prev + 36, filtered.length))}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-lg shadow-indigo-600/20"
          >
            {t.common.viewAll} ({filtered.length})
          </button>
        </div>
      )}
    </div>
  );
}
