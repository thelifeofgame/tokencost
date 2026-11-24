'use client';

import React, { useState, useMemo, useRef, useId } from 'react';
import { BarChart3 } from 'lucide-react';
import { AnalyticsRange } from '@/types/analytics';
import { formatCompactNumber, formatExactInt } from './formatters';

export interface TrendSeriesDef<T> {
  key: string;
  label: string;
  colorLight: string;
  colorDark: string;
  dotClass: string;
  hasArea?: boolean;
  dashed?: boolean;
  getValue: (item: T) => number;
}

interface AdminTrendChartProps<T extends { bucket: string; label: string }> {
  title: string;
  subtitleEn: string;
  range: AnalyticsRange;
  data: T[];
  series: TrendSeriesDef<T>[];
  ariaSummary: string;
}

const SVG_W = 640;
const SVG_H = 240;
const PAD = { top: 16, right: 16, bottom: 28, left: 48 };
const PLOT_W = SVG_W - PAD.left - PAD.right; // 576
const PLOT_H = SVG_H - PAD.top - PAD.bottom; // 196
const BASELINE_Y = PAD.top + PLOT_H; // 212

function niceMax(rawMax: number): number {
  if (!Number.isFinite(rawMax) || rawMax <= 0) return 12;
  const exp = Math.floor(Math.log10(rawMax));
  const mag = 10 ** exp;
  const norm = rawMax / mag;
  const steps = [1.2, 1.5, 2.4, 3, 4.5, 6, 7.5, 9, 12];
  const chosen = steps.find((s) => s >= norm) ?? 12;
  return Math.max(3, Math.round(chosen * mag));
}

function buildMonotonePath(pts: Array<{ x: number; y: number }>): string {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  if (n === 2) {
    return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} L ${pts[1].x.toFixed(2)} ${pts[1].y.toFixed(2)}`;
  }

  const dx: number[] = [];
  const dy: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    const xi = pts[i + 1].x - pts[i].x;
    const yi = pts[i + 1].y - pts[i].y;
    dx.push(xi);
    dy.push(yi);
    d.push(xi !== 0 ? yi / xi : 0);
  }

  const m: number[] = new Array(n).fill(0);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i += 1) {
    if (d[i - 1] * d[i] <= 0) {
      m[i] = 0;
    } else {
      m[i] = (d[i - 1] + d[i]) / 2;
    }
  }

  for (let i = 0; i < n - 1; i += 1) {
    if (Math.abs(d[i]) < 1e-9) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const a = m[i] / d[i];
      const b = m[i + 1] / d[i];
      const h = Math.hypot(a, b);
      if (h > 3) {
        const t = 3 / h;
        m[i] = t * a * d[i];
        m[i + 1] = t * b * d[i];
      }
    }
  }

  let path = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i += 1) {
    const h = dx[i] / 3;
    const cp1x = pts[i].x + h;
    const cp1y = Math.min(BASELINE_Y, Math.max(PAD.top, pts[i].y + h * m[i]));
    const cp2x = pts[i + 1].x - h;
    const cp2y = Math.min(BASELINE_Y, Math.max(PAD.top, pts[i + 1].y - h * m[i + 1]));
    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${pts[i + 1].x.toFixed(2)} ${pts[i + 1].y.toFixed(2)}`;
  }
  return path;
}

function formatAxisLabel(bucket: string, fallbackLabel: string, range: AnalyticsRange): string {
  if (range === '24h') {
    const d = new Date(bucket);
    if (!Number.isNaN(d.getTime())) {
      return `${String(d.getHours()).padStart(2, '0')}:00`;
    }
  }
  return fallbackLabel;
}

function formatTooltipTime(bucket: string, fallbackLabel: string, range: AnalyticsRange): string {
  if (range === '24h') {
    const d = new Date(bucket);
    if (!Number.isNaN(d.getTime())) {
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      return `${mo}/${da} ${hh}:00`;
    }
  }
  return bucket || fallbackLabel;
}

