'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HarnessTool,
  HARNESS_TOOLS,
  estimateHarnessTaskCost,
  getHarnessAverageMultiplier,
} from '@/lib/harness-data';
import { MODELS_DATA } from '@/lib/models-data';
import { useI18n } from '@/i18n/I18nProvider';
import { trackEvent } from '@/lib/analytics';
import {
  Check,
  Copy,
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  Terminal,
  Cpu,
  Database,
  Layers,
  AlertTriangle,
  ShieldAlert,
  Lightbulb,
  Calculator,
  ArrowRight,
  Star,
} from 'lucide-react';

interface HarnessDetailClientProps {
  tool: HarnessTool;
  seoH1: string;
}

function getStatusBadgeClass(value: string): string {
  const lower = value.toLowerCase();
  if (
    lower.includes('native') ||
    lower.includes('full') ||
    lower.includes('stable') ||
    lower.includes('supported')
  ) {
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  }
  if (
    lower.includes('partial') ||
    lower.includes('provider') ||
    lower.includes('emulation') ||
    lower.includes('medium')
  ) {
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }
  return 'bg-zinc-800/70 text-zinc-400 border-zinc-700';
}

function getSeverityBadge(severity: 'critical' | 'warning' | 'tip') {
  if (severity === 'critical') {
    return {
      label: 'Token Spike',
      icon: ShieldAlert,
      className: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };
  }
  if (severity === 'warning') {
    return {
      label: 'Cost Trap',
      icon: AlertTriangle,
      className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };
  }
  return {
    label: 'Pro Tip',
    icon: Lightbulb,
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };
}

