'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AnalyticsOverviewResponse } from '@/types/analytics';
import { formatExactInt, formatPct } from './formatters';

type PageRow = AnalyticsOverviewResponse['pages'][number];
type SortField =
  | 'path'
  | 'edgeHits'
  | 'humanPv'
  | 'moduleImpressions'
  | 'clicks'
  | 'ctr'
  | 'conversions'
  | 'cvr';

interface AdminPageTableProps {
  pages: PageRow[];
}

const CHANNEL_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'Home', label: '首页' },
  { key: 'Deals', label: '优惠 Deals' },
  { key: 'Calculator', label: '计算器' },
  { key: 'Compare', label: '对比 Compare' },
  { key: 'Models', label: '模型 Models' },
  { key: 'Harness', label: 'Harness' },
  { key: 'Pricing_Dev', label: '定价 & 开发者' },
];

function getChannelBadgeClass(channel: string): string {
  switch (channel) {
    case 'Deals':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25';
    case 'Calculator':
      return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25';
    case 'Harness':
      return 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25';
    case 'Compare':
      return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25';
    case 'Models':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25';
    default:
      return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
  }
}

export default function AdminPageTable({ pages }: AdminPageTableProps) {
  const [channelFilter, setChannelFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('humanPv');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return pages.filter((p) => {
      if (channelFilter === 'Pricing_Dev') {
        if (p.channel !== 'Pricing' && p.channel !== 'Developers') return false;
      } else if (channelFilter !== 'all' && p.channel !== channelFilter) {
        return false;
      }
      if (q) {
        return (
          p.path.toLowerCase().includes(q) ||
          p.channel.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [pages, channelFilter, searchQuery]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortField === 'path') {
        const cmp = a.path.localeCompare(b.path);
        return sortDir === 'asc' ? cmp : -cmp;
      }
      const aVal = a[sortField] ?? -1;
      const bVal = b[sortField] ?? -1;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filtered, sortField, sortDir]);

  const visibleRows = expanded ? sorted : sorted.slice(0, 12);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-zinc-400" />;
    }
    return sortDir === 'desc' ? (
      <ArrowDown className="w-3 h-3 text-indigo-500" />
    ) : (
      <ArrowUp className="w-3 h-3 text-indigo-500" />
    );
  };

  return (
    <section
      aria-label="页面曝光、点击与转化明细"
      className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md shadow-sm shadow-zinc-950/[0.03] dark:shadow-none space-y-4"
    >
      {/* Header Row */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                页面曝光、点击与转化明细
              </h2>
              <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
                共 {filtered.length} 个页面
              </span>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5">
              PAGE PERFORMANCE · EXPOSURE, CTR &amp; OUTBOUND CVR
            </p>
          </div>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {CHANNEL_FILTERS.map((f) => {
              const active = channelFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => {
                    setChannelFilter(f.key);
                    setExpanded(false);
                  }}
                  className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                      : 'bg-zinc-100 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setExpanded(false);
              }}
              placeholder="筛选路径或频道..."
              aria-label="筛选页面路径"
              className="w-full h-9 pl-8 pr-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="清空搜索"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {searchQuery
              ? `未找到匹配“${searchQuery}”的页面记录`
              : '当前时间窗口内暂无页面埋点记录'}
          </p>
          {(searchQuery || channelFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setChannelFilter('all');
              }}
              className="min-h-[36px] px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              清空筛选
            </button>
          )}
        </div>
      ) : (
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[780px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200/80 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                <th
                  aria-sort={sortField === 'path' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  className="sticky left-0 z-10 bg-white dark:bg-zinc-900 py-2.5 pr-3 font-semibold shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_6px_-2px_rgba(0,0,0,0.45)]"
                >
                  <button
                    type="button"
                    onClick={() => toggleSort('path')}
                    className="min-h-[36px] inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                  >
                    <span>页面路径 Path</span>
                    {renderSortIcon('path')}
                  </button>
                </th>
                <th className="py-2.5 px-3 font-semibold">所属频道</th>
                {(
                  [
                    ['edgeHits', '边缘曝光'],
                    ['humanPv', '真实 PV'],
                    ['moduleImpressions', '模块曝光'],
                    ['clicks', '点击数'],
                    ['ctr', 'CTR'],
                    ['conversions', '转化数'],
                    ['cvr', 'CVR'],
                  ] as Array<[SortField, string]>
                ).map(([field, label]) => (
                  <th
                    key={field}
                    aria-sort={
                      sortField === field ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
                    }
                    className="py-2.5 px-2.5 text-right font-semibold whitespace-nowrap"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(field)}
                      className="min-h-[36px] inline-flex items-center justify-end gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                    >
                      <span>{label}</span>
                      {renderSortIcon(field)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
              {visibleRows.map((row) => (
                <tr
                  key={row.path}
                  className="group hover:bg-zinc-50/90 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800/90 py-2.5 pr-3 max-w-[230px] shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_6px_-2px_rgba(0,0,0,0.45)]">
                    <a
                      href={row.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 truncate max-w-full"
                    >
                      <span className="truncate">{row.path}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                    </a>
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-mono font-medium ${getChannelBadgeClass(
                        row.channel
                      )}`}
                    >
                      {row.channel}
                    </span>
                  </td>

                  <td className="py-2.5 px-2.5 text-right font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                    {row.edgeHits === null ? '—' : formatExactInt(row.edgeHits)}
                  </td>

                  <td className="py-2.5 px-2.5 text-right font-mono tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
                    {formatExactInt(row.humanPv)}
                  </td>

                  <td className="py-2.5 px-2.5 text-right font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                    {formatExactInt(row.moduleImpressions)}
                  </td>

                  <td className="py-2.5 px-2.5 text-right font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                    {formatExactInt(row.clicks)}
                  </td>

                  <td className="py-2.5 px-2.5 text-right font-mono tabular-nums">
                    <div className="inline-flex items-center justify-end gap-2">
                      <span className="text-zinc-700 dark:text-zinc-300">{formatPct(row.ctr)}</span>
                      <span className="w-10 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden hidden sm:inline-block">
                        <span
                          className="block h-full rounded-full bg-indigo-500"
                          style={{ width: `${Math.min(100, Math.max(0, row.ctr))}%` }}
                        />
                      </span>
                    </div>
                  </td>

                  <td
                    className={`py-2.5 px-2.5 text-right font-mono tabular-nums font-semibold ${
                      row.conversions > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-zinc-400 dark:text-zinc-500'
                    }`}
                  >
                    {formatExactInt(row.conversions)}
                  </td>

                  <td className="py-2.5 px-2.5 text-right font-mono tabular-nums">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 ${
                        row.cvr > 5
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {formatPct(row.cvr, 2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sorted.length > 12 && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="min-h-[36px] inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-indigo-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>收起</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>展开全部 {sorted.length} 个页面</span>
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
