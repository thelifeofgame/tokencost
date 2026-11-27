'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Scale, SlidersHorizontal, Sparkles } from 'lucide-react';
import TrackedAffiliateLink from '@/components/TrackedAffiliateLink';
import { trackEvent } from '@/lib/analytics';
import type { SubscriptionLocale } from '@/lib/ai-subscriptions';

interface SubscriptionBreakevenCardProps {
  locale: SubscriptionLocale;
}

const SIMULATOR_QUERY =
  '?reqs=3000&in=4000&out=1000&cache=65&batch=0&long=0&providers=All&model=deepseek-v4.1-flash&advanced=0';

const COPY = {
  en: {
    badge: 'SUBSCRIPTION VS. API BREAK-EVEN',
    title: 'Are you burning $20/month for 20% of a quota?',
    subtitle:
      'Flat $20/mo plans (ChatGPT Plus, Claude Pro, Google AI Pro, Perplexity Pro) reset unused quota every 30 days. With pay-as-you-go API + Prompt Caching, you only pay for tokens actually processed—and never lose unused credits at month-end.',
    subLabel: 'Flat monthly plan',
    subTag: 'FLAT CAP',
    subPrice: 'US$20',
    subUnit: ' / mo',
    subDesc: 'Best above ~51 frontier prompts/day or unlimited voice/web UI; unused quota expires monthly.',
    apiLabel: 'Cached PAYG API',
    apiTag: 'PAYG WIN',
    apiPrice: '$1.88',
    apiUnit: ' / 3k reqs',
    apiDesc: 'DeepSeek V4.1 Flash at 4K in / 1K out (65% cache): $20 covers 31,902 reqs/mo.',
    bullets: [
      {
        label: 'Frontier tier (GPT-6.2 Sol / Claude Sonnet 5.5 · $2/$10, $0.10 cached):',
        detail:
          'At 4K in + 1K out and 65% cache hit, $20 = 1,531 reqs/mo (~51/day). At 500 reqs/mo, PAYG is $6.53. (Gemini 4 Carbon doubles to $4/$20 on Dec 1 → ~766 reqs/mo.)',
      },
      {
        label: 'High-efficiency tier (DeepSeek V4.1 Flash · $0.14/$0.42, $0.0042 cached):',
        detail: '3,000 reqs/mo costs $1.88 (saves $18.12/mo vs. $20 flat; break-even: 31,902 reqs/mo).',
      },
      {
        label: 'Ultra-lean routing (Upstage Solar Mini 4.5 · $0.01/$0.04, 90% cache):',
        detail: '3,000 reqs/mo costs $0.17 (break-even: 353,357 reqs/mo).',
      },
    ],
    meterLeft: 'API < $20',
    meterCenter: 'BREAKEVEN = US$20/mo',
    meterRight: 'SUB > $20',
    ruleHint:
      'Assumes 4,000 input + 1,000 output tokens/req at 65% prompt cache hit (verified rates as of 2026-11-27).',
    primaryCta: 'Test Your Exact Break-Even in API Simulator',
    secondaryCta: 'Pay-As-You-Go via OpenRouter (0% Markup · $25K/mo Free BYOK)',
    disclosure:
      'One unified API key across 360+ models with 0% token markup and non-expiring credits.',
  },
  'zh-CN': {
    badge: '订阅 vs API 盈亏平衡测算',
    title: '每月固定扣款 $20（约 ¥145），你真的用满了额度吗？',
    subtitle:
      'ChatGPT Plus、Claude Pro、Google AI Pro 等 $20/月订阅按自然月清零额度，轻度使用或出差空窗期相当于白交月费；改用按量 API 叠加 Prompt 缓存，余额永不过期，用多少扣多少。',
    subLabel: '固定月付订阅',
    subTag: 'FLAT CAP',
    subPrice: 'US$20',
    subUnit: ' / 月',
    subDesc: '适合日均 51 次以上旗舰交互或高频语音/网页端；当月未用完额度月末清零。',
    apiLabel: '按量 API + 缓存',
    apiTag: 'PAYG WIN',
    apiPrice: '$1.88',
    apiUnit: ' / 3千次',
    apiDesc: 'DeepSeek V4.1 Flash（4K 输入/1K 输出，65% 缓存）：$20 可跑 31,902 次/月。',
    bullets: [
      {
        label: '旗舰对等档（GPT-6.2 Sol / Claude Sonnet 5.5 · $2/$10，缓存 $0.10）：',
        detail:
          '单次 4K 输入 + 1K 输出、65% 缓存下，$20 = 1,531 次/月（约 51 次/天）；500 次/月仅 $6.53。（Gemini 4 Carbon 12/1 起翻倍至 $4/$20，平衡点降至 ~766 次/月。）',
      },
      {
        label: '高性价比主力（DeepSeek V4.1 Flash · $0.14/$0.42，缓存 $0.0042）：',
        detail: '每月 3,000 次仅需 $1.88，比 $20 会员直省 $18.12/月（平衡点 31,902 次/月）。',
      },
      {
        label: '超轻量路由（Upstage Solar Mini 4.5 · $0.01/$0.04，90% 缓存）：',
        detail: '每月 3,000 次仅需 $0.17（平衡点 353,357 次/月）。',
      },
    ],
    meterLeft: 'API < $20',
    meterCenter: '平衡线 = US$20/月',
    meterRight: '订阅 > $20',
    ruleHint:
      '按单次 4,000 输入 + 1,000 输出 Token、65% 缓存命中及 2026-11-27 核实费率测算。',
    primaryCta: '代入我的日均请求，测算 API 盈亏平衡点',
    secondaryCta: '通过 OpenRouter 按量充值调用（0% 加价 · 月免 $25K BYOK）',
    disclosure:
      '单 Key 聚合 360+ 模型，官方费率 0% 加价、余额不过期。',
  },
} as const;

