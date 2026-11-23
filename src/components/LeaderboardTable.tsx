'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ModelCostBreakdown } from '@/types/pricing';
import { formatCurrency, formatPerMillionPrice } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import { useI18n } from '@/i18n/I18nProvider';
import { formatModelCount } from '@/i18n';
import { MODELS_DATA } from '@/lib/models-data';
import { ArrowUpDown, Table, ExternalLink, Search, Sparkles, ChevronDown } from 'lucide-react';

interface LeaderboardTableProps {
  breakdowns: ModelCostBreakdown[];
}

export default function LeaderboardTable({ breakdowns }: LeaderboardTableProps) {
  const { t, getLocalizedPath } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'net' | 'input' | 'output' | 'eval'>('net');
  const [sortAsc, setSortAsc] = useState(true);
  const [visibleCount, setVisibleCount] = useState<number>(30);

  const filtered = breakdowns.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.model.modelName.toLowerCase().includes(q) ||
      item.model.providerOrg.toLowerCase().includes(q) ||
      item.model.modelId.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortField === 'eval') {
      const aScore = a.model.benchmarks?.intelligenceIndex;
      const bScore = b.model.benchmarks?.intelligenceIndex;
      const aMissing = aScore == null;
      const bMissing = bScore == null;
      if (aMissing && bMissing) return a.monthlyNetCost - b.monthlyNetCost;
      if (aMissing) return 1;
      if (bMissing) return -1;
      const diff = bScore - aScore;
      return sortAsc ? diff : -diff;
    }

    let diff = 0;
    if (sortField === 'net') diff = a.monthlyNetCost - b.monthlyNetCost;
    else if (sortField === 'input') diff = a.model.inputPerM - b.model.inputPerM;
    else if (sortField === 'output') diff = a.model.outputPerM - b.model.outputPerM;

    return sortAsc ? diff : -diff;
  });

  const toggleSort = (field: 'net' | 'input' | 'output' | 'eval') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const displayed = sorted.slice(0, visibleCount);

  return (
    <div className="relative rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 p-5 sm:p-6 backdrop-blur-md shadow-sm shadow-zinc-950/[0.04] dark:shadow-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-400/20 to-transparent" />

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Table className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">
              {t.simulator.leaderboard.title}
            </h2>
            <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-700 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/70">
              {formatModelCount(t.common.modelsCount, breakdowns.length)}
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            {formatModelCount(t.simulator.leaderboard.subtitle, MODELS_DATA.length)}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder={formatModelCount(t.common.searchPlaceholder, MODELS_DATA.length)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-950 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto -mx-5 sm:mx-0">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider bg-zinc-50/90 dark:bg-zinc-950/40">
              <th className="py-3 px-4 w-12 text-center">{t.simulator.leaderboard.colRank}</th>
              <th className="py-3 px-4">{t.simulator.leaderboard.colModel}</th>
              <th className="py-3 px-4">{t.simulator.leaderboard.colProvider}</th>
              <th
                onClick={() => toggleSort('eval')}
                className="py-3 px-4 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>{t.simulator.leaderboard.colEval}</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('input')}
                className="py-3 px-4 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>{t.simulator.leaderboard.colInput}</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('output')}
                className="py-3 px-4 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>{t.simulator.leaderboard.colOutput}</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('net')}
                className="py-3 px-4 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>{t.simulator.leaderboard.colNetCost}</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-center">{t.simulator.leaderboard.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/60">
            {displayed.map((item, index) => {
              const isFirst = index === 0 && !searchQuery;
              const bm = item.model.benchmarks;
              return (
                <tr
                  key={item.model.modelId}
                  className={`even:bg-zinc-50/50 dark:even:bg-zinc-950/20 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40 transition-colors group ${
                    isFirst ? 'bg-indigo-50/60 dark:bg-indigo-950/15' : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3 px-4 font-mono text-zinc-600 dark:text-zinc-500 text-center text-[11px] tabular-nums">
                    {index + 1}
                  </td>

                  {/* Model Name & Badges */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Link
                          href={getLocalizedPath(`/models/${item.model.modelId}`)}
                          className="font-bold text-zinc-900 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          {item.model.modelName}
                        </Link>
                        {isFirst && (
                          <span className="flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                            <Sparkles className="h-2.5 w-2.5" />
                            Best Value
                          </span>
                        )}
                        {item.model.isSponsored && (
                          <span className="rounded bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                            Promoted
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-zinc-500">
                        {item.model.modelId}
                      </span>
                    </div>
                  </td>

                  {/* Provider */}
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 font-medium">
                    {item.model.providerOrg}
                  </td>

                  {/* Benchmarks (AA Intelligence / Arena ELO / Coding) */}
                  <td className="py-3 px-4 font-mono">
                    {bm?.intelligenceIndex != null ? (
                      <span
                        title="Artificial Analysis Intelligence Index"
                        className="font-semibold text-zinc-900 dark:text-zinc-200 tabular-nums"
                      >
                        AA {bm.intelligenceIndex.toFixed(1)}
                      </span>
                    ) : bm?.arenaElo != null ? (
                      <span
                        title="Chatbot Arena ELO"
                        className="font-semibold text-zinc-800 dark:text-zinc-300 tabular-nums"
                      >
                        Elo {bm.arenaElo}
                      </span>
                    ) : bm?.codingIndex != null ? (
                      <span
                        title={bm.codingIndex <= 100 ? 'Coding Benchmark (%)' : 'Coding Arena ELO'}
                        className="font-semibold text-zinc-800 dark:text-zinc-300 tabular-nums"
                      >
                        {bm.codingIndex <= 100 ? `${bm.codingIndex}%` : bm.codingIndex}
                      </span>
                    ) : (
                      <span
                        title="Not yet indexed by third-party benchmarks"
                        className="inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/50 text-[10px] font-mono text-zinc-600 dark:text-zinc-400"
                      >
                        —
                      </span>
                    )}
                  </td>

                  {/* Input Cost */}
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    <div className="text-zinc-900 dark:text-zinc-200 font-medium">
                      {formatPerMillionPrice(item.model.inputPerM)}
                    </div>
                    {item.model.cacheDiscountPercent > 0 && (
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                        -{item.model.cacheDiscountPercent}% cached
                      </div>
                    )}
                  </td>

                  {/* Output Cost */}
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-zinc-900 dark:text-zinc-200 font-medium">
                    {formatPerMillionPrice(item.model.outputPerM)}
                  </td>

                  {/* Monthly Net Cost */}
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(item.monthlyNetCost)}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      ${item.costPer1kRequests.toFixed(2)} {t.common.per1kRequests}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link
                        href={getLocalizedPath(`/models/${item.model.modelId}`)}
                        className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white border border-zinc-200/80 dark:border-transparent text-[11px] font-medium transition-colors"
                      >
                        {t.simulator.leaderboard.viewDetails}
                      </Link>
                      {item.model.affiliateUrl && (
                        <a
                          href={item.model.affiliateUrl}
                          target="_blank"
                          rel="nofollow sponsored noopener noreferrer"
                          onClick={() =>
                            trackEvent('affiliate_click', {
                              partner: 'openrouter',
                              placement: 'leaderboard',
                              model_id: item.model.modelId,
                              outbound_url: item.model.affiliateUrl,
                            })
                          }
                          className="p-1 rounded bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-indigo-600 dark:text-indigo-300 transition-colors"
                          title={t.simulator.leaderboard.connectApi}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Show More Pagination */}
      {visibleCount < sorted.length && (
        <div className="mt-4 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/60 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
          <span>
            Showing {Math.min(visibleCount, sorted.length)} of {sorted.length} models
          </span>
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 50)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/60 text-xs font-medium transition-colors"
          >
            <span>Show Next 50 Models</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
