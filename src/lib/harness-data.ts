import harnessRaw from '@/data/harness_tools.json';
import { ModelPricingRule } from '@/types/pricing';
import { MODELS_DATA } from './models-data';
import { Locale } from '@/i18n/types';

export type HarnessCategoryId = 'cli-agent' | 'ai-ide' | 'ide-extension';

export interface HarnessCategory {
  id: HarnessCategoryId;
  name: string;
  nameZh: string;
}

export interface HarnessRecommendedModel {
  modelId: string;
  modelName: string;
  providerOrg: string;
  inputPerM: number;
  outputPerM: number;
  cachedInputPerM: number;
  cacheDiscountPercent: number;
  contextWindow: number;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
  role: string;
  toolCalling: string;
  promptCaching: string;
  vision: boolean;
  streaming: string;
  reason: string;
  reasonZh: string;
}

export interface HarnessCompatibilityRow {
  modelId: string;
  toolCalling: string;
  promptCaching: string;
  vision: boolean;
  streaming: string;
  notes: string;
}

export interface HarnessConfigTemplate {
  id: string;
  title: string;
  titleZh: string;
  provider: string;
  language: string;
  filename: string;
  code: string;
}

export interface HarnessFaq {
  id: string;
  severity: 'critical' | 'warning' | 'tip';
  question: string;
  questionZh: string;
  answer: string;
  answerZh: string;
}

export interface HarnessTool {
  slug: string;
  name: string;
  category: HarnessCategoryId;
  categoryLabel: string;
  categoryLabelZh: string;
  isOpenSource: boolean;
  license: string;
  officialUrl: string;
  tagline: string;
  taglineZh: string;
  githubRepo: string | null;
  githubStars: number | null;
  latestVersion: string;
  verifiedDate: string;
  installDifficulty: number;
  runtimeRequirements: string[];
  dependencies: string[];
  installCommand: string;
  byokSupport: {
    supported: boolean;
    customBaseUrl: boolean;
    customModel: boolean;
    envVars: string[];
    notes: string;
    notesZh: string;
  };
  tokenMultiplierMin: number;
  tokenMultiplierMax: number;
  tokenMultiplierRange: {
    min: number;
    max: number;
    typical: number;
  };
  baseSystemPromptTokens: number;
  basePromptOverheadTokens: number;
  compactionStrategy: string;
  compactionStrategyZh: string;
  promptCachingEfficiency: string;
  promptCachingSupport: {
    supported: boolean;
    efficiency: string;
    hitRateRangePercent: [number, number];
    notes: string;
    notesZh: string;
  };
  typicalTaskMultiplierNote: string;
  typicalTaskMultiplierNoteZh: string;
  recommendedModels: HarnessRecommendedModel[];
  compatibilityMatrix: HarnessCompatibilityRow[];
  configTemplate: {
    language: string;
    filename: string;
    code: string;
  };
  configTemplates: HarnessConfigTemplate[];
  topFaqs: HarnessFaq[];
}

export interface HarnessBenchmarkAssumptions {
  referenceTask?: string;
  referenceTaskZh?: string;
  baseTaskDescription?: string;
  baseTaskInputTokens: number;
  baseTaskOutputTokens: number;
  defaultCacheHitRate: number;
}

const typedRaw = harnessRaw as unknown as {
  verifiedDate: string;
  totalTools: number;
  benchmarkAssumptions: HarnessBenchmarkAssumptions;
  categories: HarnessCategory[];
  tools: HarnessTool[];
};

export const HARNESS_VERIFIED_DATE: string = typedRaw.verifiedDate || '2026-11-24';
export const HARNESS_ASSUMPTIONS: HarnessBenchmarkAssumptions = typedRaw.benchmarkAssumptions || {
  baseTaskInputTokens: 30000,
  baseTaskOutputTokens: 4500,
  defaultCacheHitRate: 0.7,
};
export const HARNESS_CATEGORIES: HarnessCategory[] = typedRaw.categories || [];
export const HARNESS_TOOLS: HarnessTool[] = typedRaw.tools || [];