export default function HarnessDetailClient({
  tool,
  seoH1,
}: HarnessDetailClientProps) {
  const { locale } = useI18n();
  const isZh = locale === 'zh-CN' || locale === 'zh-TW';

  const [copiedInstall, setCopiedInstall] = useState(false);
  const [activeTemplateIdx, setActiveTemplateIdx] = useState(0);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [openFaqId, setOpenFaqId] = useState<string>(tool.topFaqs[0]?.id || '');

  const avgMultiplier = getHarnessAverageMultiplier(tool);
  const templates =
    tool.configTemplates && tool.configTemplates.length > 0
      ? tool.configTemplates
      : [
          {
            id: `${tool.slug}-default`,
            title: tool.configTemplate.filename,
            titleZh: tool.configTemplate.filename,
            provider: 'BYOK',
            language: tool.configTemplate.language,
            filename: tool.configTemplate.filename,
            code: tool.configTemplate.code,
          },
        ];
  const activeTemplate = templates[activeTemplateIdx] || templates[0];

  // Stacked breakdown calculation across 15-turn standardized task (30,000 raw input)
  const rawPayload = 30000;
  const totalEstInput = Math.round(rawPayload * avgMultiplier);
  const overheadDelta = Math.max(3000, totalEstInput - rawPayload);
  const sysPromptPart = Math.min(tool.baseSystemPromptTokens * 2, Math.round(overheadDelta * 0.35));
  const repoContextPart = Math.round((overheadDelta - sysPromptPart) * 0.45);
  const toolLoopPart = Math.max(0, overheadDelta - sysPromptPart - repoContextPart);
  const barTotal = rawPayload + sysPromptPart + repoContextPart + toolLoopPart;

  const segments = [
    {
      label: isZh ? '原始任务载荷' : 'Base Task Payload',
      tokens: rawPayload,
      pct: Math.round((rawPayload / barTotal) * 100),
      color: 'bg-zinc-600',
    },
    {
      label: isZh ? 'System Prompt 底噪' : 'System Prompt Overhead',
      tokens: sysPromptPart,
      pct: Math.round((sysPromptPart / barTotal) * 100),
      color: 'bg-indigo-500',
    },
    {
      label: isZh ? '仓库上下文 / Repo-Map' : 'Context / Repo-Map',
      tokens: repoContextPart,
      pct: Math.round((repoContextPart / barTotal) * 100),
      color: 'bg-cyan-500',
    },
    {
      label: isZh ? '多轮工具调用循环' : 'Multi-Turn Tool Loop',
      tokens: toolLoopPart,
      pct: Math.max(1, 100 - Math.round((rawPayload / barTotal) * 100) - Math.round((sysPromptPart / barTotal) * 100) - Math.round((repoContextPart / barTotal) * 100)),
      color: 'bg-amber-500',
    },
  ];

  const handleCopyInstall = async () => {
    try {
      await navigator.clipboard.writeText(tool.installCommand);
      setCopiedInstall(true);
      setTimeout(() => setCopiedInstall(false), 2000);
    } catch {
      // Ignore clipboard permission failure
    }
  };

  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(activeTemplate.code);
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 2000);
      trackEvent('harness_config_copy', {
        harness_slug: tool.slug,
        provider_or_model: activeTemplate.provider,
        config_format: activeTemplate.language,
        locale,
      });
    } catch {
      // Ignore clipboard permission failure
    }
  };

  const primaryModelId = tool.recommendedModels[0]?.modelId || 'gemini-4-neon';
  const hitMin = tool.promptCachingSupport.hitRateRangePercent?.[0] ?? 65;
  const hitMax = tool.promptCachingSupport.hitRateRangePercent?.[1] ?? 85;
  const hitAvg = Math.round((hitMin + hitMax) / 2);

  const peerHarnesses = HARNESS_TOOLS.filter((h) => h.slug !== tool.slug).slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Top Breadcrumb & Meta Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/harness/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{isZh ? '返回全部 Coding Harnesses' : 'All Coding Harnesses'}</span>
        </Link>

        <span className="font-mono text-[11px] text-zinc-500">
          Verified: {tool.verifiedDate}
        </span>
      </div>

      {/* Section A: Header & Quick Spec Bento Card (7 + 5) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 sm:p-7 backdrop-blur-md shadow-xl flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-md bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                {isZh ? tool.categoryLabelZh : tool.categoryLabel}
              </span>
              {tool.githubStars !== null && tool.githubStars > 0 && (
                <span className="rounded-md bg-zinc-800 px-2.5 py-0.5 text-xs font-mono text-amber-300 inline-flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>
                    {tool.githubStars >= 1000
                      ? `${(tool.githubStars / 1000).toFixed(1)}k`
                      : tool.githubStars}
                  </span>
                </span>
              )}
              <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-xs font-mono text-zinc-400">
                {tool.latestVersion}
              </span>
              <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-400">
                {tool.license}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-50">
              {isZh
                ? `${tool.name}：真实 Token 消耗倍率实测与 BYOK 降本配置指南`
                : seoH1}
            </h1>

            <p className="text-sm text-zinc-300 leading-relaxed">
              {isZh ? tool.taglineZh : tool.tagline}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 font-mono text-xs">
              <div className="flex items-center gap-2 min-w-0 overflow-x-auto scrollbar-none">
                <Terminal className="h-4 w-4 text-indigo-400 shrink-0" />
                <code className="text-zinc-200 whitespace-nowrap">{tool.installCommand}</code>
              </div>
              <button
                type="button"
                onClick={handleCopyInstall}
                aria-label="Copy install command"
                className="min-h-[40px] min-w-[40px] shrink-0 inline-flex items-center justify-center rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors"
              >
                {copiedInstall ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={tool.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
              >
                <span>{isZh ? '官方文档' : 'Official Docs'}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <Link
                href={`/calculator/${primaryModelId}/?reqs=500&in=25000&out=1500&cache=80`}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>{isZh ? '测算月度 API 账单' : 'Simulate Monthly Bill'}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Quick Spec 2x2 Grid */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
              {isZh ? '安装上手门槛' : 'Install Friction'}
            </span>
            <div className="mt-2">
              <div className="flex items-center gap-1 text-amber-400 text-sm">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i}>{i <= tool.installDifficulty ? '★' : '☆'}</span>
                ))}
              </div>
              <span className="text-xs font-mono text-zinc-300 mt-1 block">
                {tool.installDifficulty}/5 · {tool.installDifficulty === 1 ? 'Easy Setup' : 'CLI / IDE'}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
              {isZh ? '运行环境依赖' : 'Runtime Dependency'}
            </span>
            <div className="mt-2 space-y-1">
              <span className="text-xs font-mono font-semibold text-zinc-100 block">
                {tool.runtimeRequirements[0] || 'Cross-platform'}
              </span>
              <span className="text-[11px] text-zinc-500 block">
                {tool.runtimeRequirements[1] || 'Git >= 2.30'}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
              BYOK & BaseURL
            </span>
            <div className="mt-2">
              <span
                className={`text-sm font-bold block ${
                  tool.byokSupport.customBaseUrl ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {tool.byokSupport.customBaseUrl
                  ? isZh
                    ? '完整支持自定义网关'
                    : 'Full Support'
                  : isZh
                  ? '部分受限 / 官方为主'
                  : 'Limited'}
              </span>
              <span className="text-[11px] text-zinc-500 block mt-0.5">
                {tool.byokSupport.envVars.length > 0
                  ? `${tool.byokSupport.envVars.length} ${tool.byokSupport.envVars.length === 1 ? 'Env Var' : 'Env Vars'}`
                  : 'UI Settings'}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider text-indigo-300 font-semibold">
              {isZh ? '实测消耗倍率' : 'Typical Multiplier'}
            </span>
            <div className="mt-2">
              <span className="text-xl font-extrabold font-mono text-zinc-50 block">
                {tool.tokenMultiplierMin.toFixed(1)}x – {tool.tokenMultiplierMax.toFixed(1)}x
              </span>
              <span className="text-[11px] font-mono text-indigo-300 block mt-0.5">
                Typical {avgMultiplier.toFixed(1)}x vs Raw API
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Section B: Context & Cost Mechanics */}
      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 sm:p-6 backdrop-blur-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">
              {isZh ? 'Token 消耗结构与上下文压缩机制' : 'Context & Token Overhead Mechanics'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isZh ? tool.typicalTaskMultiplierNoteZh : tool.typicalTaskMultiplierNote}
            </p>
          </div>
          <span className="font-mono text-xs text-zinc-400 shrink-0">
            15-Turn Benchmark ≈ {barTotal.toLocaleString()} Input Tokens
          </span>
        </div>

        {/* Stacked Breakdown Bar */}
        <div className="space-y-3">
          <div className="h-3.5 w-full rounded-full overflow-hidden flex gap-0.5 bg-zinc-950 p-0.5 border border-zinc-800">
            {segments.map((seg) => (
              <div
                key={seg.label}
                className={`${seg.color} first:rounded-l-full last:rounded-r-full`}
                style={{ width: `${seg.pct}%` }}
                title={`${seg.label}: ${seg.tokens.toLocaleString()} tok (${seg.pct}%)`}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
            {segments.map((seg) => (
              <div key={seg.label} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${seg.color}`} />
                <span className="text-zinc-400">{seg.label}:</span>
                <span className="font-mono font-semibold text-zinc-200">
                  {seg.tokens.toLocaleString()} ({seg.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3 Mechanism Micro-Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
              <Cpu className="h-4 w-4" />
              <span>System Prompt Overhead</span>
            </div>
            <div className="text-lg font-bold font-mono text-zinc-100">
              ~{tool.baseSystemPromptTokens.toLocaleString()} tokens
            </div>
            <p className="text-xs text-zinc-400">
              {isZh ? '每轮携带的系统指令与工具声明底噪' : 'Baseline instructions & tool schema weight per turn'}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <Layers className="h-4 w-4" />
              <span>Context Compression</span>
            </div>
            <p className="text-xs font-medium text-zinc-200 leading-relaxed">
              {isZh ? tool.compactionStrategyZh : tool.compactionStrategy}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span className="inline-flex items-center gap-1.5">
                <Database className="h-4 w-4" />
                <span>Prompt Caching Hit Rate</span>
              </span>
              <span className="font-mono">{hitMin}%–{hitMax}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${hitAvg}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {isZh ? tool.promptCachingSupport.notesZh : tool.promptCachingSupport.notes}
            </p>
          </div>
        </div>
      </section>

      {/* Section C: Model Compatibility Matrix */}
      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 sm:p-6 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">
              {isZh ? '2026 主流模型兼容矩阵与单次任务预估账单' : 'Model Compatibility Matrix & 15-Turn Cost'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isZh
                ? `基于 30k 原始输入 + 4.5k 输出、${avgMultiplier.toFixed(1)}x 消耗倍率与 70% 缓存命中测算`
                : `Estimated on 30k raw input + 4.5k output scaled by ${avgMultiplier.toFixed(1)}x multiplier at 70% cache hit rate`}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase">
                <th className="py-3 px-3 sticky left-0 bg-zinc-900/95 backdrop-blur-sm z-10 min-w-[160px]">
                  Model
                </th>
                <th className="py-3 px-3">Tool Calling</th>
                <th className="py-3 px-3">Prompt Caching</th>
                <th className="py-3 px-3">Vision</th>
                <th className="py-3 px-3">Streaming</th>
                <th className="py-3 px-3 text-right">Est. 15-Turn Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {tool.compatibilityMatrix.map((row) => {
                const rec = tool.recommendedModels.find((r) => r.modelId === row.modelId);
                const fullModel = MODELS_DATA.find((m) => m.modelId === row.modelId);
                const pricingSource = fullModel || rec;
                const est = pricingSource
                  ? estimateHarnessTaskCost(pricingSource, avgMultiplier)
                  : null;

                return (
                  <tr key={row.modelId} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-3 sticky left-0 bg-zinc-900/95 backdrop-blur-sm z-10 min-w-[160px]">
                      <Link
                        href={`/models/${row.modelId}/`}
                        className="font-semibold text-zinc-100 hover:text-indigo-300 transition-colors block"
                      >
                        {fullModel?.modelName || rec?.modelName || row.modelId}
                      </Link>
                      <span className="text-[10px] font-mono text-zinc-500 block">
                        {rec?.role || row.notes}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${getStatusBadgeClass(
                          row.toolCalling
                        )}`}
                      >
                        {row.toolCalling}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${getStatusBadgeClass(
                          row.promptCaching
                        )}`}
                      >
                        {row.promptCaching}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          row.vision
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-zinc-800/70 text-zinc-500 border-zinc-700'
                        }`}
                      >
                        {row.vision ? 'Supported' : 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${getStatusBadgeClass(
                          row.streaming
                        )}`}
                      >
                        {row.streaming}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono">
                      {est ? (
                        <Link
                          href={`/calculator/${row.modelId}/`}
                          className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          ${est.totalCost.toFixed(3)}
                        </Link>
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section D: Production Config & BYOK Code Block */}
      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 sm:p-6 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">
              {tool.byokSupport.customBaseUrl
                ? isZh
                  ? '生产级 BYOK 与 DeepSeek / OpenRouter 降本配置'
                  : 'Production BYOK & DeepSeek / OpenRouter Config'
                : isZh
                  ? '官方 API Key 接入与订阅控费配置'
                  : 'Official API Key & Config Templates'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isZh ? tool.byokSupport.notesZh : tool.byokSupport.notes}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyConfig}
            className="min-h-[40px] self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-100 transition-colors"
          >
            {copiedConfig ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy {activeTemplate.filename}</span>
              </>
            )}
          </button>
        </div>

        {/* Segmented Control Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-zinc-950 border border-zinc-800 p-1 overflow-x-auto scrollbar-none">
          {templates.map((tpl, idx) => {
            const active = idx === activeTemplateIdx;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setActiveTemplateIdx(idx)}
                className={`shrink-0 min-h-[38px] px-3 py-1.5 rounded-lg text-xs transition-all ${
                  active
                    ? 'bg-zinc-800 text-zinc-50 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 font-medium'
                }`}
              >
                {isZh ? tpl.titleZh : tpl.title}
              </button>
            );
          })}
        </div>

        <pre className="p-4 rounded-xl bg-zinc-950 font-mono text-xs text-zinc-200 overflow-x-auto leading-relaxed border border-zinc-800/80">
          <code>{activeTemplate.code}</code>
        </pre>

        {tool.byokSupport.envVars.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[11px] text-zinc-500">Supported Env Vars:</span>
            {tool.byokSupport.envVars.map((env) => (
              <span
                key={env}
                className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300"
              >
                {env}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Section E: Top 3 Pitfall FAQ Accordion */}
      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 sm:p-6 backdrop-blur-md space-y-4">
        <h2 className="text-lg font-bold text-zinc-100">
          {isZh ? `${tool.name} 高频踩坑与省钱调优 FAQ` : `${tool.name} Cost Pitfalls & Tuning FAQ`}
        </h2>

        <div className="divide-y divide-zinc-800/70 rounded-xl border border-zinc-800 bg-zinc-950/50 overflow-hidden">
          {tool.topFaqs.map((faq, idx) => {
            const isOpen = openFaqId === faq.id;
            const sev = getSeverityBadge(faq.severity);
            const SevIcon = sev.icon;

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
                    <span
                      className={`hidden sm:inline-flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${sev.className}`}
                    >
                      <SevIcon className="h-3 w-3" />
                      <span>{sev.label}</span>
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

      {/* Bottom Peer Harness Links */}
      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-200">
            {isZh ? '横向对比其他 Coding Agent 倍率' : 'Compare Other Coding Harnesses'}
          </h3>
          <Link
            href="/harness/"
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
          >
            <span>
              {isZh ? `全部 ${HARNESS_TOOLS.length} 款评测` : `All ${HARNESS_TOOLS.length} Benchmarks`}
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {peerHarnesses.map((peer) => (
            <Link
              key={peer.slug}
              href={`/harness/${peer.slug}/`}
              className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 hover:border-indigo-500/50 transition-colors flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-zinc-100 block">{peer.name}</span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {peer.tokenMultiplierMin.toFixed(1)}x – {peer.tokenMultiplierMax.toFixed(1)}x
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-500" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
