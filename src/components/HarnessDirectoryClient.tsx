'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  HARNESS_TOOLS,
  HARNESS_VERIFIED_DATE,
  HarnessCategoryId,
  HarnessTool,
} from '@/lib/harness-data';
import { useI18n } from '@/i18n/I18nProvider';
import {
  Terminal,
  Cpu,
  Award,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  Code2,
} from 'lucide-react';

type FilterTab = 'all' | HarnessCategoryId;
type SortOption = 'multiplier' | 'overhead' | 'stars';

const HUB_FAQS = [
  {
    id: 'hub-faq-1',
    tag: 'Multiplier',
    question: 'What is a Coding Agent\'s "Real Token Multiplier" and why does it matter?',
    questionZh: '什么是 Coding Agent 的“真实 Token 消耗倍率”，为什么它比模型单价更关键？',
    answer:
      'A harness\'s Real Token Multiplier measures total input and output tokens billed during a multi-turn coding task divided by the raw user prompt and diff size. Due to system prompt overhead, file-tree indexing, tool schemas, and error retries, tools range from 1.2x (Aider) to 3.8x (DeepSeek Harness)—meaning the exact same model can cost over 3x more depending on your harness.',
    answerZh:
      '真实 Token 消耗倍率衡量的是完成一次多轮编码任务时，实际向 API 计费的总 Token 与原始用户输入/Diff 体积的比值。由于系统提示词底噪、文件树索引、工具 Schema 注入与重试循环，不同工具的倍率跨度高达 1.2x（Aider）到 3.8x（DeepSeek Harness）——同样的模型换个工具，账单可能相差超 3 倍。',
  },
  {
    id: 'hub-faq-2',
    tag: 'BYOK ROI',
    question: 'How does BYOK cost optimization beat flat $20/month IDE subscriptions?',
    questionZh: 'BYOK（自带 API Key）降本方案如何胜过 $20/月固定订阅？',
    answer:
      'Bring Your Own Key (BYOK) lets you pair lightweight harnesses like Aider, Cline, or Roo Code with 95%–98% Prompt Caching models such as Gemini 4 Neon ($0.15/1M cached), Claude Sonnet 5.5 ($0.10/1M cached), and DeepSeek-V4.1-Flash ($0.006/1M cached). Light-to-medium developers often cut monthly spend to $4–$12 while avoiding opaque subscription rate limits.',
    answerZh:
      '通过 BYOK 将 Aider、Cline 或 Roo Code 接入支持 95%–98% 缓存折扣的模型（如 Gemini 4 Neon 缓存读 $0.15/M、Claude Sonnet 5.5 $0.10/M、DeepSeek-V4.1-Flash $0.006/M），中轻度开发者的月均花费可降至 $4–$12，同时彻底摆脱订阅制的隐式排队与限流。',
  },
  {
    id: 'hub-faq-3',
    tag: 'Architecture',
    question: 'Which Coding Harness is the most token-efficient for large repositories in 2026?',
    questionZh: '2026 年在大型代码仓库中，哪款 Coding Harness 最省 Token？',
    answer:
      'Aider (1.2x–1.8x) leads in raw token efficiency via Tree-Sitter AST Repo-Map pruning, followed by OpenCode/Continue (1.5x–2.3x), OpenAI Codex CLI (1.6x–2.4x), and Roo Code (1.7x–2.6x). Pairing these harnesses with 1M-context models like Gemini 4 Neon or GPT-6.2 Sol maximizes cache hit rates across multi-file refactors.',
    answerZh:
      'Aider（1.2x–1.8x）凭借 Tree-Sitter AST Repo-Map 精准剪枝位居效率榜首，其次是 OpenCode/Continue（1.5x–2.3x）、OpenAI Codex CLI（1.6x–2.4x）与 Roo Code（1.7x–2.6x）。搭配 Gemini 4 Neon 或 GPT-6.2 Sol 等百万上下文模型，可在多文件重构中获得极高的缓存命中率。',
  },
];

function getShortTypeLabel(category: HarnessCategoryId): string {
  if (category === 'cli-agent') return 'CLI';
  if (category === 'ai-ide') return 'IDE';
  return 'Plugin';
}

function getMultiplierBarMetrics(min: number, max: number) {
  // Map 1.0x -> 4.0x across 0% -> 100%
  const clampedMin = Math.max(1.0, Math.min(4.0, min));
  const clampedMax = Math.max(clampedMin, Math.min(4.0, max));
  const leftPct = ((clampedMin - 1.0) / 3.0) * 100;
  const widthPct = Math.max(8, ((clampedMax - clampedMin) / 3.0) * 100);

  let barColor = 'bg-indigo-500';
  if (max <= 1.8) barColor = 'bg-emerald-500';
  else if (max <= 2.8) barColor = 'bg-cyan-500';
  else barColor = 'bg-amber-500';

  return { leftPct, widthPct, barColor };
}