export function getAllHarnessSlugs(): string[] {
  return HARNESS_TOOLS.map((t) => t.slug);
}

export function getHarnessBySlug(slug: string): HarnessTool | undefined {
  if (!slug) return undefined;
  return HARNESS_TOOLS.find((t) => t.slug.toLowerCase() === slug.toLowerCase());
}

export function getHarnessAverageMultiplier(tool: HarnessTool): number {
  if (tool.tokenMultiplierRange?.typical) {
    return tool.tokenMultiplierRange.typical;
  }
  return Number(((tool.tokenMultiplierMin + tool.tokenMultiplierMax) / 2).toFixed(2));
}

export function getHarnessSeoMeta(slug: string): {
  title: string;
  description: string;
  h1: string;
} {
  const map: Record<string, { title: string; description: string; h1: string }> = {
    'claude-code': {
      title: 'Claude Code Token Cost, Real Multiplier & BYOK Config | TokenCosts AI',
      description:
        "Measure Claude Code's 1.8x–2.5x real token multiplier, native Prompt Caching savings, and BYOK cost optimization with Claude Sonnet 5.5 and custom routing.",
      h1: 'Claude Code: Real Token Multiplier & BYOK Cost Guide',
    },
    cursor: {
      title: 'Cursor Token Multiplier, Hidden Context Tax & BYOK Optimization | TokenCosts AI',
      description:
        'Why Cursor burns 2.2x–3.5x tokens per task. Audit Composer shadow workspace overhead and cut bills via BYOK cost optimization with Gemini 4 Neon & GPT-6.2 Sol.',
      h1: 'Cursor IDE: Real Token Multiplier & BYOK Cost Optimization',
    },
    windsurf: {
      title: 'Windsurf Cascade Token Cost, Multiplier & BYOK Setup | TokenCosts AI',
      description:
        "Analyze Windsurf Cascade's 1.9x–2.8x real token multiplier vs Cursor. Optimize enterprise coding costs with BYOK custom models and Prompt Caching.",
      h1: 'Windsurf: Cascade Token Multiplier & BYOK Cost Analysis',
    },
    aider: {
      title: 'Aider Real Token Multiplier (1.2x–1.8x) & DeepSeek BYOK Guide | TokenCosts AI',
      description:
        "Discover why Aider's AST Repo-Map achieves the lowest 1.2x–1.8x real token multiplier. Copy production BYOK configs for DeepSeek-V4.1-Flash & Gemini 4 Neon.",
      h1: 'Aider CLI: Lowest Token Multiplier & BYOK Cost Optimization',
    },
    cline: {
      title: 'Cline Token Cost Breakdown, Real Multiplier & DeepSeek BYOK Config | TokenCosts AI',
      description:
        "Inspect Cline's 2.0x–3.0x real token multiplier and ~3k system prompt overhead. Cut autonomous coding bills by 80% using BYOK cost optimization & DeepSeek-V4.1-Flash.",
      h1: 'Cline: Transparent Token Multiplier & BYOK Setup Guide',
    },
    'roo-code': {
      title: 'Roo Code Multi-Mode Token Multiplier & BYOK Cost Optimization | TokenCosts AI',
      description:
        "Compare Roo Code's 1.7x–2.6x real token multiplier across Architect, Code & Ask modes. Optimize BYOK routing with Gemini 4 Neon, DeepSeek-V4.1-Flash & Claude Sonnet 5.5.",
      h1: 'Roo Code: Role-Based Token Multiplier & BYOK Cost Guide',
    },
    'opencode-continue': {
      title: 'OpenCode & Continue BYOK Cost Optimization & Token Multiplier | TokenCosts AI',
      description:
        "Audit OpenCode and Continue's 1.5x–2.3x real token multiplier across VS Code & JetBrains. Copy LiteLLM & OpenRouter BYOK configs for zero-lock-in cost control.",
      h1: 'OpenCode / Continue: Open BYOK Cost Optimization & Token Audit',
    },
    'codex-cli': {
      title: 'OpenAI Codex CLI Token Cost, Multiplier & BYOK Config | TokenCosts AI',
      description:
        "Audit OpenAI Codex CLI's 1.6x–2.4x real token multiplier, MCP schema overhead (~6.9k base), and Responses API BYOK routing via ~/.codex/config.toml.",
      h1: 'OpenAI Codex CLI: Real Token Multiplier & BYOK Cost Guide',
    },
    'deepseek-harness': {
      title: 'DeepSeek Harness (dsh) Token Cost, Multiplier & Cache Guide | TokenCosts AI',
      description:
        "Measure DeepSeek Harness (dsh)'s 2.4x–3.8x token multiplier across 24 built-in tools and slash bills via DeepSeek V4.1-Flash 90%–99% Prompt Caching.",
      h1: 'DeepSeek Harness (dsh): Token Multiplier & Cache Cost Guide',
    },
    zcode: {
      title: 'ZCode IDE Token Multiplier & Multi-Protocol BYOK Config | TokenCosts AI',
      description:
        "Analyze ZCode IDE's 2.0x–3.1x real token multiplier and configure lock-in-free triple-protocol BYOK routing via ~/.zcode/v2/provider_config.json.",
      h1: 'ZCode IDE: Real Token Multiplier & Multi-Protocol BYOK Guide',
    },
    'muse-code': {
      title: 'Muse Code CLI Token Multiplier, Subagent Cost & Limits | TokenCosts AI',
      description:
        "Audit Meta Muse Code CLI's 2.1x–3.3x real token multiplier, git-worktree subagent overhead, and Meta Muse Spark/Wonder API & subscription limits.",
      h1: 'Muse Code CLI: Real Token Multiplier & Meta API Cost Guide',
    },
    antigravity: {
      title: 'Google Antigravity IDE Token Multiplier & agy CLI BYOK | TokenCosts AI',
      description:
        "Measure Google Antigravity IDE's 2.0x–3.2x token multiplier, Artifact & Subagent overhead, and partial BYOK setup with GEMINI_API_KEY in agy CLI.",
      h1: 'Google Antigravity IDE: Token Multiplier & agy CLI Cost Guide',
    },
  };

  if (map[slug]) return map[slug];
  const tool = getHarnessBySlug(slug);
  const name = tool?.name || slug;
  return {
    title: `${name} Token Multiplier & BYOK Config (2026) | TokenCosts AI`,
    description:
      tool?.tagline ||
      `Audit ${name} real token multiplier, system prompt overhead, and BYOK cost optimization setups.`,
    h1: `${name}: Real Token Multiplier & BYOK Cost Guide`,
  };
}