export default function AdminTrendChart<T extends { bucket: string; label: string }>({
  title,
  subtitleEn,
  range,
  data,
  series,
  ariaSummary,
}: AdminTrendChartProps<T>) {
  const gradId = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const [visibleKeys, setVisibleKeys] = useState<string[]>(() => series.map((s) => s.key));
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const effectiveVisible = useMemo(() => {
    const valid = series.filter((s) => visibleKeys.includes(s.key));
    return valid.length > 0 ? valid : [series[0]];
  }, [series, visibleKeys]);

  const toggleSeries = (key: string) => {
    setVisibleKeys((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev;
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  const yMax = useMemo(() => {
    let maxVal = 0;
    for (const item of data) {
      for (const s of effectiveVisible) {
        const v = s.getValue(item);
        if (v > maxVal) maxVal = v;
      }
    }
    return niceMax(maxVal);
  }, [data, effectiveVisible]);

  const computedSeries = useMemo(() => {
    const n = data.length;
    if (n === 0) return [];
    return effectiveVisible.map((s) => {
      const pts = data.map((item, idx) => {
        const x = n === 1 ? PAD.left + PLOT_W / 2 : PAD.left + (idx / (n - 1)) * PLOT_W;
        const val = Math.max(0, s.getValue(item));
        const y = BASELINE_Y - Math.min(1, val / yMax) * PLOT_H;
        return { x, y, val };
      });
      const linePath = buildMonotonePath(pts);
      const areaPath =
        s.hasArea && pts.length >= 2
          ? `${linePath} L ${pts[pts.length - 1].x.toFixed(2)} ${BASELINE_Y} L ${pts[0].x.toFixed(2)} ${BASELINE_Y} Z`
          : '';
      return { def: s, pts, linePath, areaPath };
    });
  }, [data, effectiveVisible, yMax]);

  const xTicks = useMemo(() => {
    const n = data.length;
    if (n === 0) return [];
    const step = range === '24h' ? 4 : range === '7d' ? 1 : 6;
    const indices: number[] = [];
    for (let i = 0; i < n; i += step) {
      indices.push(i);
    }
    if (indices[indices.length - 1] !== n - 1 && n - 1 - indices[indices.length - 1] >= (range === '24h' ? 2 : 3)) {
      indices.push(n - 1);
    }
    return indices.map((idx) => {
      const x = n === 1 ? PAD.left + PLOT_W / 2 : PAD.left + (idx / (n - 1)) * PLOT_W;
      const anchor: 'start' | 'middle' | 'end' =
        idx === 0 ? 'start' : idx === n - 1 ? 'end' : 'middle';
      return {
        idx,
        x,
        anchor,
        text: formatAxisLabel(data[idx].bucket, data[idx].label, range),
      };
    });
  }, [data, range]);

  const updateIndexFromClientX = (clientX: number) => {
    if (!svgRef.current || data.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const svgX = ((clientX - rect.left) / rect.width) * SVG_W;
    const ratio = Math.max(0, Math.min(1, (svgX - PAD.left) / PLOT_W));
    const idx = data.length === 1 ? 0 : Math.round(ratio * (data.length - 1));
    setActiveIndex(idx);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (data.length === 0) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveIndex((prev) => (prev === null ? 0 : Math.min(data.length - 1, prev + 1)));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveIndex((prev) => (prev === null ? data.length - 1 : Math.max(0, prev - 1)));
    } else if (e.key === 'Escape') {
      setActiveIndex(null);
    }
  };

  const activeDatum = activeIndex !== null && data[activeIndex] ? data[activeIndex] : null;
  const activeX =
    activeIndex !== null && data.length > 0
      ? data.length === 1
        ? PAD.left + PLOT_W / 2
        : PAD.left + (activeIndex / (data.length - 1)) * PLOT_W
      : 0;
  const flipTooltipLeft = activeIndex !== null && activeIndex > data.length * 0.62;
  const activePctLeft = (activeX / SVG_W) * 100;

  return (
    <div className="relative rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md shadow-sm shadow-zinc-950/[0.03] dark:shadow-none">
      {/* Header + Interactive Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
          <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5">
            {subtitleEn}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {series.map((s) => {
            const active = effectiveVisible.some((v) => v.key === s.key);
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => toggleSeries(s.key)}
                aria-pressed={active}
                className={`min-h-[32px] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  active
                    ? 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-100'
                    : 'border-zinc-200/60 dark:border-zinc-800/60 bg-transparent text-zinc-400 dark:text-zinc-500 opacity-60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${s.dotClass}`} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Area */}
      {data.length < 2 ? (
        <div className="h-[210px] sm:h-[240px] flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 gap-2">
          <BarChart3 className="w-6 h-6" />
          <span className="text-xs">暂无足够时间序列数据</span>
        </div>
      ) : (
        <div
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onBlur={() => setActiveIndex(null)}
          className="relative h-[210px] sm:h-[240px] w-full select-none rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            role="img"
            aria-label={ariaSummary}
            onPointerDown={(e) => updateIndexFromClientX(e.clientX)}
            onPointerMove={(e) => updateIndexFromClientX(e.clientX)}
            onPointerLeave={() => setActiveIndex(null)}
            className="w-full h-full overflow-visible touch-pan-y cursor-crosshair"
          >
            <defs>
              {computedSeries.map((cs) =>
                cs.def.hasArea ? (
                  <linearGradient
                    key={cs.def.key}
                    id={`${gradId}-${cs.def.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={cs.def.colorDark} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={cs.def.colorDark} stopOpacity="0" />
                  </linearGradient>
                ) : null
              )}
            </defs>

            {/* Horizontal Gridlines & Y Labels (0%, 33%, 66%, 100%) */}
            {[0, 1 / 3, 2 / 3, 1].map((ratio, idx) => {
              const y = BASELINE_Y - ratio * PLOT_H;
              const tickVal = Math.round(yMax * ratio);
              return (
                <g key={idx}>
                  <line
                    x1={PAD.left}
                    y1={y}
                    x2={SVG_W - PAD.right}
                    y2={y}
                    stroke="currentColor"
                    strokeDasharray={ratio === 0 ? undefined : '3 3'}
                    strokeWidth="1"
                    className={
                      ratio === 0
                        ? 'text-zinc-200 dark:text-zinc-800'
                        : 'text-zinc-200/80 dark:text-zinc-800/70'
                    }
                  />
                  <text
                    x={PAD.left - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-zinc-400 dark:fill-zinc-500 font-mono text-[10px]"
                  >
                    {formatCompactNumber(tickVal)}
                  </text>
                </g>
              );
            })}

            {/* X-Axis Labels */}
            {xTicks.map((tick) => (
              <text
                key={tick.idx}
                x={tick.x}
                y={228}
                textAnchor={tick.anchor}
                className="fill-zinc-400 dark:fill-zinc-500 font-mono text-[10px]"
              >
                {tick.text}
              </text>
            ))}

            {/* Area Fills */}
            {computedSeries.map((cs) =>
              cs.areaPath ? (
                <path
                  key={`area-${cs.def.key}`}
                  d={cs.areaPath}
                  fill={`url(#${gradId}-${cs.def.key})`}
                />
              ) : null
            )}

            {/* Smooth Lines */}
            {computedSeries.map((cs) => (
              <path
                key={`line-${cs.def.key}`}
                d={cs.linePath}
                fill="none"
                stroke={cs.def.colorDark}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={cs.def.dashed ? '5 4' : undefined}
              />
            ))}

            {/* Active Crosshair & Markers */}
            {activeIndex !== null && (
              <g>
                <line
                  x1={activeX}
                  y1={PAD.top}
                  x2={activeX}
                  y2={BASELINE_Y}
                  stroke="currentColor"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                  className="text-zinc-400 dark:text-zinc-500"
                />
                {computedSeries.map((cs) => {
                  const pt = cs.pts[activeIndex];
                  if (!pt) return null;
                  return (
                    <circle
                      key={`pt-${cs.def.key}`}
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill={cs.def.colorDark}
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-white dark:text-zinc-900"
                    />
                  );
                })}
              </g>
            )}
          </svg>

          {/* HTML Floating Tooltip */}
          {activeDatum && activeIndex !== null && (
            <div
              className="pointer-events-none absolute top-2 z-20 min-w-[164px] rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-white/95 dark:bg-zinc-900/95 px-3 py-2 shadow-lg backdrop-blur-md text-xs"
              style={
                flipTooltipLeft
                  ? { right: `${Math.max(2, 100 - activePctLeft + 2)}%` }
                  : { left: `${Math.min(72, activePctLeft + 2)}%` }
              }
            >
              <div className="font-mono text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 pb-1.5 mb-1.5 border-b border-zinc-200/70 dark:border-zinc-800">
                {formatTooltipTime(activeDatum.bucket, activeDatum.label, range)}
              </div>
              <div className="space-y-1">
                {effectiveVisible.map((s) => (
                  <div key={s.key} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                      <span className={`w-2 h-2 rounded-full ${s.dotClass}`} />
                      <span>{s.label}</span>
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatExactInt(s.getValue(activeDatum))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Screen-reader live region for keyboard inspection */}
          <div className="sr-only" aria-live="polite">
            {activeDatum
              ? `${formatTooltipTime(activeDatum.bucket, activeDatum.label, range)}: ${effectiveVisible
                  .map((s) => `${s.label} ${formatExactInt(s.getValue(activeDatum))}`)
                  .join(', ')}`
              : ''}
          </div>
        </div>
      )}
    </div>
  );
}
