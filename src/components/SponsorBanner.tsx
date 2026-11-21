'use client';

import React from 'react';
import { ExternalLink, Route, Zap } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { useI18n } from '@/i18n/I18nProvider';
import { formatModelCount } from '@/i18n';
import { MODELS_DATA } from '@/lib/models-data';

const OPENROUTER_SPONSOR_URL =
  'https://openrouter.ai/?ref=tokencostsai_com&utm_source=tokencostsai_com&utm_medium=sponsor_banner&utm_campaign=openrouter_rate_drops';

const GROQ_SPONSOR_URL =
  'https://groq.com?ref=tokencostsai_com&utm_source=tokencostsai_com&utm_medium=sponsor_banner&utm_campaign=groq_100_credits';

export default function SponsorBanner() {
  const { t, locale } = useI18n();
  const sponsorT = t.simulator.sponsor;

  const handleOpenRouterClick = () => {
    trackEvent('affiliate_click', {
      partner: 'openrouter',
      placement: 'sponsor_banner_dual',
      slot_position: 'primary_left',
      offer_tag: '53_84_rate_drop',
      outbound_url: OPENROUTER_SPONSOR_URL,
      locale,
    });
  };

  const handleGroqClick = () => {
    trackEvent('affiliate_click', {
      partner: 'groq',
      placement: 'sponsor_banner_dual',
      slot_position: 'secondary_right',
      offer_tag: '100_free_credits_420tps',
      outbound_url: GROQ_SPONSOR_URL,
      locale,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      {/* Primary Partner (Left): OpenRouter Unified Gateway */}
      <div className="group relative overflow-hidden rounded-2xl border border-indigo-500/30 dark:border-indigo-500/30 bg-white/85 dark:bg-gradient-to-br dark:from-zinc-900/90 dark:via-indigo-950/30 dark:to-zinc-900/90 p-4 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500/60 hover:shadow-lg hover:shadow-indigo-500/10 flex flex-col justify-between gap-3.5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />

        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400">
                <Route className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                    OpenRouter Unified Gateway
                  </span>
                </div>
                <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-indigo-500/10 border border-indigo-500/25 text-indigo-700 dark:text-indigo-300 mt-0.5">
                  {sponsorT.openrouter.badge} · Sponsored Partner
                </span>
              </div>
            </div>

            <span className="shrink-0 whitespace-nowrap rounded-md bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-mono tabular-nums font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
              53%–84% Rate Drops
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
              {formatModelCount(sponsorT.openrouter.title, MODELS_DATA.length)}
            </h3>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
              {formatModelCount(sponsorT.openrouter.subtitle, MODELS_DATA.length)}
            </p>
          </div>
        </div>

        <a
          href={OPENROUTER_SPONSOR_URL}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          onClick={handleOpenRouterClick}
          className="min-h-[44px] sm:min-h-[40px] w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98]"
        >
          <span>{sponsorT.openrouter.cta}</span>
          <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>

      {/* Speed Partner (Right): Groq LPU Inference Cloud */}
      <div className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-gradient-to-br dark:from-zinc-900/90 dark:via-amber-950/15 dark:to-zinc-900/90 p-4 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between gap-3.5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400">
                <Zap className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                    Groq LPU Inference Cloud
                  </span>
                </div>
                <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 mt-0.5">
                  {sponsorT.groq.badge}
                </span>
              </div>
            </div>

            <span className="shrink-0 whitespace-nowrap rounded-md bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 text-[10px] font-mono tabular-nums font-bold tracking-tight text-amber-700 dark:text-amber-400">
              $100 Free · 420 t/s
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
              {sponsorT.groq.title}
            </h3>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
              {sponsorT.groq.subtitle}
            </p>
          </div>
        </div>

        <a
          href={GROQ_SPONSOR_URL}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          onClick={handleGroqClick}
          className="min-h-[44px] sm:min-h-[40px] w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 shadow-md transition-all active:scale-[0.98]"
        >
          <span>{sponsorT.groq.cta}</span>
          <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    </div>
  );
}