const HARNESS_TOP_MODELS: Record<string, string> = {
  'claude-code': 'Claude Sonnet 5.5 / Gemini 4 Neon',
  cursor: 'Gemini 4 Neon / GPT-6.2 Sol',
  windsurf: 'GPT-6.2 Sol / Claude Sonnet 5.5',
  aider: 'DeepSeek-V4.1-Flash / Gemini 4 Neon',
  cline: 'DeepSeek-V4.1-Flash / Gemini 4 Neon',
  'roo-code': 'Gemini 4 Neon / DeepSeek-V4.1-Flash',
  'opencode-continue': 'DeepSeek-V4.1-Flash / GPT-6.2 Sol',
  'codex-cli': 'GPT-5.3-Codex / GPT-6.2 Sol',
  'deepseek-harness': 'DeepSeek-V4.1-Flash / DeepSeek V4 Pro',
  zcode: 'GLM-5.3 / GLM-5.3-Flash',
  'muse-code': 'Muse Spark 1.3 / Muse Wonder',
  antigravity: 'Gemini 4 Neon / Gemini 4 Carbon',
};

export function getLocalizedHarnessSeoMeta(
  slug: string,
  locale: Locale = 'en'
): {
  title: string;
  description: string;
  h1: string;
} {
  if (locale === 'en') {
    return getHarnessSeoMeta(slug);
  }

  const tool = getHarnessBySlug(slug);
  const name = tool?.name || slug;
  const min = `${(tool?.tokenMultiplierMin ?? 1.5).toFixed(1)}x`;
  const max = `${(tool?.tokenMultiplierMax ?? 2.5).toFixed(1)}x`;
  const overhead = (
    tool?.baseSystemPromptTokens ??
    tool?.basePromptOverheadTokens ??
    2000
  ).toLocaleString('en-US');
  const topModels =
    HARNESS_TOP_MODELS[slug] ||
    tool?.recommendedModels
      ?.slice(0, 2)
      .map((m) => m.modelName.split(': ').pop() || m.modelId)
      .join(' / ') ||
    'DeepSeek-V4.1-Flash / Gemini 4 Neon';

  switch (locale) {
    case 'zh-CN':
      return {
        title: `${name} Token 消耗倍率 (${min}-${max}) 与 BYOK 省钱配置 (2026) | TokenCosts AI`,
        description: `实测 ${name} 真实 Token 消耗倍率（${min}-${max}，系统提示词底噪约 ${overhead} tokens）。一键复制 ${topModels} BYOK 降本路由与 Prompt Caching 配置，最高省费 80%。`,
        h1: `${name}：真实 Token 倍率实测与 BYOK 降本配置指南`,
      };
    case 'zh-TW':
      return {
        title: `${name} Token 消耗倍率 (${min}-${max}) 與 BYOK 省錢配置 (2026) | TokenCosts AI`,
        description: `實測 ${name} 真實 Token 消耗倍率（${min}-${max}，系統提示詞底噪約 ${overhead} tokens）。一鍵複製 ${topModels} BYOK 降本路由與快取設定，最高省費 80%。`,
        h1: `${name}：真實 Token 倍率實測與 BYOK 降本設定指南`,
      };
    case 'ja':
      return {
        title: `${name} トークン消費倍率 (${min}-${max})・BYOK 最安設定 (2026) | TokenCosts AI`,
        description: `${name} の実測トークン倍率（${min}-${max}、システムプロンプト負荷約 ${overhead} tokens）を検証。${topModels} 向け BYOK コスト最適化設定とキャッシュ活用術を公開。`,
        h1: `${name}：実測トークン倍率＆BYOK コスト最適化ガイド`,
      };
    case 'ko':
      return {
        title: `${name} 토큰 배수 (${min}-${max}) 및 BYOK 비용 최적화 (2026) | TokenCosts AI`,
        description: `${name}의 실제 토큰 배수(${min}-${max}, 시스템 프롬프트 오버헤드 약 ${overhead} tokens)를 분석합니다. ${topModels} 기반 BYOK 라우팅 및 프롬프트 캐싱 절감 가이드를 복사하세요.`,
        h1: `${name}: 실제 토큰 배수 측정 및 BYOK 비용 절감 가이드`,
      };
    case 'es':
      return {
        title: `Costo de Tokens en ${name} (${min}-${max}) y Guía BYOK (2026) | TokenCosts AI`,
        description: `Audita el multiplicador real de tokens de ${name} (${min}-${max}, ~${overhead} tokens de sistema) y reduce tu factura con configuración BYOK para ${topModels} y Prompt Caching.`,
        h1: `${name}: Multiplicador Real de Tokens y Optimización BYOK`,
      };
    default:
      return getHarnessSeoMeta(slug);
  }
}

