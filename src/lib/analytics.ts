'use client';

export function trackEvent(event: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  try {
    const w = window as Window & { dataLayer?: Record<string, unknown>[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({
      event,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
      ...params,
    });
  } catch {
    // Never block UI interactions
  }
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
