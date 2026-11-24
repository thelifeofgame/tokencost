export type AnalyticsRange = '24h' | '7d' | '30d';

export interface AnalyticsOverviewResponse {
  range: AnalyticsRange;
  syncedAt: string;
  health: {
    status: 'live' | 'stale' | 'degraded';
    staleReason?: string;
  };
  kpis: {
    edgeRequests: number;
    cacheHitRate: number;
    edgePageViews: number;
    edgeUniques: number;
    humanPv: number;
    humanSessions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    cvr: number;
    deltas?: Partial<
      Record<
        'edgeRequests' | 'edgePageViews' | 'humanPv' | 'clicks' | 'conversions',
        number | null
      >
    >;
  };
  trends: {
    edgeSeries: Array<{
      bucket: string;
      label: string;
      requests: number;
      pageViews: number;
      cachedRequests?: number;
    }>;
    humanSeries: Array<{
      bucket: string;
      label: string;
      pv: number;
      sessions: number;
      clicks: number;
      conversions: number;
    }>;
  };
  funnel: Array<{
    step: 1 | 2 | 3 | 4;
    key: 'landed' | 'engaged' | 'high_intent' | 'conversion';
    labelZh: string;
    labelEn: string;
    sessions: number;
    pctOfTotal: number;
    stepConversionPct: number;
  }>;
  pages: Array<{
    path: string;
    channel: string;
    edgeHits: number | null;
    humanPv: number;
    moduleImpressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    cvr: number;
  }>;
  breakdowns: {
    countries: Array<{
      code: string;
      name: string;
      requests: number;
      sharePct: number;
      isTier1?: boolean;
    }>;
    referrers: Array<{
      source: string;
      utmSource?: string | null;
      count: number;
      sharePct: number;
    }>;
    locales: Array<{
      locale: 'en' | 'zh-CN' | 'zh-TW' | 'ja' | 'ko' | 'es' | string;
      count: number;
      sharePct: number;
    }>;
    devices: Array<{
      device: 'desktop' | 'mobile' | 'tablet' | string;
      count: number;
      sharePct: number;
    }>;
    partners: Array<{
      partner: string;
      count: number;
      sharePct: number;
    }>;
    topEvents: Array<{
      event: string;
      category: 'tool' | 'high_intent' | 'conversion' | 'other';
      count: number;
      sharePct: number;
    }>;
  };
  httpHealth: {
    status2xx: number;
    status3xx: number;
    status4xx: number;
    status5xx: number;
    threats: number;
    bytes: number;
  };
  liveFeed: Array<{
    id: string;
    ts: string;
    event: string;
    category: 'page_view' | 'tool_interact' | 'high_intent' | 'conversion' | 'other';
    path: string;
    target?: string | null;
    locale?: string;
    device?: string;
    country?: string;
  }>;
}
