'use client';

const VID_STORAGE_KEY = 'tc_vid';
const SID_STORAGE_KEY = 'tc_analytics_sid_v1';
const UTM_STORAGE_KEY = 'tc_analytics_utm_v1';
const SUPPORTED_LOCALE_CODES = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'es'] as const;

let memorySid: string | null = null;

function generateSid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 20);
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

function getOrCreateSid(): string {
  if (typeof window === 'undefined') return 'ssr';
  try {
    const existing = window.sessionStorage.getItem(SID_STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;
    const next = generateSid();
    window.sessionStorage.setItem(SID_STORAGE_KEY, next);
    return next;
  } catch {
    if (!memorySid) memorySid = generateSid();
    return memorySid;
  }
}

function getOrCreateVid(): string | undefined {
  try {
    const existing = window.localStorage.getItem(VID_STORAGE_KEY);
    if (existing && /^[a-f0-9]{32}$/.test(existing)) return existing;
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const next = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    window.localStorage.setItem(VID_STORAGE_KEY, next);
    return next;
  } catch {
    return undefined;
  }
}

export function isAnalyticsExcludedPath(pathname: string): boolean {
  const clean = (pathname || '/').replace(/^\/(zh-CN|zh-TW|ja|ko|es)(?=\/|$)/, '') || '/';
  return clean === '/admin' || clean.startsWith('/admin/');
}

function resolvePageGroup(pathname: string): string {
  const clean = (pathname || '/').replace(/^\/(zh-CN|zh-TW|ja|ko|es)(?=\/|$)/, '') || '/';
  if (clean === '/' || clean === '') return 'Home';
  if (clean.startsWith('/deals')) return 'Deals';
  if (clean.startsWith('/calculator')) return 'Calculator';
  if (clean.startsWith('/compare')) return 'Compare';
  if (clean.startsWith('/models')) return 'Models';
  if (clean.startsWith('/harness')) return 'Harness';
  if (clean.startsWith('/pricing')) return 'Pricing';
  if (clean.startsWith('/developers')) return 'Developers';
  if (clean.startsWith('/contact')) return 'Contact';
  return 'Other';
}

function resolveLocale(pathname: string): string {
  const match = (pathname || '/').match(/^\/(zh-CN|zh-TW|ja|ko|es)(?=\/|$)/);
  if (match) return match[1];
  if (typeof document !== 'undefined') {
    const htmlLang = document.documentElement.lang;
    if ((SUPPORTED_LOCALE_CODES as readonly string[]).includes(htmlLang)) {
      return htmlLang;
    }
  }
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem('tokencost_locale');
      if (saved && (SUPPORTED_LOCALE_CODES as readonly string[]).includes(saved)) {
        return saved;
      }
    } catch {
      // Ignore storage errors
    }
  }
  return 'en';
}

function resolveDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) {
    return 'tablet';
  }
  if (w < 768 || /mobi|iphone|ipod|android.*mobile/i.test(ua)) {
    return 'mobile';
  }
  if (w < 1024 && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1) {
    return 'tablet';
  }
  return 'desktop';
}

function resolveReferrerHost(): string {
  if (typeof document === 'undefined' || !document.referrer) return '';
  try {
    const refUrl = new URL(document.referrer);
    const host = refUrl.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'tokencostsai.com' || host === 'localhost' || host === '127.0.0.1') {
      return '';
    }
    return host;
  } catch {
    return '';
  }
}

function resolveUtmParams(): { utm_source?: string; utm_medium?: string } {
  if (typeof window === 'undefined') return {};
  try {
    const sp = new URLSearchParams(window.location.search);
    const src = sp.get('utm_source')?.trim();
    const med = sp.get('utm_medium')?.trim();
    if (src || med) {
      const data = {
        ...(src ? { utm_source: src.slice(0, 48) } : {}),
        ...(med ? { utm_medium: med.slice(0, 48) } : {}),
      };
      window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(data));
      return data;
    }
    const cached = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached) as { utm_source?: string; utm_medium?: string };
    }
  } catch {
    // Ignore storage/URL errors
  }
  return {};
}

