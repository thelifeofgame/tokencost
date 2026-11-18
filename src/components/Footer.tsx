'use client';

import React from 'react';
import Link from 'next/link';
import { Cpu, Heart, Code2, Globe, Mail } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';

export default function Footer() {
  const { t, getLocalizedPath } = useI18n();

  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950/80 text-zinc-400 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="mx-auto max-w-[1600px] grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="space-y-4 md:col-span-1">
          <Link href={getLocalizedPath('/')} className="flex items-center gap-2 text-zinc-100 font-bold text-lg tracking-tight">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Cpu className="h-4 w-4" />
            </div>
            <span>TokenCosts AI<span className="text-indigo-400">.io</span></span>
          </Link>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {t.footer.about}
          </p>
          <div className="pt-1">
            <a
              href="mailto:www.smeng@gmail.com"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-indigo-400 transition-colors bg-zinc-900/60 hover:bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-800/80"
            >
              <Mail className="h-3.5 w-3.5 text-indigo-400" />
              <span>www.smeng@gmail.com</span>
            </a>
          </div>
          <div className="flex items-center gap-3 text-zinc-400">
            <a
              href="https://github.com/thelifeofgame/tokencost"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              className="p-1.5 rounded-lg hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            >
              <Code2 className="h-4 w-4" />
            </a>
            <a
              href="https://tokencostsai.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Global Web Portal"
              className="p-1.5 rounded-lg hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            >
              <Globe className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Core Tools */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-3">
            {t.footer.costEngines}
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href={getLocalizedPath('/')} className="hover:text-zinc-200 transition-colors">
                {t.nav.simulator}
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/compare')} className="hover:text-zinc-200 transition-colors">
                {t.nav.compare}
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/models')} className="hover:text-zinc-200 transition-colors">
                {t.nav.models}
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/calculator')} className="hover:text-zinc-200 transition-colors">
                {t.nav.calculators}
              </Link>
            </li>
          </ul>
        </div>

        {/* Popular Comparisons */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-3">
            {t.footer.popularComparisons}
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href={getLocalizedPath('/compare/claude-3-5-sonnet-vs-gpt-4o/')} className="hover:text-zinc-200 transition-colors">
                Claude 3.5 Sonnet vs GPT-4o
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/compare/deepseek-r1-vs-openai-o1/')} className="hover:text-zinc-200 transition-colors">
                DeepSeek-R1 vs OpenAI o1
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/compare/deepseek-v3-vs-gpt-4o/')} className="hover:text-zinc-200 transition-colors">
                DeepSeek-V3 vs GPT-4o
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/compare/claude-3-5-haiku-vs-gpt-4o-mini/')} className="hover:text-zinc-200 transition-colors">
                Claude 3.5 Haiku vs GPT-4o mini
              </Link>
            </li>
          </ul>
        </div>

        {/* Guides & Resources */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-3">
            {t.footer.guides}
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href={getLocalizedPath('/pricing/cheapest-llm-api-providers/')} className="hover:text-zinc-200 transition-colors">
                Cheapest LLM APIs in 2026
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/pricing/prompt-caching-cost-guide/')} className="hover:text-zinc-200 transition-colors">
                Prompt Caching Surcharge Breakdown
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/pricing/batch-api-discount-comparison/')} className="hover:text-zinc-200 transition-colors">
                Batch API 50% Off Guide
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/developers/')} className="hover:text-zinc-200 transition-colors">
                {t.nav.developers}
              </Link>
            </li>
            <li>
              <Link href={getLocalizedPath('/contact')} className="hover:text-zinc-200 transition-colors text-indigo-400 font-medium">
                {t.nav.contact}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] border-t border-zinc-900 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500">
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
