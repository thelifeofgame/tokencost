'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Zap, HelpCircle, RefreshCw, LogOut } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { AnalyticsRange } from '@/types/analytics';
import { formatTimeHms } from './formatters';

interface AdminHeaderProps {
  range: AnalyticsRange;
  onRangeChange: (next: AnalyticsRange) => void;
  healthStatus: 'live' | 'stale' | 'degraded';
  syncedAt?: string;
  refreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}

const RANGE_OPTIONS: Array<{ value: AnalyticsRange; label: string }> = [
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
];

export default function AdminHeader({
  range,
  onRangeChange,
  healthStatus,
  syncedAt,
  refreshing,
  onRefresh,
  onLogout,
}: AdminHeaderProps) {
  const [infoOpen, setInfoOpen] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!infoOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setInfoOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [infoOpen]);

  const badgeStyle =
    healthStatus === 'live'
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
      : healthStatus === 'stale'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
        : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300';

  const dotColor =
    healthStatus === 'live'
      ? 'bg-emerald-500 animate-pulse motion-reduce:animate-none'
      : healthStatus === 'stale'
        ? 'bg-amber-500'
        : 'bg-rose-500';

  const badgeText =
    healthStatus === 'live' ? 'LIVE' : healthStatus === 'stale' ? 'CACHE' : 'DEGRADED';

  const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950';

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop & Tablet Single-Row */}
        <div className="hidden md:flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-500/25 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
              TokenCosts Analytics
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-mono font-medium ${badgeStyle}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
              <span>{badgeText}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Segmented Control */}
            <div
              role="tablist"
              aria-label="统计时间范围"
              className="inline-flex p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800"
            >
              {RANGE_OPTIONS.map((opt) => {
                const selected = range === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => onRangeChange(opt.value)}
                    className={`min-h-[32px] px-3 rounded-lg text-xs font-mono font-medium transition-all ${focusRing} ${
                      selected
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Data Methodology Popover */}
            <div className="relative" ref={infoRef}>
              <button
                type="button"
                onClick={() => setInfoOpen((v) => !v)}
                aria-expanded={infoOpen}
                className={`inline-flex items-center gap-1 h-9 px-2.5 rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors ${focusRing}`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                <span>口径</span>
              </button>

              {infoOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xl z-50 space-y-3 text-xs">
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Cloudflare Edge (全站边缘口径)
                    </div>
                    <p className="mt-0.5 text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      包含页面拉取、静态资源、API 及搜索引擎爬虫，真实反映全站服务器与 CDN 边缘负载。
                    </p>
                  </div>
                  <div className="pt-2.5 border-t border-zinc-200/70 dark:border-zinc-800">
                    <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                      Verified Human (第一方人类口径)
                    </div>
                    <p className="mt-0.5 text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      经浏览器 JS 匿名上报并通过服务端反爬过滤的真实人类 PV、独立会话、交互点击与商业转化。
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sync timestamp + Refresh */}
            {syncedAt && (
              <span className="hidden xl:inline text-[11px] font-mono tabular-nums text-zinc-400 dark:text-zinc-500 px-1">
                同步于 {formatTimeHms(syncedAt)}
              </span>
            )}
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="刷新数据"
              title="手动同步最新数据"
              className={`h-9 w-9 inline-flex items-center justify-center rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-50 ${focusRing}`}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin motion-reduce:animate-none' : ''}`}
              />
            </button>

            <ThemeToggle />

            <button
              type="button"
              onClick={onLogout}
              className={`inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-500/40 transition-colors ${focusRing}`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>退出</span>
            </button>
          </div>
        </div>

        {/* Mobile Two-Row (< 768px) */}
        <div className="md:hidden py-2.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
                TokenCosts Analytics
              </span>
              <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} title={badgeText} />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                aria-label="刷新数据"
                className={`min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 ${focusRing}`}
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? 'animate-spin motion-reduce:animate-none' : ''}`}
                />
              </button>
              <ThemeToggle size="mobile" />
              <button
                type="button"
                onClick={onLogout}
                aria-label="退出登录"
                className={`min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 ${focusRing}`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              role="tablist"
              aria-label="统计时间范围"
              className="flex-1 grid grid-cols-3 p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800"
            >
              {RANGE_OPTIONS.map((opt) => {
                const selected = range === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => onRangeChange(opt.value)}
                    className={`min-h-[36px] rounded-lg text-xs font-mono font-medium transition-all ${focusRing} ${
                      selected
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setInfoOpen((v) => !v)}
              aria-label="数据口径说明"
              aria-expanded={infoOpen}
              className={`min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 ${focusRing}`}
            >
              <HelpCircle className="w-4 h-4 text-indigo-500" />
            </button>
          </div>

          {infoOpen && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-xs space-y-2 shadow-lg">
              <div>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">Cloudflare Edge：</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  含页面、资源、API 与爬虫，反映全站 CDN 负载。
                </span>
              </div>
              <div>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  Verified Human：
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  过滤爬虫后的真实人类访问、点击与商业出站转化。
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
