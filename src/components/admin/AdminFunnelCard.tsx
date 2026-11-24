'use client';

import React from 'react';
import { ChevronRight, ArrowDown } from 'lucide-react';
import { AnalyticsOverviewResponse } from '@/types/analytics';
import { formatExactInt, formatPct } from './formatters';

interface AdminFunnelCardProps {
  funnel: AnalyticsOverviewResponse['funnel'];
}

const STEP_COLORS: Record<1 | 2 | 3 | 4, { bar: string; badge: string }> = {
  1: {
    bar: 'bg-zinc-400/75 dark:bg-zinc-500/75',
    badge: 'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800',
  },
  2: {
    bar: 'bg-indigo-500',
    badge: 'text-indigo-700 dark:text-indigo-300 bg-indigo-500/10',
  },
  3: {
    bar: 'bg-cyan-500',
    badge: 'text-cyan-700 dark:text-cyan-300 bg-cyan-500/10',
  },
  4: {
    bar: 'bg-emerald-500',
    badge: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10',
  },
};

export default function AdminFunnelCard({ funnel }: AdminFunnelCardProps) {
  const firstStep = funnel[0]?.sessions ?? 0;
  const lastStep = funnel[funnel.length - 1]?.sessions ?? 0;
  const overallCvr = firstStep > 0 ? (lastStep / firstStep) * 100 : 0;

  return (
    <section
      aria-label="核心商业转化漏斗"
      className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md shadow-sm shadow-zinc-950/[0.03] dark:shadow-none"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            核心商业转化漏斗
          </h2>
          <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5">
            CONVERSION FUNNEL · VERIFIED HUMAN SESSIONS
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-700 dark:text-emerald-300">
          <span>总转化率 Overall CVR:</span>
          <span className="font-bold tabular-nums">{formatPct(overallCvr, 2)}</span>
          <span className="text-[11px] opacity-75">
            ({formatExactInt(lastStep)} / {formatExactInt(firstStep)})
          </span>
        </div>
      </div>

      {/* Desktop / Tablet Horizontal Stepped Funnel */}
      <div className="hidden md:grid md:grid-cols-4 gap-4 items-stretch">
        {funnel.map((stage, idx) => {
          const style = STEP_COLORS[stage.step] || STEP_COLORS[1];
          const barWidth = stage.sessions > 0 ? Math.max(4, Math.min(100, stage.pctOfTotal)) : 0;
          const dropOff = Math.max(0, 100 - stage.stepConversionPct);

          return (
            <div key={stage.key} className="relative flex flex-col justify-between rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/50 p-4">
              {idx > 0 && (
                <div
                  title={`相较上一阶段流失 Drop-off -${dropOff.toFixed(1)}%`}
                  className="hidden md:flex items-center gap-0.5 absolute -left-3.5 top-1/2 -translate-y-1/2 z-10 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-zinc-600 dark:text-zinc-300 shadow-sm"
                >
                  <ChevronRight className="w-3 h-3 text-zinc-400" />
                  <span>{formatPct(stage.stepConversionPct)}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold ${style.badge}`}>
                    0{stage.step}
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                    占总流量 {formatPct(stage.pctOfTotal)}
                  </span>
                </div>

                <div className="mt-2.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {stage.labelZh}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {stage.labelEn}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-50">
                    {formatExactInt(stage.sessions)}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                    sessions
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-zinc-200/80 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${style.bar}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Vertical Stacked Funnel (360px+) */}
      <div className="md:hidden space-y-2">
        {funnel.map((stage, idx) => {
          const style = STEP_COLORS[stage.step] || STEP_COLORS[1];
          const barWidth = stage.sessions > 0 ? Math.max(4, Math.min(100, stage.pctOfTotal)) : 0;

          return (
            <div key={stage.key}>
              {idx > 0 && (
                <div className="flex items-center gap-2 pl-3 py-1">
                  <span className="h-4 border-l border-dashed border-zinc-300 dark:border-zinc-700" />
                  <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2 py-0.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-300">
                    <ArrowDown className="w-2.5 h-2.5 text-zinc-400" />
                    <span>阶梯留存 {formatPct(stage.stepConversionPct)}</span>
                  </span>
                </div>
              )}

              <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/50 p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold shrink-0 ${style.badge}`}>
                      0{stage.step}
                    </span>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {stage.labelZh}
                    </span>
                  </div>
                  <span className="text-sm font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-50 shrink-0">
                    {formatExactInt(stage.sessions)}
                    <span className="ml-1.5 text-[11px] font-normal text-zinc-500">
                      ({formatPct(stage.pctOfTotal)})
                    </span>
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-zinc-200/80 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${style.bar}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
