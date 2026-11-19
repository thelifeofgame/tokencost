'use client';

import React, { useState, useMemo } from 'react';
import { Code2, Copy, Check, FileText, Sun, Moon, ExternalLink } from 'lucide-react';
import { MODELS_DATA } from '@/lib/models-data';
import { useI18n } from '@/i18n/I18nProvider';
import { trackEvent } from '@/lib/analytics';
import {
  BadgeTheme,
  BadgeMetricMode,
  getBadgePublicUrl,
  getBadgeFileName,
  getBadgeTargetUrl,
  getBadgeAltText,
  renderBadgeSvg,
} from '@/lib/badge-generator';

const QUICK_MODEL_PRESETS = [
  { id: 'gemini-4-neon', label: 'Gemini 4 Neon' },
  { id: 'deepseek-v4.1-flash', label: 'DeepSeek-V4.1-Flash' },
  { id: 'gpt-6.2-sol', label: 'GPT-6.2 Sol' },
  { id: 'claude-sonnet-5.5', label: 'Claude Sonnet 5.5' },
];

export default function BadgeGenerator() {
  const { locale } = useI18n();
  const isZh = locale === 'zh-CN' || locale === 'zh-TW';

  const [selectedModelId, setSelectedModelId] = useState<string>('gemini-4-neon');
  const [isHarnessPreset, setIsHarnessPreset] = useState<boolean>(false);
  const [metric, setMetric] = useState<BadgeMetricMode>('input');
  const [theme, setTheme] = useState<BadgeTheme>('dark');
  const [stageBackdrop, setStageBackdrop] = useState<'github-dark' | 'github-light'>('github-dark');
  const [snippetTab, setSnippetTab] = useState<'markdown' | 'html' | 'url'>('markdown');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const selectedModel = useMemo(() => {
    return (
      MODELS_DATA.find((m) => m.modelId === selectedModelId) ||
      MODELS_DATA.find((m) => m.modelId === 'gemini-4-neon') ||
      MODELS_DATA[0]
    );
  }, [selectedModelId]);

  const badgeInput = useMemo(
    () => ({
      modelId: selectedModel.modelId,
      modelName: selectedModel.modelName,
      inputPerM: selectedModel.inputPerM,
      outputPerM: selectedModel.outputPerM,
      cachedInputPerM: selectedModel.cachedInputPerM,
      cacheDiscountPercent: selectedModel.cacheDiscountPercent,
    }),
    [selectedModel]
  );

  const svgMarkup = useMemo(
    () => renderBadgeSvg(badgeInput, theme, metric, isHarnessPreset),
    [badgeInput, theme, metric, isHarnessPreset]
  );

  const publicSvgUrl = getBadgePublicUrl(theme, selectedModel.modelId, metric, isHarnessPreset);
  const targetUrl = getBadgeTargetUrl(selectedModel.modelId, isHarnessPreset);
  const altText = getBadgeAltText(badgeInput, isHarnessPreset);
  const staticFilename = isHarnessPreset
    ? `public/badges/${theme}/harness-benchmark.svg`
    : `public/badges/${theme}/${getBadgeFileName(selectedModel.modelId, metric)}`;

  const markdownSnippet = `<!-- TokenCosts AI Live LLM Cost Badge -->\n[![${altText}](${publicSvgUrl})](${targetUrl})`;

  const htmlSnippet = `<a href="${targetUrl}" target="_blank" rel="noopener noreferrer">\n  <img src="${publicSvgUrl}" alt="${altText}" height="${theme === 'indigo' ? '26' : '22'}" />\n</a>`;

  const displayedSnippet =
    snippetTab === 'markdown'
      ? markdownSnippet
      : snippetTab === 'html'
        ? htmlSnippet
        : publicSvgUrl;

  const handleCopySnippet = (format: 'markdown' | 'html' | 'url') => {
    const text =
      format === 'markdown'
        ? markdownSnippet
        : format === 'html'
          ? htmlSnippet
          : publicSvgUrl;

    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);

    const presetSlug = isHarnessPreset
      ? 'harness_benchmark'
      : ['gemini-4-neon', 'deepseek-v4.1-flash'].includes(selectedModel.modelId)
        ? selectedModel.modelId
        : 'custom';

    trackEvent('badge_copy', {
      badge_preset: presetSlug,
      badge_format: format,
      model_id: selectedModel.modelId,
      badge_theme: theme,
      badge_metric: metric,
      target_url: targetUrl,
      locale,
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/60 p-4 sm:p-6 backdrop-blur-md shadow-sm dark:shadow-xl space-y-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-400/25 dark:via-zinc-400/20 to-transparent" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Code2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              GitHub README Cost Badge Generator
            </h2>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
              Static SVG · 0ms
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
            {isZh
              ? '让用户在 Clone 仓库前一眼看清真实 API 成本。将轻量化 TokenCosts AI 徽章贴入 README.md，一键核算最新模型单价、95% Prompt Caching 折扣与 Coding Agent 真实消耗倍率——零运行时依赖。'
              : "Let users estimate your AI app's real API bill before cloning. Drop a lightweight TokenCosts AI badge into your README.md so contributors can inspect live token rates, 95% Prompt Caching discounts, and Coding Agent multipliers in one click."}
          </p>
        </div>
      </div>

      {/* Bento 12-Col Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Target Model Selector */}
          <div className="space-y-2">
            <label
              htmlFor="badge-model-select"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            >
              1. Target Model or Benchmark
            </label>
            <select
              id="badge-model-select"
              value={isHarnessPreset ? '__harness__' : selectedModelId}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__harness__') {
                  setIsHarnessPreset(true);
                } else {
                  setIsHarnessPreset(false);
                  setSelectedModelId(val);
                }
              }}
              className="w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/70 px-3.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
              <option value="__harness__">Coding Agent Harness Benchmark (1.2x–3.5x)</option>
              {MODELS_DATA.map((m) => (
                <option key={m.modelId} value={m.modelId}>
                  {m.modelName} (${m.inputPerM}/1M in · ${m.outputPerM}/1M out)
                </option>
              ))}
            </select>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_MODEL_PRESETS.map((preset) => {
                const active = !isHarnessPreset && selectedModelId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setIsHarnessPreset(false);
                      setSelectedModelId(preset.id);
                    }}
                    className={`min-h-[32px] px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      active
                        ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.18)]'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setIsHarnessPreset(true)}
                className={`min-h-[32px] px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  isHarnessPreset
                    ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.18)]'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Agent Benchmark
              </button>
            </div>
          </div>

          {/* 2. Metric Display Mode */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              2. Metric Display Mode
            </span>
            <div className="grid grid-cols-3 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800/80">
              {(
                [
                  { id: 'input', label: 'Input / 1M' },
                  { id: 'inout', label: 'In · Out' },
                  { id: 'cache', label: 'Cache Save %' },
                ] as const
              ).map((item) => {
                const active = metric === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isHarnessPreset}
                    onClick={() => setMetric(item.id)}
                    className={`min-h-[36px] rounded-lg transition-all ${
                      isHarnessPreset ? 'opacity-50 cursor-not-allowed' : ''
                    } ${
                      active
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm text-xs font-semibold'
                        : 'text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Badge Visual Theme */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              3. Badge Visual Theme
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {(
                [
                  {
                    id: 'dark',
                    label: 'Dark',
                    leftClass: 'bg-zinc-950',
                    rightClass: 'bg-zinc-800',
                  },
                  {
                    id: 'light',
                    label: 'Light',
                    leftClass: 'bg-zinc-200',
                    rightClass: 'bg-white border border-zinc-200',
                  },
                  {
                    id: 'indigo',
                    label: 'Indigo',
                    leftClass: 'bg-zinc-900',
                    rightClass: 'bg-indigo-600',
                  },
                ] as const
              ).map((item) => {
                const active = theme === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTheme(item.id)}
                    className={`min-h-[56px] p-2.5 rounded-xl border text-left transition-all active:scale-[0.98] ${
                      active
                        ? 'border-indigo-500/80 bg-indigo-50/70 dark:bg-indigo-500/10 ring-1 ring-indigo-500/30'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="h-2.5 w-10 rounded-sm overflow-hidden flex mb-2">
                      <span className={`flex-1 ${item.leftClass}`} />
                      <span className={`flex-1 ${item.rightClass}`} />
                    </div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Preview & Export (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Simulated GitHub README Stage */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {/* GitHub Toolbar */}
            <div className="h-9 px-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-950">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                <FileText className="h-3.5 w-3.5" />
                <span>README.md</span>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-zinc-200/70 dark:bg-zinc-900 p-0.5 text-[10px] font-medium">
                <button
                  type="button"
                  onClick={() => setStageBackdrop('github-dark')}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                    stageBackdrop === 'github-dark'
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Moon className="h-3 w-3" />
                  <span>GitHub Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStageBackdrop('github-light')}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                    stageBackdrop === 'github-light'
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Sun className="h-3 w-3" />
                  <span>GitHub Light</span>
                </button>
              </div>
            </div>

            {/* Preview Canvas */}
            <div
              className={`min-h-[112px] px-4 py-6 flex flex-col items-center justify-center gap-3 transition-colors duration-200 ${
                stageBackdrop === 'github-dark'
                  ? 'bg-[#0d1117]'
                  : 'bg-[#ffffff]'
              }`}
            >
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center max-w-full hover:scale-[1.02] transition-transform"
                title={altText}
              >
                <span
                  className="inline-flex max-w-full [&>svg]:max-w-full [&>svg]:h-auto"
                  dangerouslySetInnerHTML={{ __html: svgMarkup }}
                />
              </a>
              <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                <span>{staticFilename}</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </div>
            </div>
          </div>

          {/* Export Snippet Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800/80">
                {(
                  [
                    { id: 'markdown', label: 'Markdown' },
                    { id: 'html', label: 'HTML' },
                    { id: 'url', label: 'Direct SVG URL' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSnippetTab(tab.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      snippetTab === tab.id
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <pre className="p-3.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-950 font-mono text-xs text-zinc-800 dark:text-zinc-200 overflow-x-auto leading-relaxed border border-zinc-200 dark:border-zinc-800/80 select-all">
              <code>{displayedSnippet}</code>
            </pre>
          </div>

          {/* Dual Copy Action Row */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={() => handleCopySnippet('markdown')}
              className={`min-h-[44px] flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] ${
                copiedFormat === 'markdown'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                  : 'text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-500/20'
              }`}
            >
              {copiedFormat === 'markdown' ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copied Markdown!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleCopySnippet('html')}
              className={`min-h-[44px] sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-[0.98] ${
                copiedFormat === 'html'
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700'
              }`}
            >
              {copiedFormat === 'html' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Copied HTML!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy HTML</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
