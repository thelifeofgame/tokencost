'use client';

import React from 'react';
import { ShieldAlert, HardDrive } from 'lucide-react';
import { AnalyticsOverviewResponse } from '@/types/analytics';
import {
  countryCodeToFlag,
  formatBytes,
  formatExactInt,
  formatPct,
  formatTimeHms,
} from './formatters';

interface AdminHealthAndFeedProps {
  httpHealth: AnalyticsOverviewResponse['httpHealth'];
  liveFeed: AnalyticsOverviewResponse['liveFeed'];
}

function getCategoryBadge(
  category: AnalyticsOverviewResponse['liveFeed'][number]['category']
): { label: string; cls: string } {
  switch (category) {
    case 'conversion':
      return {
        label: '转化出站',
        cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
      };
    case 'high_intent':
      return {
        label: '高意向',
        cls: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25',
      };
    case 'tool_interact':
      return {
        label: '互动',
        cls: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25',
      };
    case 'page_view':
      return {
        label: '浏览',
        cls: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
      };
    default:
      return {
        label: '偏好',
        cls: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
      };
  }
}

export default function AdminHealthAndFeed({
  httpHealth,
  liveFeed,
}: AdminHealthAndFeedProps) {
  const totalStatuses =
    httpHealth.status2xx + httpHealth.status3xx + httpHealth.status4xx + httpHealth.status5xx;
  const pct = (val: number) => (totalStatuses > 0 ? (val / totalStatuses) * 100 : 0);

  const p2xx = pct(httpHealth.status2xx);
  const p3xx = pct(httpHealth.status3xx);
  const p4xx = pct(httpHealth.status4xx);
  const p5xx = pct(httpHealth.status5xx);

  const statusRows = [
    { label: '2xx 成功', count: httpHealth.status2xx, share: p2xx, dot: 'bg-emerald-500' },
    { label: '3xx 重定向', count: httpHealth.status3xx, share: p3xx, dot: 'bg-cyan-500' },
    { label: '4xx 客户端错误', count: httpHealth.status4xx, share: p4xx, dot: 'bg-amber-500' },
    { label: '5xx 服务端异常', count: httpHealth.status5xx, share: p5xx, dot: 'bg-rose-500' },
  ];

  return (
    <section
      aria-label="站点健康度与实时行为流"
      className="grid grid-cols-1 lg:grid-cols-12 gap-4"
    >
      {/* Left: Site Health */}
      <div className="lg:col-span-4 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md shadow-sm shadow-zinc-950/[0.03] dark:shadow-none flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                HTTP 状态健康度
              </h3>
              <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5">
                SITE HEALTH · EDGE STATUS
              </p>
            </div>
            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-mono font-medium text-emerald-700 dark:text-emerald-300">
              2xx 占比 {formatPct(p2xx)}
            </span>
          </div>

          <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 gap-0.5">
            {totalStatuses > 0 && (
              <>
                {httpHealth.status2xx > 0 && (
                  <div className="bg-emerald-500 h-full" style={{ width: `${p2xx}%` }} />
                )}
                {httpHealth.status3xx > 0 && (
                  <div className="bg-cyan-500 h-full" style={{ width: `${p3xx}%` }} />
                )}
                {httpHealth.status4xx > 0 && (
                  <div className="bg-amber-500 h-full" style={{ width: `${p4xx}%` }} />
                )}
                {httpHealth.status5xx > 0 && (
                  <div
                    className="bg-rose-500 h-full min-w-[3px]"
                    style={{ width: `${p5xx}%` }}
                  />
                )}
              </>
            )}
          </div>

          <div className="space-y-2 text-xs">
            {statusRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-2 py-1 border-b border-zinc-200/50 dark:border-zinc-800/50 last:border-0"
              >
                <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <span className={`w-2 h-2 rounded-full ${row.dot}`} />
                  <span>{row.label}</span>
                </span>
                <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                  {formatExactInt(row.count)}
                  <span className="ml-2 text-zinc-400">({formatPct(row.share)})</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Bandwidth */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-zinc-200/70 dark:border-zinc-800/70">
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">已拦截威胁</span>
            </div>
            <div className="mt-1 text-base font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatExactInt(httpHealth.threats)}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <HardDrive className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">总传输流量</span>
            </div>
            <div className="mt-1 text-base font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatBytes(httpHealth.bytes)}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Live Human Activity Feed */}
      <div className="lg:col-span-8 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md shadow-sm shadow-zinc-950/[0.03] dark:shadow-none space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              最近 20 条真实用户行为实时流
            </h3>
            <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5">
              LIVE HUMAN ACTIVITY FEED
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-mono font-medium text-emerald-700 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none" />
            <span>已过滤爬虫 · Latest 20 Events</span>
          </span>
        </div>

        {liveFeed.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400 dark:text-zinc-500">
            暂无人类交互事件流，访问主站并触发点击后将实时出现于此
          </div>
        ) : (
          <div className="max-h-[340px] overflow-y-auto custom-scrollbar divide-y divide-zinc-200/60 dark:divide-zinc-800/50 pr-1">
            {liveFeed.map((item) => {
              const badge = getCategoryBadge(item.category);
              return (
                <div
                  key={item.id}
                  className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 text-xs"
                >
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span
                      className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                    <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {item.event}
                      {item.target ? ` · ${item.target}` : ''}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {item.path}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                    <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-300">
                      {[
                        item.locale || 'en',
                        item.device || 'desktop',
                        item.country ? `${countryCodeToFlag(item.country)} ${item.country}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    <span className="font-mono tabular-nums text-[11px] text-zinc-400 dark:text-zinc-500">
                      {formatTimeHms(item.ts)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
