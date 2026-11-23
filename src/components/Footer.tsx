'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Cpu, Heart, Code2, Globe, Mail } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { getCarbonMigrationCountdown } from '@/lib/live-copy-helpers';

export default function Footer() {
  const { t, locale, getLocalizedPath } = useI18n();

  const { migrationTitle, countdownBadge } = useMemo(() => {
    const { daysLeft, isHikeActive, shortTagEn } = getCarbonMigrationCountdown();
    if (locale === 'zh-CN') {
      return {
        migrationTitle: 'Gemini 4 Carbon 12/1 涨价迁移',
        countdownBadge: isHikeActive ? '已涨价 2x' : daysLeft > 0 ? `剩${daysLeft}天` : '最后1天',
      };
    }
    if (locale === 'zh-TW') {
      return {
        migrationTitle: 'Gemini 4 Carbon 12/1 漲價遷移',
        countdownBadge: isHikeActive ? '已漲價 2x' : daysLeft > 0 ? `剩${daysLeft}天` : '最後1天',
      };
    }
    if (locale === 'ja') {
      return {
        migrationTitle: 'Gemini 4 Carbon 12/1 値上げ移行',
        countdownBadge: isHikeActive ? '2x適用中' : daysLeft > 0 ? `残${daysLeft}日` : '最終日',
      };
    }
    if (locale === 'ko') {
      return {
        migrationTitle: 'Gemini 4 Carbon 12/1 인상 마이그레이션',
        countdownBadge: isHikeActive ? '2배 적용' : daysLeft > 0 ? `${daysLeft}일 남음` : '마감일',
      };
    }
    if (locale === 'es') {
      return {
        migrationTitle: 'Migración Gemini 4 Carbon 1 dic',
        countdownBadge: isHikeActive ? 'Alza 2x' : daysLeft > 0 ? `${daysLeft}d` : 'Último día',
      };
    }
    return {
      migrationTitle: 'Gemini 4 Carbon Dec 1 Migration',
      countdownBadge: shortTagEn,
    };
  }, [locale]);

  return (
    <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/90 dark:bg-zinc-950/80 text-zinc-600 dark:text-zinc-400 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="mx-auto max-w-[1600px] grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="space-y-4 md:col-span-1">
          <Link href={getLocalizedPath('/')} className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-lg tracking-tight">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Cpu className="h-4 w-4" />
            </div>
            <span>TokenCosts AI</span>
          </Link>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {t.footer.about}
          </p>
          <div className="pt-1">
            <a
              href="mailto:www.smeng@gmail.com"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-white/80 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80"
            >
              <Mail className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>www.smeng@gmail.com</span>
            </a>
          </div>
          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
            <a
              href="https://github.com/thelifeofgame/tokencost"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              className="p-1.5 rounded-lg hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-900 transition-colors"
            >
              <Code2 className="h-4 w-4" />
            </a>
            <a
              href="https://tokencostsai.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Global Web Portal"
              className="p-1.5 rounded-lg hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-900 transition-colors"
            >
              <Globe className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Core Tools */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-300 mb-3">
            {t.footer.costEngines}
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href={getLocalizedPath('/')} className="hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors">
                {t.nav.simulator}
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/compare/')} className="hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors">
                {t.nav.compare}
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/harness/')} className="hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors">
                {t.nav.harness}
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/models/')} className="hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors">
                {t.nav.models}
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/calculator/')} className="hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors">
                {t.nav.calculators}
              </Link>
            </li>
          </ul>
        </div>

        {/* Popular Comparisons */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-300 mb-3">
            {t.footer.popularComparisons}
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href={getLocalizedPath('/compare/gemini-4-neon-vs-gpt-6.2-sol/')} className="hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors">
                Gemini 4 Neon vs GPT-6.2 Sol
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/compare/claude-sonnet-5.5-vs-gpt-6.2-astra/')} className="hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors">
                GPT-6.2 Astra vs Claude Sonnet 5.5
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/compare/gemini-4-carbon-vs-claude-sonnet-5.5/')} className="hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors">
                Gemini 4 Carbon vs Claude Sonnet 5.5
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/compare/deepseek-r1-vs-o3-mini/')} className="hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors">
                DeepSeek-R1 vs Azure o3-mini
              </Link>
            </li>
          </ul>
        </div>

        {/* Guides & Resources */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-300 mb-3">
            {t.footer.guides}
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link
                href={getLocalizedPath('/deals/')}
                className="group inline-flex items-center flex-wrap gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200 font-medium transition-colors"
              >
                <span>{t.nav.dealsFull}</span>
                <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-mono font-semibold leading-none text-emerald-800 dark:text-emerald-200 whitespace-nowrap">
                  {t.deals.drawerBfBadge}
                </span>
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/pricing/realtime-voice-world-model-api-costs/')} className="text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-200 transition-colors">
                Genie 4 &amp; Voice Standby API Costs
              </Link>
            </li>
            <li>
              <Link
                href={getLocalizedPath('/pricing/gemini-4-carbon-dec-1-migration-guide/')}
                className="group inline-flex items-center flex-wrap gap-1.5 text-xs text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-rose-200 transition-colors"
              >
                <span>{migrationTitle}</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/35 bg-rose-500/10 dark:bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-mono tabular-nums font-bold leading-none text-rose-800 dark:text-rose-200 whitespace-nowrap">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>{countdownBadge}</span>
                </span>
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/pricing/cheapest-llm-api-providers/')} className="hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors">
                Cheapest LLM APIs in 2026
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/pricing/prompt-caching-cost-guide/')} className="hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors">
                Prompt Caching Surcharge Breakdown
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/pricing/batch-api-discount-comparison/')} className="hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors">
                Batch API 50% Off Guide
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/developers/')} className="hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors">
                {t.nav.developers}
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/contact/')} className="hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors text-indigo-600 dark:text-indigo-400 font-medium">
                {t.nav.contact}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] border-t border-zinc-200 dark:border-zinc-900 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500">
        <p>© 2026 {t.footer.copyright}</p>
        <p className="flex items-center gap-1 mt-2 sm:mt-0">
          <span>{t.footer.craftedWith}</span>
          <Heart className="h-3 w-3 text-red-500 fill-red-500" />
          <span>{t.footer.noFluff}</span>
        </p>
      </div>
    </footer>
  );
}
