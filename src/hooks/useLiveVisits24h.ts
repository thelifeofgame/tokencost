'use client';

import { useEffect, useRef, useState } from 'react';

export type LiveVisitsStatus = 'loading' | 'live' | 'stale' | 'error';

interface DualVisitsData {
  count: number;
  humanVisits24h: number | null;
}

interface CachedVisitsPayload {
  count: number;
  humanVisits24h: number | null;
  updatedAt: number;
}

interface VisitsApiResponse {
  visits24h?: number;
  edgeVisits24h?: number;
  humanVisits24h?: number | null;
  edgeSyncAt?: string | null;
  windowHours?: number;
  updatedAt?: string;
  mode?: string;
  counted?: boolean;
}

const SESSION_CACHE_KEY = 'tokencost_live_visits_24h_v2';
const SESSION_POST_THROTTLE_KEY = 'tokencost_live_visits_post_v1';
const REQUEST_TIMEOUT_MS = 2500;
const POLL_INTERVAL_MS = 45000;
const SAME_PATH_THROTTLE_MS = 15000;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes short session cache

const memoryPostTimestamps = new Map<string, number>();

function getApiEndpoint(): string {
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('tokencostsai.com')) {
    return '/api/visits-24h';
  }
  return 'https://tokencostsai.com/api/visits-24h';
}

function normalizeHumanVisits(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.trunc(num);
}

function readSessionCache(): CachedVisitsPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedVisitsPayload>;
    if (
      typeof parsed.count === 'number' &&
      Number.isFinite(parsed.count) &&
      parsed.count > 0 &&
      typeof parsed.updatedAt === 'number' &&
      Date.now() - parsed.updatedAt <= CACHE_TTL_MS
    ) {
      return {
        count: Math.trunc(parsed.count),
        humanVisits24h: normalizeHumanVisits(parsed.humanVisits24h),
        updatedAt: parsed.updatedAt,
      };
    }
  } catch {
    // Ignore storage access/parse errors
  }
  return null;
}

function writeSessionCache(data: DualVisitsData): void {
  if (typeof window === 'undefined' || !Number.isFinite(data.count) || data.count <= 0) return;
  try {
    const payload: CachedVisitsPayload = {
      count: Math.trunc(data.count),
      humanVisits24h: normalizeHumanVisits(data.humanVisits24h),
      updatedAt: Date.now(),
    };
    window.sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota/privacy mode errors
  }
}

