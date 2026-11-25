'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  isAnalyticsExcludedPath,
  trackModuleImpression,
  trackPageView,
  trackEvent,
} from '@/lib/analytics';

const IMPRESSION_DWELL_MS = 2000;

export default function AnalyticsTracker() {
  const pathname = usePathname() || '/';
  const lastPvRef = useRef<{ path: string; ts: number }>({ path: '', ts: 0 });

  useEffect(() => {
    if (isAnalyticsExcludedPath(pathname)) return;

    const now = Date.now();
    if (lastPvRef.current.path !== pathname || now - lastPvRef.current.ts > 1000) {
      lastPvRef.current = { path: pathname, ts: now };
      trackPageView(pathname);
      if (new URLSearchParams(window.location.search).get('utm_source') === 'digest') {
        trackEvent('digest_click');
      }
    }

    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const reportedModules = new Set<string>();
    const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const moduleId = el.dataset.analyticsModule;
          if (!moduleId || reportedModules.has(moduleId)) continue;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
            if (!pendingTimers.has(moduleId)) {
              const timer = setTimeout(() => {
                pendingTimers.delete(moduleId);
                if (!reportedModules.has(moduleId)) {
                  reportedModules.add(moduleId);
                  trackModuleImpression(moduleId, pathname);
                  observer.unobserve(el);
                }
              }, IMPRESSION_DWELL_MS);
              pendingTimers.set(moduleId, timer);
            }
          } else {
            const existingTimer = pendingTimers.get(moduleId);
            if (existingTimer) {
              clearTimeout(existingTimer);
              pendingTimers.delete(moduleId);
            }
          }
        }
      },
      { threshold: [0.25, 0.5] }
    );

    const scanTargets = () => {
      const nodes = document.querySelectorAll<HTMLElement>('[data-analytics-module]');
      nodes.forEach((node) => {
        const mod = node.dataset.analyticsModule;
        if (mod && !reportedModules.has(mod)) {
          observer.observe(node);
        }
      });
    };

    // Initial scan + short delayed scan for Suspense-wrapped content
    scanTargets();
    const rescanTimer = setTimeout(scanTargets, 600);

    return () => {
      clearTimeout(rescanTimer);
      pendingTimers.forEach((timer) => clearTimeout(timer));
      pendingTimers.clear();
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
