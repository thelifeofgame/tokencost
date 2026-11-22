import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SimulationParams } from '@/types/pricing';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPerMillionPrice(val: number): string {
  if (val === 0) return '$0.00';
  if (val < 0.1) return `$${Number(val.toFixed(4))}`;
  const rounded4 = Number(val.toFixed(4));
  const str = String(rounded4);
  const dotIdx = str.indexOf('.');
  if (dotIdx !== -1 && str.length - dotIdx - 1 > 2) {
    return `$${str}`;
  }
  return `$${val.toFixed(2)}`;
}

export function formatCurrency(val: number): string {
  if (val === 0) return '$0.00';
  if (val < 0.01) {
    return `$${val.toFixed(4)}`;
  }
  if (val < 1) {
    return `$${val.toFixed(3)}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

export function formatCompactNumber(val: number): string {
  if (val >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (val >= 1_000) {
    return `${(val / 1_000).toFixed(val % 1_000 === 0 ? 0 : 1)}k`;
  }
  return val.toString();
}

export function formatPercent(val: number): string {
  return `${Math.round(val)}%`;
}

export function encodeSimulationParams(params: SimulationParams): string {
  const q = new URLSearchParams({
    reqs: params.monthlyRequests.toString(),
    in: params.inputTokens.toString(),
    out: params.outputTokens.toString(),
    cache: Math.round(params.cacheHitRate * 100).toString(),
    batch: Math.round(params.batchRate * 100).toString(),
    long: params.enableLongContext ? '1' : '0',
  });
  return q.toString();
}

export function decodeSimulationParams(searchParams: URLSearchParams, defaultParams: SimulationParams): SimulationParams {
  const reqs = searchParams.get('reqs');
  const inTokens = searchParams.get('in');
  const outTokens = searchParams.get('out');
  const cache = searchParams.get('cache');
  const batch = searchParams.get('batch');
  const long = searchParams.get('long');

  return {
    monthlyRequests: reqs ? parseInt(reqs, 10) : defaultParams.monthlyRequests,
    inputTokens: inTokens ? parseInt(inTokens, 10) : defaultParams.inputTokens,
    outputTokens: outTokens ? parseInt(outTokens, 10) : defaultParams.outputTokens,
    cacheHitRate: cache ? Math.min(1, Math.max(0, parseInt(cache, 10) / 100)) : defaultParams.cacheHitRate,
    batchRate: batch ? Math.min(1, Math.max(0, parseInt(batch, 10) / 100)) : defaultParams.batchRate,
    enableLongContext: long === '1',
  };
}

export function getAffiliateUrl(url: string, providerName?: string, medium = 'router_affiliate'): string {
  const separator = url.includes('?') ? '&' : '?';
  const hasRef = /[?&]ref=/.test(url);
  const refParam = hasRef ? '' : 'ref=tokencostsai_com&';
  const campaign = providerName ? `&utm_campaign=${providerName.toLowerCase().replace(/\s+/g, '_')}` : '';
  return `${url}${separator}${refParam}utm_source=tokencostsai_com&utm_medium=${medium}${campaign}`;
}

export interface AffiliateOutboundOptions {
  medium: string;
  campaign: string;
  includeRef?: boolean;
}

export function buildAffiliateOutboundUrl(rawUrl: string, options: AffiliateOutboundOptions): string {
  if (!rawUrl) return '';
  try {
    const u = new URL(rawUrl);
    const isGateway =
      options.includeRef ??
      (u.hostname.includes('openrouter.ai') || u.hostname.includes('groq.com'));
    if (isGateway && !u.searchParams.has('ref')) {
      u.searchParams.set('ref', 'tokencostsai_com');
    }
    u.searchParams.set('utm_source', 'tokencostsai_com');
    u.searchParams.set('utm_medium', options.medium);
    u.searchParams.set('utm_campaign', options.campaign);
    return u.toString();
  } catch {
    return rawUrl;
  }
}
