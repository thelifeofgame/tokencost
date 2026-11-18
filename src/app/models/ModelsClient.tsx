'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { MODELS_DATA } from '@/lib/models-data';
import { Search, ChevronRight, Filter, Sparkles, ChevronDown, ExternalLink } from 'lucide-react';
import SchemaOrg from '@/components/seo/SchemaOrg';
import { useI18n } from '@/i18n/I18nProvider';

const QUICK_PROVIDERS = [
  'All',
  'Frontier 2026',
  'OpenAI',
  'Anthropic',
  'DeepSeek',
  'Google',
  'xAI',
  'Alibaba Qwen',
  'Mistral',
  'Meta',
  'Groq',
];

export default function ModelsClient() {
  const { t, getLocalizedPath } = useI18n();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('All');
  const [selectedProviderDropdown, setSelectedProviderDropdown] = useState<string>('');
  const [displayCount, setDisplayCount] = useState<number>(36);

  // Extract all unique provider orgs for the extended dropdown
  const allProviders = useMemo(() => {
    const orgs = Array.from(new Set(MODELS_DATA.map((m) => m.providerOrg)));
    return orgs.sort((a, b) => a.localeCompare(b));
  }, []);

  const filtered = useMemo(() => {
    return MODELS_DATA.filter((m) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.modelName.toLowerCase().includes(q) ||
        m.modelId.toLowerCase().includes(q) ||
        m.providerOrg.toLowerCase().includes(q) ||
        (m.notes && m.notes.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (selectedProviderDropdown) {
        return m.providerOrg === selectedProviderDropdown;
      }

      if (activeTab === 'All') return true;
      if (activeTab === 'Frontier 2026') return !!m.isFrontier;
      return m.providerOrg === activeTab;
    });
  }, [search, activeTab, selectedProviderDropdown]);

  const displayedModels = filtered.slice(0, displayCount);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedProviderDropdown('');
    setDisplayCount(36);
  };

  const handleDropdownChange = (provider: string) => {
    setSelectedProviderDropdown(provider);
    if (provider) {
      setActiveTab('');
    } else {
      setActiveTab('All');
    }
    setDisplayCount(36);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <SchemaOrg
        name={t.models.title}
        description={t.models.desc}
        url="https://tokencostsai.com/models"
      />

      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{t.common.modelsCount} • {t.common.verified}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-100">
          {t.models.title}
        </h1>
        <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">
          {t.models.desc}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <Filter className="h-4 w-4 text-zinc-500 mr-1 hidden sm:inline" />
            {QUICK_PROVIDERS.map((p) => {
              const isActive = activeTab === p && !selectedProviderDropdown;
              const isFrontier = p === 'Frontier 2026';
              return (
                <button
                  key={p}
                  onClick={() => handleTabChange(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all flex items-center gap-1 ${
                    isActive
                      ? isFrontier
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm font-semibold'
                        : 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-zinc-800/80'
                  }`}
                >
                  {isFrontier && <Sparkles className="h-3 w-3" />}
                  <span>{p === 'All' ? t.models.allProviders : p}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder={t.models.searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setDisplayCount(36);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-800 bg-zinc-950/80 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Secondary Provider Selector & Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">{t.models.filterByProvider}:</span>
            <select
              value={selectedProviderDropdown}
              onChange={(e) => handleDropdownChange(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- {t.models.allProviders} ({allProviders.length}) --</option>
              {allProviders.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
            {selectedProviderDropdown && (
              <button
                onClick={() => handleDropdownChange('')}
                className="text-xs text-indigo-400 hover:underline"
              >
                {t.common.cancel}
              </button>
            )}
          </div>

          <div className="text-zinc-400 font-mono text-[11px]">
            Showing <strong className="text-zinc-100">{displayedModels.length}</strong> of{' '}
            <strong className="text-zinc-100">{filtered.length}</strong> {t.models.totalModels}
          </div>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedModels.map((m) => (
          <div
            key={m.modelId}
            className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-md flex flex-col justify-between hover:border-zinc-700/80 hover:bg-zinc-900/80 transition-all duration-200 shadow-lg"
          >
            <div>
              {/* Top row */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-base text-zinc-100 group-hover:text-indigo-300 transition-colors">
                      {m.modelName}
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-zinc-500">
                    {m.modelId}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-xs font-medium text-zinc-300">
                    {m.providerOrg}
                  </span>
                  {m.isFrontier && (
                    <span className="rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" />
                      <span>2026 Frontier</span>
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 mb-4">
                {m.notes || 'High performance LLM endpoint optimized for inference and agentic tool workflows.'}
              </p>

              {/* Pricing Matrix Pill */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 font-mono text-xs mb-4">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Input / {t.common.perMillion}</span>
                  <span className="text-zinc-100 font-bold">
                    ${m.inputPerM.toFixed(m.inputPerM < 0.1 ? 3 : 2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Output / {t.common.perMillion}</span>
                  <span className="text-zinc-100 font-bold">
                    ${m.outputPerM.toFixed(m.outputPerM < 0.1 ? 3 : 2)}
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400 font-sans">Prompt Cache:</span>
                  <span className="text-emerald-400 font-bold">
                    ${m.cachedInputPerM.toFixed(3)}/M (-{m.cacheDiscountPercent}% off)
                  </span>
                </div>
              </div>

              {/* Specs & Benchmarks */}
              <div className="space-y-1.5 text-[11px] text-zinc-400 font-sans mb-4">
                <div className="flex justify-between">
                  <span>Context Window:</span>
                  <span className="font-mono text-zinc-200">{(m.contextWindow / 1000).toLocaleString()}k tokens</span>
                </div>
                {m.benchmarks?.evalScore && (
                  <div className="flex justify-between">
                    <span>Eval Score / MMLU:</span>
                    <span className="font-mono text-indigo-400 font-semibold">{m.benchmarks.evalScore}</span>
                  </div>
                )}
                {m.benchmarks?.avgThroughputTokS && (
                  <div className="flex justify-between">
                    <span>Throughput:</span>
                    <span className="font-mono text-zinc-200">{m.benchmarks.avgThroughputTokS} tok/s</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
              <Link
                href={getLocalizedPath(`/models/${m.modelId}`)}
                className="font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>{t.simulator.leaderboard.viewDetails}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>

              <div className="flex items-center gap-2">
                <Link
                  href={getLocalizedPath(`/calculator/${m.modelId}`)}
                  className="px-2 py-1 text-[11px] font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-800/80 hover:bg-zinc-800 rounded-md transition-colors"
                >
                  {t.nav.calculators}
                </Link>
                {m.affiliateUrl && (
                  <a
                    href={m.affiliateUrl}
                    target="_blank"
                    rel="nofollow sponsored noopener noreferrer"
                    className="px-2 py-1 text-[11px] font-medium text-indigo-300 hover:text-indigo-100 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-md transition-colors inline-flex items-center gap-1"
                  >
                    <span>API</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination / Load More */}
      {filtered.length > displayCount && (
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => setDisplayCount((prev) => Math.min(prev + 36, filtered.length))}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
          >
            <span>Load 36 More Models</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDisplayCount(filtered.length)}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors"
          >
            {t.common.viewAll} ({filtered.length})
          </button>
        </div>
      )}
    </div>
  );
}