export default function SubscriptionBreakevenCard({ locale }: SubscriptionBreakevenCardProps) {
  const c = COPY[locale];
  const simulatorHref = `${locale === 'zh-CN' ? '/zh-CN/' : '/'}${SIMULATOR_QUERY}`;

  return (
    <section
      aria-labelledby="subs-breakeven-heading"
      className="relative overflow-hidden rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/65 p-4 sm:p-6 backdrop-blur-md shadow-sm shadow-zinc-950/[0.04] dark:shadow-xl"
    >
      {/* Top 1px Sheen + Subtle Indigo Corner Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 dark:via-indigo-400/35 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.07),transparent_58%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.14),transparent_58%)]"
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left (7 cols): Comparison Summary Area */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4 min-w-0">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              <Scale className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>{c.badge}</span>
            </span>
            <h2
              id="subs-breakeven-heading"
              className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
            >
              {c.title}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {c.subtitle}
            </p>
          </div>

          {/* 2-Tile Side-by-Side Micro Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-200/85 dark:border-zinc-800/85 bg-zinc-50/90 dark:bg-zinc-950/60 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  {c.subLabel}
                </span>
                <span className="rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 px-1.5 py-0.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
                  {c.subTag}
                </span>
              </div>
              <div className="font-mono tabular-nums text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {c.subPrice}
                <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">{c.subUnit}</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-snug">{c.subDesc}</p>
            </div>

            <div className="rounded-xl border border-emerald-200/90 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-500/[0.08] p-3.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  {c.apiLabel}
                </span>
                <span className="rounded-md border border-emerald-200 dark:border-emerald-500/35 bg-white/90 dark:bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                  {c.apiTag}
                </span>
              </div>
              <div className="font-mono tabular-nums text-xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
                {c.apiPrice}
                <span className="text-xs font-normal text-emerald-700/80 dark:text-emerald-300/80">
                  {c.apiUnit}
                </span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-snug">{c.apiDesc}</p>
            </div>
          </div>

          {/* 3-Bullet Verified Benchmark Summary */}
          <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {c.bullets.map((item) => (
              <li key={item.label} className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0"
                />
                <span>
                  <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {item.label}
                  </strong>{' '}
                  <span className="tabular-nums">{item.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right (5 cols): Threshold Meter + Dual CTA Action Panel */}
        <div className="lg:col-span-5 rounded-xl border border-zinc-200/85 dark:border-zinc-800/85 bg-zinc-50/80 dark:bg-zinc-950/70 p-4 sm:p-5 flex flex-col justify-between gap-4 min-w-0">
          {/* Compact Visual Breakeven Rule Strip */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono tabular-nums gap-2">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold whitespace-nowrap">
                {c.meterLeft}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400 text-center truncate">
                {c.meterCenter}
              </span>
              <span className="text-indigo-700 dark:text-indigo-300 font-semibold whitespace-nowrap">
                {c.meterRight}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 flex">
              <div className="h-full w-1/2 bg-gradient-to-r from-emerald-500 to-emerald-400" />
              <div className="h-full w-1/2 bg-gradient-to-r from-indigo-500 to-indigo-400 opacity-75" />
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">{c.ruleHint}</p>
          </div>

          {/* Dual CTA Stack */}
          <div className="space-y-2.5">
            <Link
              href={simulatorHref}
              onClick={() => trackEvent('subs_breakeven_simulator_click', { locale })}
              className="group w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 text-center"
            >
              <SlidersHorizontal className="h-4 w-4 text-indigo-100 shrink-0" aria-hidden="true" />
              <span>{c.primaryCta}</span>
              <ArrowRight
                className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>

            <TrackedAffiliateLink
              href="https://openrouter.ai/"
              modelId="subscription-breakeven"
              pageType="ai_subscriptions"
              utmMedium="subscriptions_breakeven"
              locale={locale}
              placement="subs_breakeven_card"
              provider="openrouter"
              campaign="bf_t3_20261127"
              includeRef={true}
              className="group w-full min-h-[44px] inline-flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-zinc-200/95 dark:border-zinc-700/85 bg-white dark:bg-zinc-900/90 hover:bg-zinc-100/90 dark:hover:bg-zinc-800/90 hover:border-zinc-300 dark:hover:border-zinc-600 px-3.5 py-2 text-xs font-medium text-zinc-800 dark:text-zinc-200 transition-all active:scale-[0.98] text-center"
            >
              <Sparkles
                className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0"
                aria-hidden="true"
              />
              <span>{c.secondaryCta}</span>
              <ExternalLink
                className="h-3 w-3 text-zinc-500 dark:text-zinc-400 shrink-0"
                aria-hidden="true"
              />
            </TrackedAffiliateLink>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug text-center">
              {c.disclosure}
            </p>

            {locale === 'zh-CN' && (
              <Link
                href="/zh-CN/domestic-models/"
                className="group flex items-center justify-between gap-2 rounded-xl border border-amber-200/90 dark:border-amber-500/25 bg-amber-50/75 dark:bg-amber-500/[0.08] px-3 py-2 text-[11px] font-medium text-amber-900 dark:text-amber-300 hover:bg-amber-100/80 dark:hover:bg-amber-500/15 transition-colors"
              >
                <span className="min-w-0 leading-snug">
                  无海外双币信用卡？查看支持微信/支付宝与人民币开票的国内模型专区
                </span>
                <ArrowRight
                  className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
