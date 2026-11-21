'use client';

import React, { useState } from 'react';
import { RouterRecommendation } from '@/types/pricing';
import { trackEvent } from '@/lib/analytics';
import { useI18n } from '@/i18n/I18nProvider';
import { X, Copy, Check, Terminal, FileCode, Code2, ArrowRight } from 'lucide-react';

interface ConfigExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: RouterRecommendation | null;
}

const OPENROUTER_SMART_ROUTER_URL =
  'https://openrouter.ai/?ref=tokencostsai_com&utm_source=tokencostsai_com&utm_medium=smart_router_export&utm_campaign=openrouter_gateway';

export default function ConfigExporterModal({
  isOpen,
  onClose,
  recommendation,
}: ConfigExporterModalProps) {
  const { locale } = useI18n();
  const [activeTab, setActiveTab] = useState<'litellm' | 'ts' | 'py'>('litellm');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !recommendation) return null;

  const getCode = () => {
    switch (activeTab) {
      case 'litellm':
        return recommendation.codeSnippets.litellmYaml;
      case 'ts':
        return recommendation.codeSnippets.vercelAiTs;
      case 'py':
        return recommendation.codeSnippets.pythonSdk;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    trackEvent('router_code_copy', {
      strategy_id: recommendation.id,
      active_tab: activeTab,
      savings_pct: recommendation.savingsVsBaseline,
      locale,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenRouterCta = () => {
    trackEvent('affiliate_click', {
      partner: 'openrouter',
      placement: 'smart_router_export_modal',
      cta_slot: 'modal_footer_openrouter_cta',
      strategy_id: recommendation.id,
      active_tab: activeTab,
      savings_pct: recommendation.savingsVsBaseline,
      offer_tag: 'unified_gateway_single_key',
      outbound_url: OPENROUTER_SMART_ROUTER_URL,
      locale,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <Code2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
                Export Router Integration Code
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                {recommendation.name} •{' '}
                {recommendation.savingsVsBaseline >= 0
                  ? `Save ${recommendation.savingsVsBaseline}%`
                  : `+${Math.abs(recommendation.savingsVsBaseline)}% Frontier Tier`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switchers + Copy */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4 mb-3">
          <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab('litellm')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'litellm'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>LiteLLM YAML</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'ts'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Vercel AI SDK (TS)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('py')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'py'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Python SDK</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="min-h-[34px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all active:scale-[0.98] shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-300" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Snippet</span>
              </>
            )}
          </button>
        </div>

        {/* OpenRouter Gateway & Env Hint Strip */}
        <div className="mb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-indigo-200/80 dark:border-indigo-500/25 bg-indigo-50/70 dark:bg-indigo-950/25 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate">
              Unified Endpoint:{' '}
              <code className="font-mono text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                https://openrouter.ai/api/v1
              </code>
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Env:
            </span>
            <code className="rounded-md bg-white/90 dark:bg-zinc-900 border border-indigo-200/80 dark:border-zinc-700 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
              OPENROUTER_API_KEY
            </code>
          </div>
        </div>

        {/* Code View (Terminal Surface) */}
        <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/90 font-mono text-xs text-zinc-100 overflow-x-auto max-h-80 leading-relaxed scrollbar-thin">
          <code>{getCode()}</code>
        </pre>

        {/* Footer CTA */}
        <div className="mt-4 pt-3.5 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
            One OpenRouter API key unlocks DeepSeek, GLM, Qwen, Anthropic &amp; Google routes at today&apos;s lowest rates.
          </span>

          <div className="flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors"
            >
              Done
            </button>
            <a
              href={OPENROUTER_SMART_ROUTER_URL}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              onClick={handleOpenRouterCta}
              className="min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm shadow-indigo-500/25 transition-all active:scale-[0.98] whitespace-nowrap"
            >
              <span>Get OpenRouter API Key</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
