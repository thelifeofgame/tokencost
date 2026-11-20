'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Mail } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { getAuditCardCopy } from '@/lib/pricing-topics-seo';
import { trackEvent } from '@/lib/analytics';

interface TopicB2BAuditCardProps {
  topicSlug: string;
}

export default function TopicB2BAuditCard({ topicSlug }: TopicB2BAuditCardProps) {
  const { locale, getLocalizedPath } = useI18n();
  const copy = getAuditCardCopy(locale, topicSlug);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/[0.08] via-white/90 to-emerald-500/[0.06] dark:from-indigo-950/40 dark:via-zinc-900/80 dark:to-emerald-950/20 p-6 sm:p-8 backdrop-blur-md">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent" />
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-[11px] font-mono font-semibold text-indigo-700 dark:text-indigo-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>ENTERPRISE FINOPS AUDIT</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {copy.title}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {copy.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <Link
            href={getLocalizedPath(copy.contactHref)}
            onClick={() =>
              trackEvent('pricing_audit_cta_click', {
                topic: topicSlug,
                target: '/contact',
                locale,
              })
            }
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98]"
          >
            <span>{copy.primaryCta}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <a
            href="mailto:www.smeng@gmail.com?subject=TokenCosts%20AI%20Pre-Dec-1%20Migration%20Audit"
            onClick={() =>
              trackEvent('pricing_audit_cta_click', {
                topic: topicSlug,
                target: 'mailto:www.smeng@gmail.com',
                locale,
              })
            }
            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Mail className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{copy.emailLabel}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
