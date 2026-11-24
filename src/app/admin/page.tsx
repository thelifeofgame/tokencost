'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { AnalyticsOverviewResponse, AnalyticsRange } from '@/types/analytics';
import AdminLockScreen from '@/components/admin/AdminLockScreen';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminKpiGrid from '@/components/admin/AdminKpiGrid';
import AdminTrendChart, { TrendSeriesDef } from '@/components/admin/AdminTrendChart';
import AdminFunnelCard from '@/components/admin/AdminFunnelCard';
import AdminPageTable from '@/components/admin/AdminPageTable';
import AdminBreakdownGrid from '@/components/admin/AdminBreakdownGrid';
import AdminHealthAndFeed from '@/components/admin/AdminHealthAndFeed';
import { formatExactInt, getAnalyticsBaseUrl } from '@/components/admin/formatters';

type AuthState = 'checking' | 'unauthenticated' | 'authenticated';

type EdgePoint = AnalyticsOverviewResponse['trends']['edgeSeries'][number];
type HumanPoint = AnalyticsOverviewResponse['trends']['humanSeries'][number];

const EDGE_SERIES_DEFS: TrendSeriesDef<EdgePoint>[] = [
  {
    key: 'requests',
    label: '全站请求',
    colorLight: '#4F46E5',
    colorDark: '#6366F1',
    dotClass: 'bg-indigo-500',
    hasArea: true,
    getValue: (d) => d.requests,
  },
  {
    key: 'pageViews',
    label: '边缘页面',
    colorLight: '#0891B2',
    colorDark: '#22D3EE',
    dotClass: 'bg-cyan-400',
    getValue: (d) => d.pageViews,
  },
];

const HUMAN_SERIES_DEFS: TrendSeriesDef<HumanPoint>[] = [
  {
    key: 'pv',
    label: '真实人类 PV',
    colorLight: '#059669',
    colorDark: '#34D399',
    dotClass: 'bg-emerald-400',
    hasArea: true,
    getValue: (d) => d.pv,
  },
  {
    key: 'sessions',
    label: '独立会话',
    colorLight: '#0284C7',
    colorDark: '#38BDF8',
    dotClass: 'bg-sky-400',
    dashed: true,
    getValue: (d) => d.sessions,
  },
  {
    key: 'conversions',
    label: '商业转化',
    colorLight: '#D97706',
    colorDark: '#FBBF24',
    dotClass: 'bg-amber-400',
    getValue: (d) => d.conversions,
  },
];

function DashboardSkeleton() {
  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {[0, 1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="h-[138px] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/50 p-5 animate-pulse motion-reduce:animate-none"
          >
            <div className="h-3 w-24 bg-zinc-200/80 dark:bg-zinc-800 rounded" />
            <div className="mt-5 h-7 w-28 bg-zinc-200/80 dark:bg-zinc-800 rounded" />
            <div className="mt-5 h-3 w-full bg-zinc-200/60 dark:bg-zinc-800/70 rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1].map((idx) => (
          <div
            key={idx}
            className="h-[310px] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/50 p-5 animate-pulse motion-reduce:animate-none"
          />
        ))}
      </div>

      <div className="h-[220px] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/50 animate-pulse motion-reduce:animate-none" />
      <div className="h-[360px] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/50 animate-pulse motion-reduce:animate-none" />
    </div>
  );
}

