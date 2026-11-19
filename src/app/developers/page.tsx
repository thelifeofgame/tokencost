'use client';

import React, { useState } from 'react';
import { Terminal, Copy, Check, FileCode } from 'lucide-react';
import SchemaOrg from '@/components/seo/SchemaOrg';
import BadgeGenerator from '@/components/BadgeGenerator';
import { useI18n } from '@/i18n/I18nProvider';
import { trackEvent } from '@/lib/analytics';

export default function DevelopersPage() {
  const { t, locale } = useI18n();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
    trackEvent('developers_sdk_copy', {
      sdk_section: id,
      locale,
    });
  };

  const litellmConfig = `model_list:
  # 2026 Cost-optimized intelligent router configuration
  - model_name: cost-router-fast
    litellm_params:
      model: deepseek/deepseek-v4.1-flash
      api_base: https://api.deepseek.com
      api_key: os.environ/DEEPSEEK_API_KEY
  - model_name: cost-router-coding
    litellm_params:
      model: openrouter/google/gemini-4-neon
      api_key: os.environ/OPENROUTER_API_KEY
  - model_name: cost-router-flagship
    litellm_params:
      model: anthropic/claude-sonnet-5.5
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: cost-router-architect
    litellm_params:
      model: openai/gpt-6.2-sol
      api_key: os.environ/OPENAI_API_KEY

router_settings:
  routing_strategy: cost-based-routing
  max_budget_per_req: 0.005
  fallbacks: [{"cost-router-coding": ["cost-router-flagship", "cost-router-architect"]}]`;

  const vercelAiCode = `import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

// TokenCosts AI Dynamic Routing Gateway (2026 Flagships)
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': 'https://tokencostsai.com',
    'X-Title': 'TokenCosts AI-Router',
  },
});

export async function executeCostOptimizedPrompt(prompt: string, isComplex = false) {
  const targetModel = isComplex
    ? 'google/gemini-4-neon'
    : 'deepseek/deepseek-v4.1-flash';

  return await generateText({
    model: openrouter(targetModel),
    prompt,
  });
}`;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <SchemaOrg
        name={t.developers.title}
        description={t.developers.desc}
        url="https://tokencostsai.com/developers"
      />

      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400">
          <Terminal className="h-3.5 w-3.5" />
          <span>{t.developers.badge}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-100">
          {t.developers.title}
        </h1>
        <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
          {t.developers.desc}
        </p>
      </div>

      {/* Section 1: LiteLLM Configuration */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-md shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-indigo-400" />
            <h2 className="text-base font-bold text-zinc-100">
              LiteLLM Proxy Config (`config.yaml`)
            </h2>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(litellmConfig, 'litellm')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            {copiedSection === 'litellm' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">{t.common.copied}</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>{t.developers.copyCode} YAML</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-zinc-950 font-mono text-xs text-zinc-200 overflow-x-auto leading-relaxed border border-zinc-800/80">
          <code>{litellmConfig}</code>
        </pre>
      </div>

      {/* Section 2: Vercel AI SDK */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-md shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-indigo-400" />
            <h2 className="text-base font-bold text-zinc-100">
              Vercel AI SDK (TypeScript)
            </h2>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(vercelAiCode, 'vercel')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            {copiedSection === 'vercel' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">{t.common.copied}</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>{t.developers.copyCode} TS</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-zinc-950 font-mono text-xs text-zinc-200 overflow-x-auto leading-relaxed border border-zinc-800/80">
          <code>{vercelAiCode}</code>
        </pre>
      </div>

      {/* Section 3: Static GitHub README Dynamic Cost Badge Generator */}
      <BadgeGenerator />
    </div>
  );
}