/**
 * Estimates single multi-turn coding task cost for a model under a given harness multiplier.
 * Uses canonical benchmark baseline: 30,000 input tokens, 4,500 output tokens, 70% cache hit rate.
 */
export function estimateHarnessTaskCost(
  model: Pick<ModelPricingRule, 'inputPerM' | 'outputPerM' | 'cachedInputPerM' | 'cacheDiscountPercent'>,
  multiplier: number,
  baseInputTokens = HARNESS_ASSUMPTIONS.baseTaskInputTokens,
  baseOutputTokens = HARNESS_ASSUMPTIONS.baseTaskOutputTokens,
  cacheHitRate = HARNESS_ASSUMPTIONS.defaultCacheHitRate
): { effectiveInputTokens: number; effectiveOutputTokens: number; totalTokens: number; totalCost: number } {
  const effectiveInputTokens = Math.round(baseInputTokens * multiplier);
  // Output multiplier scales conservatively vs input loops
  const outputMultiplier = multiplier <= 1 ? 1 : 1 + (multiplier - 1) * 0.4;
  const effectiveOutputTokens = Math.round(baseOutputTokens * outputMultiplier);

  const effectiveCacheRate =
    model.cacheDiscountPercent > 0 ? model.cachedInputPerM : model.inputPerM;

  const missTokens = effectiveInputTokens * (1 - cacheHitRate);
  const hitTokens = effectiveInputTokens * cacheHitRate;

  const inputCost =
    (missTokens / 1_000_000) * model.inputPerM +
    (hitTokens / 1_000_000) * effectiveCacheRate;
  const outputCost = (effectiveOutputTokens / 1_000_000) * model.outputPerM;

  return {
    effectiveInputTokens,
    effectiveOutputTokens,
    totalTokens: effectiveInputTokens + effectiveOutputTokens,
    totalCost: inputCost + outputCost,
  };
}

