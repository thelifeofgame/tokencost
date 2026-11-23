'use client';

import { useEffect, useRef, useState } from 'react';

export type LiveVisitsStatus = 'loading' | 'live' | 'stale' | 'error';

interface CachedVisitsPayload {
  count: number;
  updatedAt: number;
}

interface VisitsApiResponse {
  visits24h?: number;
  windowHours?: number;
  updatedAt?: string;
  counted?: boolean;
}

const SESSION_CACHE_KEY = 'tokencost_live_visits_24h_v1';
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
      return { count: Math.trunc(parsed.count), updatedAt: parsed.updatedAt };
    }
  } catch {
    // Ignore storage access/parse errors
  }
  return null;
}

function writeSessionCache(count: number): void {
  if (typeof window === 'undefined' || !Number.isFinite(count) || count <= 0) return;
  try {
    const payload: CachedVisitsPayload = {
      count: Math.trunc(count),
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

async function requestVisits(method: 'GET' | 'POST'): Promise<number> {
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
    const count = Number(data?.visits24h);
    if (!Number.isFinite(count) || count <= 0) {
      throw new Error('Invalid visits count');
    }
    return Math.trunc(count);
  } finally {
    clearTimeout(timer);
  }
}

export function useLiveVisits24h(pathname: string | null): {
  count: number | null;
  status: LiveVisitsStatus;
} {
  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState<LiveVisitsStatus>('loading');

  const countRef = useRef<number | null>(null);
  const lastSuccessAtRef = useRef<number>(0);

  useEffect(() => {
    let active = true;
    const normalizedPath = (pathname || (typeof window !== 'undefined' ? window.location.pathname : '/') || '/')
      .replace(/\/+$/, '') || '/';

    // Seed immediately from sessionStorage to eliminate flicker across page transitions
    const cached = readSessionCache();
    if (cached && (countRef.current === null || countRef.current <= 0)) {
      countRef.current = cached.count;
      lastSuccessAtRef.current = cached.updatedAt;
      setCount(cached.count);
      setStatus('live');
    }

    const handleSuccess = (nextCount: number) => {
      if (!active) return;
      countRef.current = nextCount;
      lastSuccessAtRef.current = Date.now();
      writeSessionCache(nextCount);
      setCount(nextCount);
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
          setCount(fallback.count);
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
        const nextCount = await requestVisits('GET');
        if (!active) return;
        countRef.current = nextCount;
        lastSuccessAtRef.current = Date.now();
        writeSessionCache(nextCount);
        setCount(nextCount);
        setStatus('live');
      } catch {
        if (!active) return;
        if (countRef.current !== null && countRef.current > 0) {
          setStatus('stale');
        } else {
          const fallback = readSessionCache();
          if (fallback) {
            countRef.current = fallback.count;
            setCount(fallback.count);
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

  return { count, status };
}