function shouldPostForPath(path: string, now: number): boolean {
  const memTs = memoryPostTimestamps.get(path);
  if (memTs && now - memTs < SAME_PATH_THROTTLE_MS) {
    return false;
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = window.sessionStorage.getItem(SESSION_POST_THROTTLE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, number>;
        const storedTs = parsed[path];
        if (typeof storedTs === 'number' && now - storedTs < SAME_PATH_THROTTLE_MS) {
          memoryPostTimestamps.set(path, storedTs);
          return false;
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  return true;
}

function recordPostForPath(path: string, now: number): void {
  memoryPostTimestamps.set(path, now);
  if (typeof window === 'undefined') return;
  try {
    const raw = window.sessionStorage.getItem(SESSION_POST_THROTTLE_KEY);
    const parsed: Record<string, number> = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    // Prune expired entries to keep storage small
    for (const [k, ts] of Object.entries(parsed)) {
      if (typeof ts !== 'number' || now - ts >= SAME_PATH_THROTTLE_MS * 4) {
        delete parsed[k];
      }
    }
    parsed[path] = now;
    window.sessionStorage.setItem(SESSION_POST_THROTTLE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore storage errors
  }
}

async function requestVisits(method: 'GET' | 'POST'): Promise<DualVisitsData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(getApiEndpoint(), {
      method,
      headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
      signal: controller.signal,
      cache: method === 'POST' ? 'no-store' : 'default',
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = (await res.json()) as VisitsApiResponse;
    const rawPrimary = data?.edgeVisits24h ?? data?.visits24h;
    const count = Number(rawPrimary);
    if (!Number.isFinite(count) || count <= 0) {
      throw new Error('Invalid visits count');
    }

    return {
      count: Math.trunc(count),
      humanVisits24h: normalizeHumanVisits(data?.humanVisits24h),
    };
  } finally {
    clearTimeout(timer);
  }
}

export function useLiveVisits24h(pathname: string | null): {
  count: number | null;
  humanVisits24h: number | null;
  status: LiveVisitsStatus;
} {
  const [count, setCount] = useState<number | null>(null);
  const [humanVisits24h, setHumanVisits24h] = useState<number | null>(null);
  const [status, setStatus] = useState<LiveVisitsStatus>('loading');

  const countRef = useRef<number | null>(null);
  const humanVisitsRef = useRef<number | null>(null);
  const lastSuccessAtRef = useRef<number>(0);

  useEffect(() => {
    let active = true;
    const normalizedPath = (pathname || (typeof window !== 'undefined' ? window.location.pathname : '/') || '/')
      .replace(/\/+$/, '') || '/';

    // Seed immediately from sessionStorage to eliminate flicker across page transitions
    const cached = readSessionCache();
    if (cached && (countRef.current === null || countRef.current <= 0)) {
      countRef.current = cached.count;
      humanVisitsRef.current = cached.humanVisits24h;
      lastSuccessAtRef.current = cached.updatedAt;
      setCount(cached.count);
      setHumanVisits24h(cached.humanVisits24h);
      setStatus('live');
    }

    const handleSuccess = (nextData: DualVisitsData) => {
      if (!active) return;
      countRef.current = nextData.count;
      humanVisitsRef.current = nextData.humanVisits24h;
      lastSuccessAtRef.current = Date.now();
      writeSessionCache(nextData);
      setCount(nextData.count);
      setHumanVisits24h(nextData.humanVisits24h);
      setStatus('live');
    };

    const handleFailure = () => {
      if (!active) return;
      if (countRef.current !== null && countRef.current > 0) {
        setStatus('stale');
      } else {
        const fallback = readSessionCache();
        if (fallback) {
          countRef.current = fallback.count;
          humanVisitsRef.current = fallback.humanVisits24h;
          setCount(fallback.count);
          setHumanVisits24h(fallback.humanVisits24h);
          setStatus('stale');
        } else {
          setStatus('error');
        }
      }
    };

    const now = Date.now();
    if (shouldPostForPath(normalizedPath, now)) {
      recordPostForPath(normalizedPath, now);
      requestVisits('POST').then(handleSuccess).catch(handleFailure);
    } else if (!cached || now - cached.updatedAt > 10000) {
      requestVisits('GET').then(handleSuccess).catch(handleFailure);
    }

    return () => {
      active = false;
    };
  }, [pathname]);

  // Poll every 45s only when document is visible
  useEffect(() => {
    let active = true;

    const refresh = async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      try {
        const nextData = await requestVisits('GET');
        if (!active) return;
        countRef.current = nextData.count;
        humanVisitsRef.current = nextData.humanVisits24h;
        lastSuccessAtRef.current = Date.now();
        writeSessionCache(nextData);
        setCount(nextData.count);
        setHumanVisits24h(nextData.humanVisits24h);
        setStatus('live');
      } catch {
        if (!active) return;
        if (countRef.current !== null && countRef.current > 0) {
          setStatus('stale');
        } else {
          const fallback = readSessionCache();
          if (fallback) {
            countRef.current = fallback.count;
            humanVisitsRef.current = fallback.humanVisits24h;
            setCount(fallback.count);
            setHumanVisits24h(fallback.humanVisits24h);
            setStatus('stale');
          } else {
            setStatus('error');
          }
        }
      }
    };

    const intervalId = setInterval(refresh, POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        Date.now() - lastSuccessAtRef.current >= POLL_INTERVAL_MS
      ) {
        void refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { count, humanVisits24h, status };
}
