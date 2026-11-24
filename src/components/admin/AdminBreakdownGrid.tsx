'use client';

import React, { useState, useMemo } from 'react';
import { Monitor, Smartphone, Tablet, Globe } from 'lucide-react';
import { AnalyticsOverviewResponse } from '@/types/analytics';
import {
  countryCodeToFlag,
  formatCompactNumber,
  formatExactInt,
  formatPct,
} from './formatters';

interface AdminBreakdownGridProps {
  breakdowns: AnalyticsOverviewResponse['breakdowns'];
}

const LOCALE_LABELS: Record<string, { pill: string; name: string }> = {
  en: { pill: 'EN', name: 'English' },
  'zh-CN': { pill: '简中', name: '简体中文' },
  'zh-TW': { pill: '繁中', name: '繁體中文' },
  ja: { pill: 'JA', name: '日本語' },
  ko: { pill: 'KO', name: '한국어' },
  es: { pill: 'ES', name: 'Español' },
};

export default function AdminBreakdownGrid({ breakdowns }: AdminBreakdownGridProps) {
  const [refTab, setRefTab] = useState<'all' | 'utm'>('all');

  const tier1Pct = useMemo(() => {
    return breakdowns.countries
      .filter((c) => c.isTier1)
      .reduce((sum, c) => sum + c.sharePct, 0);
  }, [breakdowns.countries]);

  const maxCountryReqs = useMemo(
    () => Math.max(1, ...breakdowns.countries.map((c) => c.requests)),
    [breakdowns.countries]
  );

  const filteredReferrers = useMemo(() => {
    if (refTab === 'utm') {
      return breakdowns.referrers.filter((r) => Boolean(r.utmSource));
    }
    return breakdowns.referrers;
  }, [breakdowns.referrers, refTab]);

  const maxRefCount = useMemo(
    () => Math.max(1, ...filteredReferrers.map((r) => r.count)),
    [filteredReferrers]
  );

  const maxLocaleCount = useMemo(
    () => Math.max(1, ...breakdowns.locales.map((l) => l.count)),
    [breakdowns.locales]
  );

  const maxPartnerCount = useMemo(
    () => Math.max(1, ...breakdowns.partners.map((p) => p.count)),
    [breakdowns.partners]
  );

  const maxEventCount = useMemo(
    () => Math.max(1, ...breakdowns.topEvents.map((e) => e.count)),
    [breakdowns.topEvents]
  );

  const totalDevices = breakdowns.devices.reduce((s, d) => s + d.count, 0);
  const deviceMap = useMemo(() => {
    const map = new Map<string, { count: number; sharePct: number }>();
    for (const d of breakdowns.devices) {
      map.set(d.device, { count: d.count, sharePct: d.sharePct });
    }
    return {
      desktop: map.get('desktop') ?? { count: 0, sharePct: 0 },
      mobile: map.get('mobile') ?? { count: 0, sharePct: 0 },
      tablet: map.get('tablet') ?? { count: 0, sharePct: 0 },
    };
  }, [breakdowns.devices]);

  return (
    <section aria-label="渠道、地域与事件分布" className="grid grid-cols-1 xl:grid-cols-12 gap-4">
      {/* Card A: Top Countries (Edge) */}
      <div className="xl:col-span-6 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md shadow-sm shadow-zinc-950/[0.03] dark:shadow-none space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              国家 / 地区 Top 10
            </h3>
            <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5">
              TOP COUNTRIES · CLOUDFLARE EDGE
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-mono font-medium text-indigo-700 dark:text-indigo-300">
            <Globe className="w-3 h-3" />
            <span>Tier-1 欧美占比 {formatPct(tier1Pct)}</span>
          </span>
        </div>

        {breakdowns.countries.length === 0 ? (
          <p className="py-6 text-center text-xs text-zinc-400">暂无国家分布数据</p>
        ) : (
          <div className="space-y-1.5">
            {breakdowns.countries.map((c) => {
              const barPct = Math.max(2, (c.requests / maxCountryReqs) * 100);
              return (
                <div
                  key={c.code}
                  className="relative min-h-[34px] overflow-hidden rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15 transition-all duration-300"
                    style={{ width: `${barPct}%` }}
                  />
                  <div className="relative flex items-center gap-2 min-w-0">
                    <span aria-hidden="true" className="text-sm leading-none shrink-0">
                      {countryCodeToFlag(c.code)}
                    </span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                      {c.name}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 shrink-0">{c.code}</span>
                  </div>
                  <div className="relative flex items-center gap-3 font-mono tabular-nums shrink-0">
                    <span
                      title={formatExactInt(c.requests)}
                      className="font-semibold text-zinc-900 dark:text-zinc-100"
                    >
                      {c.requests >= 10000
                        ? formatCompactNumber(c.requests)
                        : formatExactInt(c.requests)}
                    </span>
                    <span className="w-11 text-right text-zinc-500 dark:text-zinc-400">
                      {formatPct(c.sharePct)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Card B: Top Referrers & UTM */}
      <div className="xl:col-span-6 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md shadow-sm shadow-zinc-950/[0.03] dark:shadow-none space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              流量来源 Referrer / UTM Top 10
            </h3>
            <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5">
              TOP REFERRERS &amp; CAMPAIGNS · VERIFIED HUMAN
            </p>
          </div>

          <div className="inline-flex p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setRefTab('all')}
              className={`min-h-[30px] px-2.5 rounded-md text-[11px] font-medium transition-colors ${
                refTab === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              全部来源
            </button>
            <button
              type="button"
              onClick={() => setRefTab('utm')}
              className={`min-h-[30px] px-2.5 rounded-md text-[11px] font-medium transition-colors ${
                refTab === 'utm'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              仅 UTM 活动
            </button>
          </div>
        </div>

        {filteredReferrers.length === 0 ? (
          <p className="py-10 text-center text-xs text-zinc-400">
            {refTab === 'utm' ? '暂无带 UTM 标记的访问记录' : '暂无来源渠道数据'}
          </p>
        ) : (
          <div className="space-y-1.5">
            {filteredReferrers.map((r, idx) => {
              const barPct = Math.max(2, (r.count / maxRefCount) * 100);
              return (
                <div
                  key={`${r.source}-${r.utmSource ?? ''}-${idx}`}
                  className="relative min-h-[34px] overflow-hidden rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/15 transition-all duration-300"
                    style={{ width: `${barPct}%` }}
                  />
                  <div className="relative flex items-center gap-2 min-w-0">
                    <span className="font-mono text-zinc-800 dark:text-zinc-200 truncate">
                      {r.source}
                    </span>
                    {r.utmSource && (
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-mono bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        utm:{r.utmSource}
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center gap-3 font-mono tabular-nums shrink-0">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatExactInt(r.count)}
                    </span>
                    <span className="w-11 text-right text-zinc-500 dark:text-zinc-400">
                      {formatPct(r.sharePct)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Card C: 6 Locales & Devices */}
      <div className="xl:col-span-5 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md shadow-sm shadow-zinc-950/[0.03] dark:shadow-none divide-y divide-zinc-200/70 dark:divide-zinc-800/60">
        {/* Locales */}
        <div className="pb-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              6 语种分布
            </h3>
            <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5">
              LOCALES · EN / ZH-CN / ZH-TW / JA / KO / ES
            </p>
          </div>

          <div className="space-y-1.5">
            {breakdowns.locales.map((item) => {
              const info = LOCALE_LABELS[item.locale] ?? {
                pill: item.locale.toUpperCase(),
                name: item.locale,
              };
              const barPct = item.count > 0 ? Math.max(3, (item.count / maxLocaleCount) * 100) : 0;
              return (
                <div
                  key={item.locale}
                  className="relative min-h-[32px] overflow-hidden rounded-lg px-2.5 py-1 flex items-center justify-between gap-2 text-xs"
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15 transition-all duration-300"
                    style={{ width: `${barPct}%` }}
                  />
                  <div className="relative flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center justify-center min-w-[36px] rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/70">
                      {info.pill}
                    </span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-medium truncate">
                      {info.name}
                    </span>
                  </div>
                  <div className="relative flex items-center gap-3 font-mono tabular-nums shrink-0">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatExactInt(item.count)}
                    </span>
                    <span className="w-11 text-right text-zinc-500 dark:text-zinc-400">
                      {formatPct(item.sharePct)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Devices */}
        <div className="pt-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              设备终端分布
            </h3>
            <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5">
              DEVICES · DESKTOP / MOBILE / TABLET
            </p>
          </div>

          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 gap-0.5">
            {totalDevices > 0 ? (
              <>
                {deviceMap.desktop.sharePct > 0 && (
                  <div
                    className="bg-indigo-500 h-full"
                    style={{ width: `${deviceMap.desktop.sharePct}%` }}
                    title={`Desktop ${formatPct(deviceMap.desktop.sharePct)}`}
                  />
                )}
                {deviceMap.mobile.sharePct > 0 && (
                  <div
                    className="bg-cyan-500 h-full"
                    style={{ width: `${deviceMap.mobile.sharePct}%` }}
                    title={`Mobile ${formatPct(deviceMap.mobile.sharePct)}`}
                  />
                )}
                {deviceMap.tablet.sharePct > 0 && (
                  <div
                    className="bg-zinc-400 h-full"
                    style={{ width: `${deviceMap.tablet.sharePct}%` }}
                    title={`Tablet ${formatPct(deviceMap.tablet.sharePct)}`}
                  />
                )}
              </>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-xl border border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/50 p-2.5">
              <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                <Monitor className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">Desktop</span>
              </div>
              <div className="mt-1 font-mono tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                {formatExactInt(deviceMap.desktop.count)}
              </div>
              <div className="text-[10px] font-mono text-zinc-400">
                {formatPct(deviceMap.desktop.sharePct)}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/50 p-2.5">
              <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                <Smartphone className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                <span className="truncate">Mobile</span>
              </div>
              <div className="mt-1 font-mono tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                {formatExactInt(deviceMap.mobile.count)}
              </div>
              <div className="text-[10px] font-mono text-zinc-400">
                {formatPct(deviceMap.mobile.sharePct)}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/50 p-2.5">
              <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                <Tablet className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">Tablet</span>
              </div>
              <div className="mt-1 font-mono tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                {formatExactInt(deviceMap.tablet.count)}
              </div>
              <div className="text-[10px] font-mono text-zinc-400">
                {formatPct(deviceMap.tablet.sharePct)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card D: Partner Outbound & Top Tracked Events */}
      <div className="xl:col-span-7 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md shadow-sm shadow-zinc-950/[0.03] dark:shadow-none">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200/70 dark:divide-zinc-800/60">
          {/* Left: Partner Outbound */}
          <div className="sm:pr-5 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                商业合作方出站排行
              </h3>
              <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5">
                PARTNER OUTBOUND · AFFILIATE &amp; DEALS
              </p>
            </div>

            {breakdowns.partners.length === 0 ? (
              <p className="py-8 text-center text-xs text-zinc-400">暂无合作方出站转化</p>
            ) : (
              <div className="space-y-1.5">
                {breakdowns.partners.map((p) => {
                  const barPct = Math.max(3, (p.count / maxPartnerCount) * 100);
                  return (
                    <div
                      key={p.partner}
                      className="relative min-h-[34px] overflow-hidden rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded-lg bg-emerald-500/12 dark:bg-emerald-500/15 transition-all duration-300"
                        style={{ width: `${barPct}%` }}
                      />
                      <span className="relative font-medium text-zinc-800 dark:text-zinc-200 capitalize truncate">
                        {p.partner.replace(/_/g, ' ')}
                      </span>
                      <div className="relative flex items-center gap-2.5 font-mono tabular-nums shrink-0">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                          {formatExactInt(p.count)}
                        </span>
                        <span className="w-10 text-right text-zinc-500 dark:text-zinc-400">
                          {formatPct(p.sharePct)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Top Events */}
          <div className="pt-4 sm:pt-0 sm:pl-5 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                热门交互事件
              </h3>
              <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5">
                TOP TRACKED EVENTS
              </p>
            </div>

            {breakdowns.topEvents.length === 0 ? (
              <p className="py-8 text-center text-xs text-zinc-400">暂无交互事件记录</p>
            ) : (
              <div className="space-y-1.5">
                {breakdowns.topEvents.map((ev) => {
                  const barPct = Math.max(3, (ev.count / maxEventCount) * 100);
                  return (
                    <div
                      key={ev.event}
                      className="relative min-h-[34px] overflow-hidden rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15 transition-all duration-300"
                        style={{ width: `${barPct}%` }}
                      />
                      <span className="relative font-mono text-[11px] text-zinc-800 dark:text-zinc-200 truncate">
                        {ev.event}
                      </span>
                      <div className="relative flex items-center gap-2.5 font-mono tabular-nums shrink-0">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {formatExactInt(ev.count)}
                        </span>
                        <span className="w-10 text-right text-zinc-500 dark:text-zinc-400">
                          {formatPct(ev.sharePct)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