export default function AdminDashboardPage() {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [range, setRange] = useState<AnalyticsRange>('24h');
  const [overview, setOverview] = useState<AnalyticsOverviewResponse | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const memoryTokenRef = useRef<string | null>(null);
  const hasOverviewRef = useRef(false);

  const buildAuthHeaders = useCallback((): HeadersInit | undefined => {
    if (memoryTokenRef.current) {
      return { Authorization: `Bearer ${memoryTokenRef.current}` };
    }
    return undefined;
  }, []);

  const fetchOverview = useCallback(
    async (targetRange: AnalyticsRange, forceRefresh = false) => {
      setFetchError(null);
      if (!hasOverviewRef.current) {
        setLoadingInitial(true);
      }
      setRefreshing(true);

      try {
        const qs = new URLSearchParams({ range: targetRange });
        if (forceRefresh) qs.set('refresh', '1');
        const res = await fetch(`${getAnalyticsBaseUrl()}/overview?${qs.toString()}`, {
          method: 'GET',
          credentials: 'include',
          headers: buildAuthHeaders(),
          cache: 'no-store',
        });

        if (res.status === 401) {
          memoryTokenRef.current = null;
          hasOverviewRef.current = false;
          setOverview(null);
          setAuthNotice('登录会话已过期，请重新输入密码');
          setAuthState('unauthenticated');
          return;
        }

        if (!res.ok) {
          setFetchError(`监控数据加载失败 (HTTP ${res.status})，请点击右上角刷新重试`);
          return;
        }

        const payload = (await res.json()) as AnalyticsOverviewResponse;
        hasOverviewRef.current = true;
        setOverview(payload);
        setBannerDismissed(false);
      } catch {
        setFetchError('网络连接异常，暂无法获取最新监控数据');
      } finally {
        setLoadingInitial(false);
        setRefreshing(false);
      }
    },
    [buildAuthHeaders]
  );

  // Check session on initial mount
  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      try {
        const res = await fetch(`${getAnalyticsBaseUrl()}/session`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });
        if (!active) return;
        if (res.ok) {
          const data = (await res.json()) as { authenticated?: boolean };
          if (data.authenticated) {
            setAuthState('authenticated');
            return;
          }
        }
      } catch {
        // Fallback to lock screen
      }
      if (active) setAuthState('unauthenticated');
    };
    void checkSession();
    return () => {
      active = false;
    };
  }, []);

  // Fetch overview once authenticated or when range changes
  useEffect(() => {
    if (authState === 'authenticated') {
      void fetchOverview(range, false);
    }
  }, [authState, range, fetchOverview]);

  const handleLoginSuccess = (token?: string) => {
    if (token) memoryTokenRef.current = token;
    setAuthNotice(null);
    setAuthState('authenticated');
  };

  const handleLogout = async () => {
    try {
      await fetch(`${getAnalyticsBaseUrl()}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders(),
      });
    } catch {
      // Proceed to clear client state regardless
    }
    memoryTokenRef.current = null;
    hasOverviewRef.current = false;
    setOverview(null);
    setAuthNotice(null);
    setAuthState('unauthenticated');
  };

  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-xs font-mono text-zinc-400">
        Verifying session...
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return (
      <AdminLockScreen
        onSuccess={handleLoginSuccess}
        initialNotice={authNotice}
      />
    );
  }

  const edgeTotal = overview?.kpis.edgeRequests ?? 0;
  const humanTotal = overview?.kpis.humanPv ?? 0;
  const rangeLabel = range === '24h' ? '24 小时' : range === '7d' ? '7 天' : '30 天';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <AdminHeader
        range={range}
        onRangeChange={setRange}
        healthStatus={overview?.health.status ?? 'live'}
        syncedAt={overview?.syncedAt}
        refreshing={refreshing}
        onRefresh={() => void fetchOverview(range, true)}
        onLogout={() => void handleLogout()}
      />

      {overview && overview.health.status !== 'live' && !bannerDismissed && (
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <span className="truncate">
                {overview.health.staleReason || '部分边缘数据同步延迟，当前展示最近缓存快照'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              aria-label="关闭提示"
              className="p-1 rounded hover:bg-amber-500/20 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {fetchError && (
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div
            role="alert"
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-700 dark:text-rose-300"
          >
            {fetchError}
          </div>
        </div>
      )}

      {loadingInitial && !overview ? (
        <DashboardSkeleton />
      ) : overview ? (
        <div
          className={`max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 sm:space-y-6 transition-opacity duration-150 ${
            refreshing ? 'opacity-60 pointer-events-none' : 'opacity-100'
          }`}
        >
          <AdminKpiGrid kpis={overview.kpis} />

          <section
            aria-label="趋势曲线"
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            <AdminTrendChart
              title="全站请求 & 边缘页面趋势"
              subtitleEn="EDGE REQUESTS & PAGE VIEWS"
              range={range}
              data={overview.trends.edgeSeries}
              series={EDGE_SERIES_DEFS}
              ariaSummary={`全站请求与边缘页面趋势图，过去 ${rangeLabel} 累计请求 ${formatExactInt(edgeTotal)} 次`}
            />

            <AdminTrendChart
              title="真实人类访客 & 核心转化趋势"
              subtitleEn="HUMAN VISITORS & CONVERSIONS"
              range={range}
              data={overview.trends.humanSeries}
              series={HUMAN_SERIES_DEFS}
              ariaSummary={`真实人类访客与核心转化趋势图，过去 ${rangeLabel} 累计真实人类 PV ${formatExactInt(humanTotal)} 次`}
            />
          </section>

          <AdminFunnelCard funnel={overview.funnel} />

          <AdminPageTable pages={overview.pages} />

          <AdminBreakdownGrid breakdowns={overview.breakdowns} />

          <AdminHealthAndFeed
            httpHealth={overview.httpHealth}
            liveFeed={overview.liveFeed}
          />
        </div>
      ) : null}
    </div>
  );
}
