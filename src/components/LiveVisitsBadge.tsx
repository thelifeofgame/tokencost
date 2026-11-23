'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import type { LiveVisitsStatus } from '@/hooks/useLiveVisits24h';

export type { LiveVisitsStatus };

interface LiveVisitsBadgeProps {
  count: number | null;
  status: LiveVisitsStatus;
  /**
   * - navbar_desktop: 完整显示 [● 24h · 7,349]
   * - navbar_mobile: <480px 隐藏 "24h ·" 仅显示 [● 7,349]，>=480px 显示完整版
   * - mobile_drawer: 抽屉顶部全宽遥测横幅卡片
   */
  variant?: 'navbar_desktop' | 'navbar_mobile' | 'mobile_drawer';
  className?: string;
}

export default function LiveVisitsBadge({
  count,
  status,
  variant = 'navbar_desktop',
  className = '',
}: LiveVisitsBadgeProps) {
  const { t, currentLocaleConfig } = useI18n();
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCountRef = useRef<number | null>(null);
  const tooltipId = useId();

  // Trigger subtle 200ms fade transition when count updates
  useEffect(() => {
    if (count !== null && count > 0) {
      if (prevCountRef.current !== null && prevCountRef.current !== count) {
        setJustUpdated(true);
        const timer = setTimeout(() => setJustUpdated(false), 200);
        prevCountRef.current = count;
        return () => clearTimeout(timer);
      }
      prevCountRef.current = count;
    }
    return undefined;
  }, [count]);

  // Close popover on outside click / Escape
  useEffect(() => {
    if (!open) return undefined;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setPinned(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setPinned(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  // Clean up hover timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  // Gracefully collapse on error or invalid value when no cached count exists
  if (status === 'error' || (status !== 'loading' && (count === null || count <= 0))) {
    return null;
  }

  const formattedCount =
    count !== null
      ? new Intl.NumberFormat(currentLocaleConfig.numberFormatLocale, {
          useGrouping: 'always' as unknown as boolean,
        }).format(count)
      : '';

  const lv = t.nav.liveVisits;
  const isStale = status === 'stale';

  const handleMouseEnter = () => {
    if (variant !== 'navbar_desktop') return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setOpen(true);
    }, 120);
  };

  const handleMouseLeave = () => {
    if (variant !== 'navbar_desktop') return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (pinned) return;
    hoverTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, 120);
  };

  const handleToggleClick = () => {
    if (variant === 'navbar_desktop') {
      setPinned((prevPinned) => {
        const nextPinned = !prevPinned;
        setOpen(nextPinned);
        return nextPinned;
      });
    } else {
      setOpen((prev) => !prev);
    }
  };

  // 1. Mobile Drawer top telemetry banner
  if (variant === 'mobile_drawer') {
    if (status === 'loading') {
      return (
        <div
          aria-hidden="true"
          className={`flex items-center justify-between rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/60 px-3 py-2.5 ${className}`}
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span className="h-3 w-28 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
          <span className="h-4 w-12 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>
      );
    }

    return (
      <div
        className={`flex items-center justify-between gap-2 rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-zinc-100/70 dark:bg-zinc-900/70 px-3 py-2.5 ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            {!isStale && (
              <span className="motion-reduce:animate-none animate-[ping_2.4s_cubic-bezier(0,0,0.2,1)_infinite] absolute inline-flex h-full w-full rounded-full bg-emerald-500/55 dark:bg-emerald-400/60" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isStale
                  ? 'bg-zinc-400 dark:bg-zinc-500'
                  : 'bg-emerald-600 dark:bg-emerald-400'
              }`}
            />
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
              {lv.drawerLabel}
            </span>
            {isStale && (
              <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 truncate">
                {lv.staleHint}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`font-mono tabular-nums text-xs font-semibold text-zinc-900 dark:text-zinc-100 transition-opacity duration-200 ${
              justUpdated ? 'opacity-60' : 'opacity-100'
            }`}
          >
            {formattedCount}
          </span>
          <span className="rounded-md bg-emerald-500/10 border border-emerald-600/20 dark:border-emerald-400/20 px-1.5 py-0.5 text-[9px] font-mono font-semibold uppercase text-emerald-700 dark:text-emerald-400">
            {lv.windowTag}
          </span>
        </div>
      </div>
    );
  }

  // 2. Top-bar Skeleton (Zero-CLS fixed min-width)
  if (status === 'loading') {
    const minWidthClass =
      variant === 'navbar_mobile'
        ? 'min-w-[60px] min-[480px]:min-w-[88px]'
        : 'min-w-[86px] xl:min-w-[94px]';
    return (
      <div
        aria-hidden="true"
        className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/60 px-2 xl:px-2.5 shrink-0 ${minWidthClass} ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 shrink-0" />
        <span className="h-3 w-11 rounded bg-zinc-200/80 dark:bg-zinc-800/80 animate-pulse" />
      </div>
    );
  }

  const ariaLabel = lv.ariaLabel.replace('{count}', formattedCount);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center shrink-0 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={handleToggleClick}
        onFocus={() => setOpen(true)}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setOpen(false);
            setPinned(false);
          }
        }}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        className={`group relative inline-flex h-8 items-center gap-1.5 rounded-full border border-zinc-200/90 dark:border-zinc-800/90 bg-zinc-100/85 dark:bg-zinc-900/75 hover:bg-white dark:hover:bg-zinc-900 hover:border-emerald-500/45 dark:hover:border-emerald-500/35 shadow-sm shadow-zinc-950/[0.03] dark:shadow-none hover:shadow-emerald-500/10 dark:hover:shadow-[0_0_12px_-3px_rgba(16,185,129,0.22)] transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950 ${
          variant === 'navbar_mobile'
            ? 'px-2 text-[11px] after:content-[""] after:absolute after:-inset-1.5'
            : 'px-2 xl:px-2.5 text-[11px] xl:text-xs'
        }`}
      >
        {/* Live Pulsing Dot */}
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {!isStale && (
            <span className="motion-reduce:animate-none animate-[ping_2.4s_cubic-bezier(0,0,0.2,1)_infinite] absolute inline-flex h-full w-full rounded-full bg-emerald-500/55 dark:bg-emerald-400/60" />
          )}
          <span
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
              isStale
                ? 'bg-zinc-400 dark:bg-zinc-500'
                : 'bg-emerald-600 dark:bg-emerald-400'
            }`}
          />
        </span>

        {/* 24h Prefix (hidden below 480px on mobile to save 22px breathing room) */}
        <span
          className={`items-center gap-1 text-[10px] font-medium tracking-tight text-zinc-600 dark:text-zinc-400 ${
            variant === 'navbar_mobile' ? 'hidden min-[480px]:inline-flex' : 'inline-flex'
          }`}
        >
          <span>{lv.windowTag}</span>
          <span aria-hidden="true" className="text-zinc-400 dark:text-zinc-600">
            ·
          </span>
        </span>

        {/* Real-time Count */}
        <span
          className={`font-mono tabular-nums font-semibold text-zinc-900 dark:text-zinc-100 leading-none transition-opacity duration-200 ${
            justUpdated ? 'opacity-60' : 'opacity-100'
          }`}
        >
          {formattedCount}
        </span>
      </button>

      {/* Hover / Tap Popover Tooltip */}
      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          className="fixed left-4 right-4 top-[68px] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 z-50 sm:w-72 origin-top sm:origin-top-right rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-xl shadow-zinc-950/10 dark:shadow-2xl dark:shadow-black/60 p-3.5 text-left transition-all duration-150 ease-out"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isStale ? 'bg-zinc-400 dark:bg-zinc-500' : 'bg-emerald-600 dark:bg-emerald-400'
                }`}
              />
              <span>{lv.tooltipBadge}</span>
            </div>
            <span className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900 px-2 py-0.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
              {lv.windowTag}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono tabular-nums text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {formattedCount}
            </span>
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {lv.tooltipTitle}
            </span>
          </div>

          <p className="mt-2 pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            {lv.tooltipDesc}
          </p>

          {isStale && (
            <p className="mt-1.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
              {lv.staleHint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