/**
 * Finds the top 3 harnesses recommended for a given modelId (used in /models/[id]).
 */
export function getRecommendedHarnessesForModel(modelId: string): {
  tool: HarnessTool;
  matchType: 'Native' | 'BaseURL';
  compatLabel: string;
}[] {
  const targetModel = MODELS_DATA.find((m) => m.modelId === modelId);
  const provider = targetModel?.providerOrg || '';

  const scored = HARNESS_TOOLS.map((tool) => {
    const directRecIdx = tool.recommendedModels.findIndex((r) => r.modelId === modelId);
    const inCompat = tool.compatibilityMatrix.find((c) => c.modelId === modelId);

    let score = 0;
    if (directRecIdx === 0) score += 100;
    else if (directRecIdx > 0) score += 80 - directRecIdx * 5;
    if (inCompat) score += 40;
    if (tool.byokSupport.customBaseUrl) score += 20;
    if (provider === 'Anthropic' && tool.slug === 'claude-code') score += 30;
    if (provider === 'DeepSeek' && (tool.slug === 'aider' || tool.slug === 'cline' || tool.slug === 'roo-code' || tool.slug === 'deepseek-harness')) score += 25;
    if (provider === 'OpenAI' && tool.slug === 'codex-cli') score += 25;
    if (provider === 'Z.ai' && tool.slug === 'zcode') score += 25;
    if (provider === 'Google' && tool.slug === 'antigravity') score += 20;
    // Slight preference for lower token multiplier ties
    score -= tool.tokenMultiplierMin * 3;

    const matchType: 'Native' | 'BaseURL' =
      directRecIdx !== -1 || inCompat?.toolCalling === 'Native' ? 'Native' : 'BaseURL';

    const compatLabel =
      inCompat?.promptCaching ||
      tool.promptCachingSupport.efficiency ||
      (tool.byokSupport.customBaseUrl ? 'BYOK Ready' : 'Supported');

    return { tool, score, matchType, compatLabel };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ tool, matchType, compatLabel }) => ({ tool, matchType, compatLabel }));
}