function getCollectEndpoint(): string | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
    const localEndpoint = process.env.NEXT_PUBLIC_LOCAL_ANALYTICS_COLLECT;
    return localEndpoint && /^http:\/\/(localhost|127\.0\.0\.1):\d+\/api\/analytics\/collect$/.test(localEndpoint)
      ? localEndpoint
      : null;
  }
  if (host === 'tokencostsai.com' || host === 'www.tokencostsai.com') {
    return '/api/analytics/collect';
  }
  return null;
}

function sendFirstPartyBeacon(event: string, params: Record<string, unknown>, explicitPath?: string): void {
  if (typeof window === 'undefined') return;
  const pathname = explicitPath || window.location.pathname || '/';
  if (isAnalyticsExcludedPath(pathname)) return;

  const endpoint = getCollectEndpoint();
  if (!endpoint) return;

  const utm = resolveUtmParams();
  const body = JSON.stringify({
    event,
    sid: getOrCreateSid(),
    vid: getOrCreateVid(),
    path: pathname,
    page_group: resolvePageGroup(pathname),
    locale: (typeof params.locale === 'string' && params.locale) || resolveLocale(pathname),
    referrer_host: resolveReferrerHost(),
    ...utm,
    device_type: resolveDeviceType(),
    params,
  });

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      const sent = navigator.sendBeacon(endpoint, blob);
      if (sent) return;
    }
    void fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {
      // Never block UI interactions
    });
  } catch {
    // Never block UI interactions
  }
}

export function trackEvent(event: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  try {
    const pathname = window.location.pathname || '/';
    if (isAnalyticsExcludedPath(pathname)) return;

    const w = window as Window & { dataLayer?: Record<string, unknown>[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({
      event,
      page_path: pathname,
      timestamp: new Date().toISOString(),
      ...params,
    });

    sendFirstPartyBeacon(event, params, pathname);
  } catch {
    // Never block UI interactions
  }
}

const lastThrottledMap = new Map<string, number>();

export function trackEventThrottled(
  event: string,
  params: Record<string, unknown> = {},
  intervalMs = 1500
): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  const last = lastThrottledMap.get(event) ?? 0;
  if (now - last < intervalMs) return;
  lastThrottledMap.set(event, now);
  trackEvent(event, params);
}

export function trackPageView(pathname?: string): void {
  if (typeof window === 'undefined') return;
  const targetPath = pathname || window.location.pathname || '/';
  if (isAnalyticsExcludedPath(targetPath)) return;
  trackEvent('page_view', {
    page_path: targetPath,
    page_group: resolvePageGroup(targetPath),
  });
}

export function trackModuleImpression(moduleId: string, pathname?: string): void {
  if (typeof window === 'undefined') return;
  const targetPath = pathname || window.location.pathname || '/';
  if (isAnalyticsExcludedPath(targetPath)) return;
  sendFirstPartyBeacon(
    'module_impression',
    {
      module: moduleId,
      page_path: targetPath,
    },
    targetPath
  );
}

export function detectAffiliatePartner(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('openrouter.ai')) return 'openrouter';
  if (lower.includes('groq.com')) return 'groq';
  if (lower.includes('deepseek.com')) return 'deepseek';
  if (lower.includes('anthropic.com')) return 'anthropic';
  if (lower.includes('openai.com')) return 'openai';
  if (lower.includes('google') || lower.includes('gemini') || lower.includes('ai.google.dev')) return 'google';
  if (lower.includes('z.ai') || lower.includes('bigmodel.cn') || lower.includes('zhipu')) return 'zhipu';
  if (lower.includes('qwen') || lower.includes('dashscope') || lower.includes('aliyun') || lower.includes('alibaba')) return 'alibaba_qwen';
  if (lower.includes('mistral.ai')) return 'mistral';
  if (lower.includes('x.ai') || lower.includes('grok')) return 'xai';
  if (lower.includes('llama.com') || lower.includes('meta.com') || lower.includes('meta.ai')) return 'meta';
  if (lower.includes('thinkingmachines')) return 'thinkingmachines';
  return 'partner';
}