function getByokBadge(tool: HarnessTool) {
  if (tool.byokSupport.customBaseUrl && tool.isOpenSource) {
    return {
      label: 'Native BYOK',
      className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    };
  }
  if (tool.byokSupport.customBaseUrl) {
    return {
      label: 'Custom BaseURL',
      className: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    };
  }
  return {
    label: 'Official / Partial',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  };
}

function getMonogram(slug: string): string {
  const map: Record<string, string> = {
    'claude-code': 'CC',
    cursor: 'CU',
    windsurf: 'WS',
    aider: 'AI',
    cline: 'CL',
    'roo-code': 'RC',
    'opencode-continue': 'OC',
    'codex-cli': 'CX',
    'deepseek-harness': 'DS',
    zcode: 'ZC',
    'muse-code': 'MC',
    antigravity: 'AG',
  };
  return map[slug] || slug.slice(0, 2).toUpperCase();
}

export default function HarnessDirectoryClient() {
  const { locale } = useI18n();
  const isZh = locale === 'zh-CN' || locale === 'zh-TW';

  const [categoryFilter, setCategoryFilter] = useState<FilterTab>('all');
  const [byokOnly, setByokOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('multiplier');
  const [openFaqId, setOpenFaqId] = useState<string>(HUB_FAQS[0].id);

  const byokReadyCount = useMemo(
    () => HARNESS_TOOLS.filter((tool) => tool.byokSupport.customBaseUrl).length,
    []
  );

  const filteredTools = useMemo(() => {
    const list = HARNESS_TOOLS.filter((tool) => {
      if (categoryFilter !== 'all' && tool.category !== categoryFilter) return false;
      if (byokOnly && !tool.byokSupport.customBaseUrl) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'multiplier') {
        return a.tokenMultiplierMin - b.tokenMultiplierMin || a.tokenMultiplierMax - b.tokenMultiplierMax;
      }
      if (sortBy === 'overhead') {
        return a.baseSystemPromptTokens - b.baseSystemPromptTokens;
      }
      return (b.githubStars || 0) - (a.githubStars || 0);
    });
  }, [categoryFilter, byokOnly, sortBy]);

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: isZh ? `全部 (${HARNESS_TOOLS.length})` : `All (${HARNESS_TOOLS.length})` },
    { id: 'cli-agent', label: 'CLI' },
    { id: 'ai-ide', label: 'IDE' },
    { id: 'ide-extension', label: isZh ? 'VS Code 插件' : 'VS Code Plugin' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Hero Section */}
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400">
          <Terminal className="h-3.5 w-3.5" />
          <span>
            {isZh
              ? `${HARNESS_TOOLS.length} 款实测 Coding Harness · 更新于 ${HARNESS_VERIFIED_DATE}`
              : `${HARNESS_TOOLS.length} Verified Coding Harnesses · Updated ${HARNESS_VERIFIED_DATE}`}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50">
          {isZh
            ? 'Coding Agent 与 Harness 真实 Token 消耗倍率与 BYOK 省钱评测'
            : 'Coding Agent & Harness Token Cost Benchmark'}
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
          {isZh
            ? `实测 ${HARNESS_TOOLS.length} 款主流 Coding Agent（含 Claude Code、OpenAI Codex CLI、DeepSeek Harness、Cursor、Google Antigravity、ZCode、Muse Code、Aider 等）在 15 轮跨文件代码重构任务下的真实 Token 消耗倍率、System Prompt 隐性底噪与缓存命中率，附带生产级 BYOK 配置模板。`
            : `Audit the real token multiplier, system prompt overhead, and BYOK cost optimization across ${HARNESS_TOOLS.length} coding harnesses—including Claude Code, OpenAI Codex CLI, DeepSeek Harness, Cursor, Windsurf, Google Antigravity, ZCode, Muse Code, Aider, Cline, Roo Code & OpenCode—on standardized 15-turn repo refactors.`}
        </p>
      </header>

      {/* 3-Stat KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span>{isZh ? '省钱效率冠军' : 'Most Token-Efficient'}</span>
            <Award className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            Aider · 1.2x – 1.8x
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {isZh ? 'Tree-Sitter AST Repo-Map 精准上下文剪枝' : 'Tree-Sitter AST Repo-Map context pruning'}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span>{isZh ? '最低系统提示词底噪' : 'Lowest System Overhead'}</span>
            <Cpu className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-zinc-100">
            ~1,150 tok
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {isZh ? '对比 AI IDE / CLI 约 3,600–6,900 tok 固定注入' : 'vs ~3,600–6,900 tok in heavy AI IDEs & CLIs'}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span>{isZh ? '支持完整自定义网关 (BYOK)' : 'Full BYOK / Custom BaseURL'}</span>
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-300">
            {byokReadyCount} / {HARNESS_TOOLS.length} Harnesses
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {isZh ? '支持 DeepSeek / OpenRouter 兼容端点直连' : 'Direct DeepSeek, LiteLLM & OpenRouter routing'}
          </p>
        </div>
      </section>

      {/* Filter & Sort Control Bar */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl bg-zinc-900/80 border border-zinc-800 p-1 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-1">
          {filterTabs.map((tab) => {
            const active = categoryFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`shrink-0 min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs transition-all ${
                  active
                    ? 'bg-zinc-800 text-zinc-50 shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 font-medium'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setByokOnly((prev) => !prev)}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-medium inline-flex items-center gap-1.5 transition-all ${
              byokOnly
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <CheckCircle2 className={`h-3.5 w-3.5 ${byokOnly ? 'text-emerald-400' : 'text-zinc-500'}`} />
            <span>{isZh ? '仅看支持 BYOK' : 'BYOK Ready'}</span>
          </button>

          <div className="relative flex items-center">
            <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400 absolute left-3 pointer-events-none" />
            <select
              aria-label={isZh ? '排序方式' : 'Sort harnesses'}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="min-h-[44px] pl-8 pr-8 py-2 rounded-xl border border-zinc-800 bg-zinc-900/80 text-xs font-medium text-zinc-200 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="multiplier">
                {isZh ? '倍率从低到高' : 'Multiplier (Low → High)'}
              </option>
              <option value="overhead">
                {isZh ? '系统底噪从低到高' : 'System Overhead (Low → High)'}
              </option>
              <option value="stars">
                {isZh ? 'GitHub Stars 从高到低' : 'GitHub Stars (High → Low)'}
              </option>
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400 absolute right-2.5 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Desktop Matrix Table */}
      <section className="hidden md:block rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-950/50">
                <th className="py-3.5 px-4">Coding Agent / Harness</th>
                <th className="py-3.5 px-4">Token Multiplier (vs Raw API)</th>
                <th className="py-3.5 px-4">System Prompt Overhead</th>
                <th className="py-3.5 px-4">BYOK / BaseURL</th>
                <th className="py-3.5 px-4">Best Paired Models</th>
                <th className="py-3.5 px-4 text-right">Spec</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {filteredTools.map((tool) => {
                const isAider = tool.slug === 'aider';
                const { leftPct, widthPct, barColor } = getMultiplierBarMetrics(
                  tool.tokenMultiplierMin,
                  tool.tokenMultiplierMax
                );
                const byokBadge = getByokBadge(tool);
                const topModels = tool.recommendedModels.slice(0, 2);

                return (
                  <tr
                    key={tool.slug}
                    className={`transition-colors ${
                      isAider
                        ? 'bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08] border-l-2 border-l-emerald-500'
                        : 'hover:bg-zinc-800/30'
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center font-mono font-bold text-xs text-zinc-200">
                          {getMonogram(tool.slug)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/harness/${tool.slug}/`}
                              className="text-sm font-semibold text-zinc-100 hover:text-indigo-300 transition-colors"
                            >
                              {tool.name}
                            </Link>
                            <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                              {getShortTypeLabel(tool.category)}
                            </span>
                            {isAider && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                <Sparkles className="h-2.5 w-2.5" />
                                <span>Token Saver #1</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 truncate max-w-[230px] mt-0.5">
                            {isZh ? tool.taglineZh : tool.tagline}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-1.5">
                        <div
                          className="h-2 w-32 rounded-full bg-zinc-800 relative overflow-hidden"
                          title={`${tool.tokenMultiplierMin.toFixed(1)}x - ${tool.tokenMultiplierMax.toFixed(1)}x`}
                        >
                          <div
                            className={`absolute top-0 bottom-0 rounded-full ${barColor}`}
                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          />
                        </div>
                        <div
                          className={`font-mono text-xs font-semibold ${
                            isAider ? 'text-emerald-400' : 'text-zinc-200'
                          }`}
                        >
                          {tool.tokenMultiplierMin.toFixed(1)}x – {tool.tokenMultiplierMax.toFixed(1)}x
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-mono text-xs text-zinc-200">
                        ~{tool.baseSystemPromptTokens.toLocaleString()} tok
                      </div>
                      <div className="text-[11px] text-zinc-500 max-w-[210px] truncate mt-0.5">
                        {isZh ? tool.compactionStrategyZh : tool.compactionStrategy}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${byokBadge.className}`}
                      >
                        {byokBadge.label}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {topModels.map((m) => (
                          <Link
                            key={m.modelId}
                            href={`/models/${m.modelId}/`}
                            className="px-2 py-1 rounded-md text-[11px] font-mono border border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-indigo-500/50 hover:text-indigo-300 transition-colors"
                          >
                            {m.modelId}
                          </Link>
                        ))}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/harness/${tool.slug}/`}
                        className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-indigo-600 text-xs font-medium text-zinc-200 hover:text-white transition-colors"
                      >
                        <span>{isZh ? '详情' : 'Inspect'}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Mobile Compact Card Stack */}
      <section className="md:hidden space-y-3">
        {filteredTools.map((tool) => {
          const isAider = tool.slug === 'aider';
          const { leftPct, widthPct, barColor } = getMultiplierBarMetrics(
            tool.tokenMultiplierMin,
            tool.tokenMultiplierMax
          );
          const byokBadge = getByokBadge(tool);

          return (
            <div
              key={tool.slug}
              className={`rounded-2xl border p-4 space-y-3.5 ${
                isAider
                  ? 'border-emerald-500/40 bg-emerald-500/[0.04]'
                  : 'border-zinc-800/80 bg-zinc-900/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 shrink-0 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center font-mono font-bold text-xs text-zinc-200">
                    {getMonogram(tool.slug)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-zinc-100">{tool.name}</span>
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                        {getShortTypeLabel(tool.category)}
                      </span>
                    </div>
                    {isAider && (
                      <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Token Saver #1
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border ${byokBadge.className}`}
                >
                  {byokBadge.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl bg-zinc-950/70 border border-zinc-800/80 p-2.5">
                  <span className="text-[10px] uppercase text-zinc-500 block">
                    Token Multiplier
                  </span>
                  <div className="h-1.5 w-full rounded-full bg-zinc-800 relative overflow-hidden my-1.5">
                    <div
                      className={`absolute top-0 bottom-0 rounded-full ${barColor}`}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    />
                  </div>
                  <span
                    className={`font-mono text-xs font-bold ${
                      isAider ? 'text-emerald-400' : 'text-zinc-100'
                    }`}
                  >
                    {tool.tokenMultiplierMin.toFixed(1)}x – {tool.tokenMultiplierMax.toFixed(1)}x
                  </span>
                </div>

                <div className="rounded-xl bg-zinc-950/70 border border-zinc-800/80 p-2.5">
                  <span className="text-[10px] uppercase text-zinc-500 block">
                    System Overhead
                  </span>
                  <span className="font-mono text-sm font-bold text-zinc-100 block mt-2">
                    ~{tool.baseSystemPromptTokens.toLocaleString()} tok
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {tool.recommendedModels.slice(0, 2).map((m) => (
                  <Link
                    key={m.modelId}
                    href={`/models/${m.modelId}/`}
                    className="px-2 py-1 rounded-md text-[11px] font-mono border border-zinc-800 bg-zinc-950/60 text-zinc-300"
                  >
                    {m.modelId}
                  </Link>
                ))}
              </div>

              <Link
                href={`/harness/${tool.slug}/`}
                className="min-h-[44px] w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
              >
                <span>{isZh ? '查看 BYOK 配置与详测 →' : 'Inspect Config & Benchmarks →'}</span>
              </Link>
            </div>
          );
        })}
      </section>

      {/* Channel Hub FAQs */}
      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 sm:p-6 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-zinc-100">
            {isZh ? 'Coding Agent 计费机制与 BYOK 常见问题' : 'Coding Harness Token Cost & BYOK FAQ'}
          </h2>
          <Link
            href="/developers/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>{isZh ? '获取 GitHub README 成本徽章 →' : 'Get GitHub README Cost Badge →'}</span>
          </Link>
        </div>

        <div className="divide-y divide-zinc-800/70 rounded-xl border border-zinc-800 bg-zinc-950/50 overflow-hidden">
          {HUB_FAQS.map((faq, idx) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div key={faq.id}>
                <button
                  type="button"
                  onClick={() => setOpenFaqId(isOpen ? '' : faq.id)}
                  className="min-h-[48px] w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-6 w-6 shrink-0 rounded-full bg-indigo-500/10 text-indigo-400 font-mono text-xs font-semibold flex items-center justify-center">
                      0{idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-zinc-100">
                      {isZh ? faq.questionZh : faq.question}
                    </span>
                    <span className="hidden sm:inline-flex shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-400">
                      {faq.tag}
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pl-[52px] text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/50 pt-3">
                    {isZh ? faq.answerZh : faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
