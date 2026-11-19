import {
  ModelPricingRule,
  ScenarioPreset,
  ModelBenchmarks,
  HostedProvider,
  LatencyTier,
  ProviderOrg,
} from '@/types/pricing';
import { calculateModelCost } from './calculator-engine';
import rawData from '@/data/model_pricing_schema.json';
import trendingComparisonsData from '@/data/trending_comparisons.json';

const KNOWN_BENCHMARKS: Record<string, ModelBenchmarks> = {
  'gemini-4-neon': { evalScore: 96.4, mmlu: 94.8, arenaElo: 1410, avgLatencyTtftMs: 250, avgThroughputTokS: 145 },
  'gpt-6.2-sol': { evalScore: 96.8, mmlu: 95.1, arenaElo: 1415, avgLatencyTtftMs: 360, avgThroughputTokS: 85 },
  'gpt-6.2-astra': { evalScore: 98.5, mmlu: 97.2, arenaElo: 1455, avgLatencyTtftMs: 450, avgThroughputTokS: 85 },
  'gpt-6.1-sol': { evalScore: 96.2, mmlu: 94.5, arenaElo: 1395, avgLatencyTtftMs: 380, avgThroughputTokS: 110 },
  'gpt-6.1-sol-pro': { evalScore: 97.4, mmlu: 95.8, arenaElo: 1420, avgLatencyTtftMs: 820, avgThroughputTokS: 65 },
  'gpt-6.1-terra': { evalScore: 90.5, mmlu: 87.8, arenaElo: 1290, avgLatencyTtftMs: 210, avgThroughputTokS: 150 },
  'gpt-6.1-terra-pro': { evalScore: 92.8, mmlu: 90.1, arenaElo: 1325, avgLatencyTtftMs: 480, avgThroughputTokS: 85 },
  'gpt-4o': { evalScore: 88.7, mmlu: 88.7, arenaElo: 1286, avgLatencyTtftMs: 420, avgThroughputTokS: 90 },
  'gpt-4o-mini': { evalScore: 82.0, mmlu: 82.0, arenaElo: 1215, avgLatencyTtftMs: 250, avgThroughputTokS: 140 },
  'o1': { evalScore: 94.8, mmlu: 91.8, arenaElo: 1350, avgLatencyTtftMs: 1800, avgThroughputTokS: 45 },
  'o3-mini': { evalScore: 92.5, mmlu: 89.0, arenaElo: 1310, avgLatencyTtftMs: 950, avgThroughputTokS: 75 },
  'claude-3-5-sonnet': { evalScore: 93.7, mmlu: 88.3, arenaElo: 1283, avgLatencyTtftMs: 450, avgThroughputTokS: 78 },
  'claude-3-5-haiku': { evalScore: 81.5, mmlu: 75.2, arenaElo: 1205, avgLatencyTtftMs: 190, avgThroughputTokS: 150 },
  'claude-sonnet-5.5': { evalScore: 97.8, mmlu: 96.1, arenaElo: 1435, avgLatencyTtftMs: 360, avgThroughputTokS: 120 },
  'claude-opus-5.5': { evalScore: 98.9, mmlu: 97.5, arenaElo: 1460, avgLatencyTtftMs: 650, avgThroughputTokS: 70 },
  'deepseek-v3': { evalScore: 88.5, mmlu: 88.5, arenaElo: 1270, avgLatencyTtftMs: 350, avgThroughputTokS: 85 },
  'deepseek-r1': { evalScore: 96.8, mmlu: 90.8, arenaElo: 1362, avgLatencyTtftMs: 1200, avgThroughputTokS: 55 },
  'deepseek-v4.1-flash': { evalScore: 91.2, mmlu: 89.0, arenaElo: 1305, avgLatencyTtftMs: 180, avgThroughputTokS: 180 },
  'deepseek-v4-pro': { evalScore: 95.0, mmlu: 92.4, arenaElo: 1345, avgLatencyTtftMs: 400, avgThroughputTokS: 90 },
  'llama-3.3-70b': { evalScore: 86.4, mmlu: 86.4, arenaElo: 1250, avgLatencyTtftMs: 160, avgThroughputTokS: 280 },
  'gemini-1.5-pro': { evalScore: 85.9, mmlu: 85.9, arenaElo: 1260, avgLatencyTtftMs: 490, avgThroughputTokS: 65 },
  'gemini-1.5-flash': { evalScore: 78.9, mmlu: 78.9, arenaElo: 1195, avgLatencyTtftMs: 220, avgThroughputTokS: 155 },
};

const FEATURED_PRIORITY_ORDER = [
  'gemini-4-neon',
  'gpt-6.2-sol',
  'claude-sonnet-5.5',
  'deepseek-v4.1-flash',
  'gpt-6.2-astra',
  'claude-opus-5.5',
  'gpt-6.1-sol',
  'gpt-6.1-terra',
  'deepseek-v3',
  'deepseek-r1',
  'gpt-4o',
  'claude-3-5-sonnet',
  'gpt-4o-mini',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'o3-mini',
  'llama-3.3-70b',
  'grok-4.5',
];

function isFrontierId(id: string): boolean {
  const lower = id.toLowerCase();
  return (
    lower.includes('6.2') ||
    lower.includes('6.1') ||
    lower.includes('gemini-4-neon') ||
    lower.includes('gemini-4') ||
    lower.includes('sonnet-5') ||
    lower.includes('opus-5') ||
    lower.includes('deepseek-v4') ||
    lower.includes('grok-4') ||
    lower.includes('llama-4') ||
    lower.includes('pareto-26')
  );
}

// Transform raw schema models into validated ModelPricingRule instances
function buildModelsData(): ModelPricingRule[] {
  const rawList = rawData.models;
  const mappedList: ModelPricingRule[] = rawList.map((raw) => {
    const isAnthropic = raw.providerOrg === 'Anthropic';
    const isGeminiPro = raw.modelId === 'gemini-1.5-pro';
    const isGeminiFlash = raw.modelId === 'gemini-1.5-flash';

    const benchmarks: ModelBenchmarks = KNOWN_BENCHMARKS[raw.modelId] || {
      evalScore: raw.capabilities.reasoning ? 90.0 : 80.0,
      mmlu: raw.capabilities.reasoning ? 88.0 : 78.0,
      avgLatencyTtftMs: raw.latencyTier === 'fast' || raw.latencyTier === 'ultra-low' ? 220 : 450,
      avgThroughputTokS: raw.latencyTier === 'fast' || raw.latencyTier === 'ultra-low' ? 140 : 75,
    };

    const isFrontier = isFrontierId(raw.modelId);
    const openRouterAffiliate = `https://openrouter.ai/${raw.modelId}?ref=tokencostsai_com&utm_source=tokencostsai_com&utm_medium=model_affiliate`;

    const hostedProviders: HostedProvider[] = [
      {
        name: `${raw.providerOrg} Direct`,
        inputPerM: raw.inputPerM,
        outputPerM: raw.outputPerM,
        cachedInputPerM: raw.cachedInputPerM,
        supportsCaching: raw.cacheDiscountPercent > 0,
        affiliateUrl: raw.officialDocUrl,
      },
      {
        name: 'OpenRouter',
        inputPerM: raw.inputPerM,
        outputPerM: raw.outputPerM,
        cachedInputPerM: raw.cachedInputPerM,
        supportsCaching: raw.cacheDiscountPercent > 0,
        affiliateUrl: openRouterAffiliate,
      },
    ];

    const rule: ModelPricingRule = {
      modelId: raw.modelId,
      modelName: raw.modelName,
      providerOrg: raw.providerOrg as ProviderOrg,
      inputPerM: raw.inputPerM,
      outputPerM: raw.outputPerM,
      cachedInputPerM: raw.cachedInputPerM,
      cacheWritePerM: isAnthropic ? +(raw.inputPerM * 1.25).toFixed(4) : undefined,
      cacheDiscountPercent: raw.cacheDiscountPercent,
      batchDiscountPercent: raw.batchDiscountPercent,
      contextWindow: raw.contextWindow,
      maxOutputTokens: raw.maxOutputTokens,
      latencyTier: raw.latencyTier as LatencyTier,
      capabilities: raw.capabilities,
      benchmarks,
      officialDocUrl: raw.officialDocUrl,
      affiliateUrl: openRouterAffiliate,
      isFrontier,
      notes: raw.notes,
      hostedProviders,
      tierThreshold: isGeminiPro || isGeminiFlash ? 128000 : undefined,
      tierInputPerM: isGeminiPro ? 2.50 : isGeminiFlash ? 0.15 : undefined,
      tierOutputPerM: isGeminiPro ? 10.00 : isGeminiFlash ? 0.60 : undefined,
    };

    return rule;
  });

  // Sort with featured priority models at the front
  const idMap = new Map<string, ModelPricingRule>();
  mappedList.forEach((m) => idMap.set(m.modelId, m));

  const sorted: ModelPricingRule[] = [];
  const added = new Set<string>();

  for (const pid of FEATURED_PRIORITY_ORDER) {
    const item = idMap.get(pid);
    if (item && !added.has(pid)) {
      sorted.push(item);
      added.add(pid);
    }
  }

  for (const m of mappedList) {
    if (!added.has(m.modelId)) {
      sorted.push(m);
      added.add(m.modelId);
    }
  }

  return sorted;
}

export const MODELS_DATA: ModelPricingRule[] = buildModelsData();

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'rag',
    title: 'Long-Doc RAG',
    subtitle: '12k input, 600 output, 70% cache hit',
    iconName: 'Database',
    params: {
      monthlyRequests: 100000,
      inputTokens: 12000,
      outputTokens: 600,
      cacheHitRate: 0.70,
      batchRate: 0.0,
      enableLongContext: false,
    },
  },
  {
    id: 'agent',
    title: 'Coding Agent',
    subtitle: '25k input, 1.5k output, 85% cache hit',
    iconName: 'Bot',
    params: {
      monthlyRequests: 50000,
      inputTokens: 25000,
      outputTokens: 1500,
      cacheHitRate: 0.85,
      batchRate: 0.15,
      enableLongContext: false,
    },
  },
  {
    id: 'support',
    title: 'Customer Support Bot',
    subtitle: '1.5k input, 300 output, 50% cache hit',
    iconName: 'Headphones',
    params: {
      monthlyRequests: 500000,
      inputTokens: 1500,
      outputTokens: 300,
      cacheHitRate: 0.50,
      batchRate: 0.0,
      enableLongContext: false,
    },
  },
  {
    id: 'batch',
    title: 'Batch Extraction',
    subtitle: '3k input, 200 output, 100% batch offload',
    iconName: 'Cpu',
    params: {
      monthlyRequests: 250000,
      inputTokens: 3000,
      outputTokens: 200,
      cacheHitRate: 0.20,
      batchRate: 1.0,
      enableLongContext: false,
    },
  },
];

export const POPULAR_COMPARE_PAIRS = [
  { a: 'gemini-4-neon', b: 'gpt-6.2-sol' },
  { a: 'claude-sonnet-5.5', b: 'gpt-6.2-astra' },
  { a: 'deepseek-v4.1-flash', b: 'gpt-6.2-sol' },
  { a: 'claude-sonnet-5.5', b: 'gemini-4-neon' },
  { a: 'gpt-6.1-sol', b: 'gpt-4o' },
  { a: 'gpt-4o', b: 'claude-3-5-sonnet' },
  { a: 'deepseek-v3', b: 'llama-3.3-70b' },
  { a: 'claude-3-5-haiku', b: 'gpt-4o-mini' },
  { a: 'deepseek-r1', b: 'o1' },
  { a: 'gemini-1.5-flash', b: 'gpt-4o-mini' },
  { a: 'gemini-1.5-pro', b: 'claude-3-5-sonnet' },
  { a: 'o3-mini', b: 'deepseek-r1' },
  { a: 'deepseek-v3', b: 'gpt-4o' },
];

export const PRICING_TOPICS = [
  {
    slug: 'cheapest-llm-api-providers',
    title: 'Cheapest LLM API Providers in 2026',
    description: 'Comprehensive analysis of lowest cost per million tokens across DeepSeek-V4.1-Flash, Google Gemini, Groq, and OpenRouter.',
    bestModel: 'deepseek-v4.1-flash',
  },
  {
    slug: 'prompt-caching-cost-guide',
    title: 'The Ultimate Prompt Caching Cost Guide',
    description: 'Mathematical breakdown of Anthropic vs OpenAI vs Google vs DeepSeek caching discounts and write surcharge break-even curves.',
    bestModel: 'claude-sonnet-5.5',
  },
  {
    slug: 'best-coding-models-pricing',
    title: 'Best Coding Models & Price-Performance Index',
    description: 'Comparing Gemini 4 Neon, GPT-6.2 Sol, Claude Sonnet 5.5, and DeepSeek-V4.1-Flash on coding benchmark ROI.',
    bestModel: 'gemini-4-neon',
  },
  {
    slug: 'batch-api-discount-comparison',
    title: 'Batch API 50% Off: When & How to Use It',
    description: 'How to save 50% on large offline tasks with OpenAI, Anthropic, and Google asynchronous batch endpoints.',
    bestModel: 'gpt-6.2-sol',
  },
];

export interface ComparisonScenarioResult {
  scenarioName: string;
  description: string;
  monthlyRequests: number;
  inputTokens: number;
  outputTokens: number;
  cacheHitRate: number;
  batchRate: number;
  costA: number;
  costB: number;
  savingsAmount: number;
  savingsPercent: number;
  recommendedModel: string;
  verdict: string;
}

export interface ComparisonFAQ {
  question: string;
  answer: string;
}

export interface ComparisonData {
  modelA: ModelPricingRule;
  modelB: ModelPricingRule;
  slug: string;
  canonicalSlug: string;
  title: string;
  description: string;
  isSpecial?: boolean;
  scenarios: ComparisonScenarioResult[];
  faqs: ComparisonFAQ[];
}

export const P0_COMPARE_PAIRS: {
  canonicalSlug: string;
  a: string;
  b: string;
  targetKeyword: string;
  title: string;
  description: string;
}[] = [
  {
    canonicalSlug: 'claude-3-5-sonnet-vs-gpt-4o',
    a: 'claude-3-5-sonnet',
    b: 'gpt-4o',
    targetKeyword: 'gpt-4o vs claude 3.5 sonnet cost',
    title: 'Claude 3.5 Sonnet vs GPT-4o API Pricing & Cost Comparison',
    description: 'Compare Claude 3.5 Sonnet ($3.00/$15.00) vs GPT-4o ($2.50/$10.00). Calculate Anthropic 90% prompt caching savings vs OpenAI zero-surcharge caching.',
  },
  {
    canonicalSlug: 'deepseek-r1-vs-openai-o1',
    a: 'deepseek-r1',
    b: 'o1',
    targetKeyword: 'deepseek r1 vs o1 pricing',
    title: 'DeepSeek R1 vs OpenAI o1 Reasoning API Pricing & Cost Comparison',
    description: 'Compare DeepSeek-R1 ($0.55/$2.19) vs OpenAI o1 ($15.00/$60.00). Save up to 96% on reasoning tokens with prompt caching analysis.',
  },
  {
    canonicalSlug: 'deepseek-v3-vs-gpt-4o',
    a: 'deepseek-v3',
    b: 'gpt-4o',
    targetKeyword: 'deepseek-v3 vs gpt-4o pricing',
    title: 'DeepSeek-V3 vs GPT-4o API Pricing & Cost Comparison',
    description: 'Compare DeepSeek-V3 ($0.27/$1.10) vs GPT-4o ($2.50/$10.00). Analyze 89% cost reduction and prompt caching efficiency.',
  },
  {
    canonicalSlug: 'claude-3-5-sonnet-vs-deepseek-v3',
    a: 'claude-3-5-sonnet',
    b: 'deepseek-v3',
    targetKeyword: 'deepseek-v3 vs claude 3.5 sonnet cost',
    title: 'Claude 3.5 Sonnet vs DeepSeek-V3 API Pricing & Cost Comparison',
    description: 'Compare Claude 3.5 Sonnet ($3.00/$15.00) vs DeepSeek-V3 ($0.27/$1.10) for coding agents and long-context architectures.',
  },
  {
    canonicalSlug: 'deepseek-r1-vs-gpt-4o',
    a: 'deepseek-r1',
    b: 'gpt-4o',
    targetKeyword: 'deepseek-r1 vs gpt-4o cost',
    title: 'DeepSeek-R1 vs GPT-4o API Pricing & Cost Comparison',
    description: 'Compare DeepSeek-R1 reasoning pricing ($0.55/$2.19) against OpenAI flagship GPT-4o ($2.50/$10.00).',
  },
  {
    canonicalSlug: 'claude-3-5-haiku-vs-gpt-4o-mini',
    a: 'claude-3-5-haiku',
    b: 'gpt-4o-mini',
    targetKeyword: 'gpt-4o-mini vs claude 3.5 haiku pricing',
    title: 'Claude 3.5 Haiku vs GPT-4o mini API Pricing & Cost Comparison',
    description: 'Compare Claude 3.5 Haiku ($0.80/$4.00) vs GPT-4o mini ($0.15/$0.60). Analyze lightweight API cost efficiency and caching.',
  },
  {
    canonicalSlug: 'gemini-1-5-flash-vs-gpt-4o-mini',
    a: 'gemini-1-5-flash',
    b: 'gpt-4o-mini',
    targetKeyword: 'gpt-4o-mini vs gemini 1.5 flash cost',
    title: 'Gemini 1.5 Flash vs GPT-4o mini API Pricing & Cost Comparison',
    description: 'Compare Google Gemini 1.5 Flash ($0.075/$0.30) vs GPT-4o mini ($0.15/$0.60). Avoid the 128k context doubling tax.',
  },
  {
    canonicalSlug: 'deepseek-v3-vs-gpt-4o-mini',
    a: 'deepseek-v3',
    b: 'gpt-4o-mini',
    targetKeyword: 'deepseek-v3 vs gpt-4o-mini cost',
    title: 'DeepSeek-V3 vs GPT-4o mini API Pricing & Cost Comparison',
    description: 'Compare frontier-grade DeepSeek-V3 ($0.27/$1.10) vs OpenAI economy GPT-4o mini ($0.15/$0.60) for production scaling.',
  },
  {
    canonicalSlug: 'gemini-1-5-pro-vs-gpt-4o',
    a: 'gemini-1-5-pro',
    b: 'gpt-4o',
    targetKeyword: 'gpt-4o vs gemini 1.5 pro pricing',
    title: 'Gemini 1.5 Pro vs GPT-4o API Pricing & Cost Comparison',
    description: 'Compare Google Gemini 1.5 Pro ($1.25/$5.00) vs GPT-4o ($2.50/$10.00). Analyze 2M context window capacity vs 128k tier threshold.',
  },
  {
    canonicalSlug: 'claude-3-5-sonnet-vs-gemini-1-5-pro',
    a: 'claude-3-5-sonnet',
    b: 'gemini-1-5-pro',
    targetKeyword: 'claude 3.5 sonnet vs gemini 1.5 pro cost',
    title: 'Claude 3.5 Sonnet vs Gemini 1.5 Pro API Pricing & Cost Comparison',
    description: 'Compare Claude 3.5 Sonnet ($3.00/$15.00) vs Gemini 1.5 Pro ($1.25/$5.00). Evaluate Prompt Caching vs 2M token context window.',
  },
  {
    canonicalSlug: 'anthropic-prompt-caching-vs-standard',
    a: 'anthropic-prompt-caching',
    b: 'standard',
    targetKeyword: 'anthropic prompt caching cost savings',
    title: 'Anthropic Prompt Caching vs Standard API Pricing & ROI Guide',
    description: 'Calculate 90% savings ($0.30/1M vs $3.00/1M) with Anthropic Prompt Caching. Analyze the 25% write surcharge break-even curve.',
  },
  {
    canonicalSlug: 'openai-batch-api-vs-standard-api',
    a: 'openai-batch-api',
    b: 'standard-api',
    targetKeyword: 'openai batch api cost discount',
    title: 'OpenAI Batch API vs Standard API: 50% Cost Discount Analysis',
    description: 'How to save 50% on GPT-4o and GPT-4o-mini using OpenAI Batch API ($1.25/$5.00) with 24-hour SLA turnaround.',
  },
];

export function findModel(id: string): ModelPricingRule | undefined {
  if (!id) return undefined;
  const normalized = id.toLowerCase().trim();
  if (normalized === 'openai-o1' || normalized === 'o1') {
    return MODELS_DATA.find((m) => m.modelId === 'o1');
  }
  return MODELS_DATA.find((m) => m.modelId.toLowerCase() === normalized);
}

const SPECIAL_MODELS: Record<string, { modelA: ModelPricingRule; modelB: ModelPricingRule; title: string; description: string }> = {
  'anthropic-prompt-caching-vs-standard': {
    modelA: {
      modelId: 'claude-3-5-sonnet-caching',
      modelName: 'Claude 3.5 Sonnet (Prompt Caching Enabled)',
      providerOrg: 'Anthropic',
      inputPerM: 3.00,
      outputPerM: 15.00,
      cachedInputPerM: 0.30,
      cacheWritePerM: 3.75,
      cacheDiscountPercent: 90.0,
      batchDiscountPercent: 50.0,
      contextWindow: 200000,
      maxOutputTokens: 8192,
      latencyTier: 'standard',
      capabilities: { reasoning: false, vision: true, functionCalling: true, structuredOutputs: true },
      benchmarks: { evalScore: 93.7, mmlu: 88.3, arenaElo: 1283, avgLatencyTtftMs: 450, avgThroughputTokS: 78 },
      officialDocUrl: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching',
      notes: 'Anthropic Prompt Caching charges 1.25x base ($3.75/1M) on initial write for 5-minute TTL, then applies a massive 90% discount ($0.30/1M) on cache read hits. Break-even occurs after only 1.25 reads.',
    },
    modelB: {
      modelId: 'claude-3-5-sonnet-standard',
      modelName: 'Claude 3.5 Sonnet (Standard On-Demand)',
      providerOrg: 'Anthropic',
      inputPerM: 3.00,
      outputPerM: 15.00,
      cachedInputPerM: 3.00,
      cacheDiscountPercent: 0.0,
      batchDiscountPercent: 0.0,
      contextWindow: 200000,
      maxOutputTokens: 8192,
      latencyTier: 'standard',
      capabilities: { reasoning: false, vision: true, functionCalling: true, structuredOutputs: true },
      benchmarks: { evalScore: 93.7, mmlu: 88.3, arenaElo: 1283, avgLatencyTtftMs: 450, avgThroughputTokS: 78 },
      officialDocUrl: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching',
      notes: 'Standard on-demand API without prompt caching, paying full $3.00/1M on every redundant prefix token.',
    },
    title: 'Anthropic Prompt Caching vs Standard API Cost & ROI Calculator',
    description: 'Calculate 90% savings ($0.30/1M vs $3.00/1M) with Anthropic Prompt Caching on Claude 3.5 Sonnet. Model the 25% write surcharge break-even curve.',
  },
  'openai-batch-api-vs-standard-api': {
    modelA: {
      modelId: 'gpt-4o-batch',
      modelName: 'GPT-4o (Batch API - 50% Off)',
      providerOrg: 'OpenAI',
      inputPerM: 1.25,
      outputPerM: 5.00,
      cachedInputPerM: 0.625,
      cacheDiscountPercent: 50.0,
      batchDiscountPercent: 50.0,
      contextWindow: 128000,
      maxOutputTokens: 16384,
      latencyTier: 'standard',
      capabilities: { reasoning: false, vision: true, functionCalling: true, structuredOutputs: true },
      benchmarks: { evalScore: 88.7, mmlu: 88.7, arenaElo: 1286, avgLatencyTtftMs: 12000, avgThroughputTokS: 90 },
      officialDocUrl: 'https://platform.openai.com/docs/guides/batch',
      notes: 'OpenAI Batch API provides an instant 50% discount on both input and output tokens with a 24-hour SLA turnaround and separate rate limits.',
    },
    modelB: {
      modelId: 'gpt-4o-standard',
      modelName: 'GPT-4o (Standard Synchronous API)',
      providerOrg: 'OpenAI',
      inputPerM: 2.50,
      outputPerM: 10.00,
      cachedInputPerM: 1.25,
      cacheDiscountPercent: 50.0,
      batchDiscountPercent: 0.0,
      contextWindow: 128000,
      maxOutputTokens: 16384,
      latencyTier: 'standard',
      capabilities: { reasoning: false, vision: true, functionCalling: true, structuredOutputs: true },
      benchmarks: { evalScore: 88.7, mmlu: 88.7, arenaElo: 1286, avgLatencyTtftMs: 420, avgThroughputTokS: 90 },
      officialDocUrl: 'https://openai.com/api/pricing/',
      notes: 'Standard real-time synchronous API endpoint with sub-second time-to-first-token (TTFT).',
    },
    title: 'OpenAI Batch API vs Standard API: 50% Cost Discount Calculator',
    description: 'Compare 50% savings using OpenAI Batch API ($1.25/1M in, $5.00/1M out) versus standard GPT-4o API. Analyze 24-hour SLA vs real-time latency tradeoffs.',
  },
};

export function getComparisonData(slug: string): ComparisonData | null {
  if (!slug) return null;

  // Handle special architectural comparisons
  if (SPECIAL_MODELS[slug]) {
    const special = SPECIAL_MODELS[slug];
    const scenarios = generateScenarioProjections(special.modelA, special.modelB);
    const faqs = generateComparisonFaqs(special.modelA, special.modelB, slug);
    return {
      modelA: special.modelA,
      modelB: special.modelB,
      slug,
      canonicalSlug: slug,
      title: special.title,
      description: special.description,
      isSpecial: true,
      scenarios,
      faqs,
    };
  }

  const parts = slug.split('-vs-');
  if (parts.length !== 2) return null;

  let [slugA, slugB] = parts;
  if (slugA === 'openai-o1') slugA = 'o1';
  if (slugB === 'openai-o1') slugB = 'o1';

  const modelA = findModel(slugA);
  const modelB = findModel(slugB);

  if (!modelA || !modelB) return null;

  // Determine canonical slug
  let canonicalSlug = '';
  if ((modelA.modelId === 'deepseek-r1' && modelB.modelId === 'o1') || (modelA.modelId === 'o1' && modelB.modelId === 'deepseek-r1')) {
    canonicalSlug = 'deepseek-r1-vs-openai-o1';
  } else {
    const sorted = [modelA.modelId, modelB.modelId].sort();
    canonicalSlug = `${sorted[0]}-vs-${sorted[1]}` as string;
  }

  const title = `${modelA.modelName} vs ${modelB.modelName} API Pricing & Cost Comparison`;
  const description = `Compare real-world API costs for ${modelA.modelName} ($${modelA.inputPerM}/$${modelA.outputPerM}) vs ${modelB.modelName} ($${modelB.inputPerM}/$${modelB.outputPerM}). Calculate Prompt Caching ROI & Batch API savings.`;

  const scenarios = generateScenarioProjections(modelA, modelB);
  const faqs = generateComparisonFaqs(modelA, modelB, canonicalSlug);

  return {
    modelA,
    modelB,
    slug,
    canonicalSlug,
    title,
    description,
    isSpecial: false,
    scenarios,
    faqs,
  };
}

function generateScenarioProjections(modelA: ModelPricingRule, modelB: ModelPricingRule): ComparisonScenarioResult[] {
  const configs = [
    {
      name: 'RAG Knowledge Base & Enterprise Search',
      desc: '100,000 queries/month, 3,500 input tokens (system + 5 retrieved chunks), 400 output tokens, 75% prompt cache hit rate.',
      params: { monthlyRequests: 100000, inputTokens: 3500, outputTokens: 400, cacheHitRate: 0.75, batchRate: 0, enableLongContext: false },
    },
    {
      name: 'Multi-Turn Coding Agent & ReAct Loops',
      desc: '25,000 tasks/month, 8,000 input tokens (accumulating conversation context & tool schemas), 1,200 output tokens, 85% cache hit rate.',
      params: { monthlyRequests: 25000, inputTokens: 8000, outputTokens: 1200, cacheHitRate: 0.85, batchRate: 0.15, enableLongContext: false },
    },
    {
      name: 'High-Throughput Offline Data Extraction',
      desc: '500,000 records/month, 1,500 input tokens, 250 output tokens, 100% batch offload (24-hour turnaround SLA).',
      params: { monthlyRequests: 500000, inputTokens: 1500, outputTokens: 250, cacheHitRate: 0.20, batchRate: 1.0, enableLongContext: false },
    },
  ];

  return configs.map((cfg) => {
    const costA = calculateModelCost(modelA, cfg.params);
    const costB = calculateModelCost(modelB, cfg.params);
    const diff = Math.abs(costA.monthlyNetCost - costB.monthlyNetCost);
    const maxCost = Math.max(costA.monthlyNetCost, costB.monthlyNetCost);
    const pct = maxCost > 0 ? Math.round((diff / maxCost) * 100) : 0;
    const cheaper = costA.monthlyNetCost <= costB.monthlyNetCost ? modelA.modelName : modelB.modelName;

    return {
      scenarioName: cfg.name,
      description: cfg.desc,
      monthlyRequests: cfg.params.monthlyRequests,
      inputTokens: cfg.params.inputTokens,
      outputTokens: cfg.params.outputTokens,
      cacheHitRate: cfg.params.cacheHitRate,
      batchRate: cfg.params.batchRate,
      costA: costA.monthlyNetCost,
      costB: costB.monthlyNetCost,
      savingsAmount: diff,
      savingsPercent: pct,
      recommendedModel: cheaper,
      verdict: `${cheaper} delivers ${pct}% lower monthly spend ($${diff.toFixed(2)}/mo savings) for this workload profile.`,
    };
  });
}

function generateComparisonFaqs(modelA: ModelPricingRule, modelB: ModelPricingRule, canonicalSlug: string): ComparisonFAQ[] {
  const isSpecialCaching = canonicalSlug === 'anthropic-prompt-caching-vs-standard';
  const isSpecialBatch = canonicalSlug === 'openai-batch-api-vs-standard-api';

  if (isSpecialCaching) {
    return [
      {
        question: 'How much money does Anthropic Prompt Caching actually save?',
        answer: 'Anthropic Prompt Caching provides a 90% discount on cached input reads ($0.30 per 1M tokens vs $3.00 standard). Although initial cache creation incurs a 25% write surcharge ($3.75 per 1M tokens), any prompt prefix reused more than 1.25 times within its 5-minute TTL yields net cost savings.',
      },
      {
        question: 'What is the minimum prompt size required for Anthropic Prompt Caching?',
        answer: 'Anthropic requires at least 1,024 input tokens to establish a cache breakpoint. Prompts under 1,024 tokens are billed at the standard rate without caching benefits.',
      },
      {
        question: 'How does Anthropic caching differ from OpenAI caching?',
        answer: 'OpenAI automatically caches prompts over 1,024 tokens without charging any write surcharge ($0 cache write fee) and offers a 50% read discount. Anthropic requires explicit cache_control breakpoints, charges a 25% write surcharge, but gives a substantially deeper 90% read discount.',
      },
      {
        question: 'Which workloads benefit most from Anthropic Prompt Caching?',
        answer: 'Workloads with heavy, repeated system instructions—such as multi-turn conversational agents, RAG pipelines with large static document chunks, codebases in context, and repetitive tool schemas—experience up to 70-85% total billing reductions.',
      },
    ];
  }

  if (isSpecialBatch) {
    return [
      {
        question: 'What is the exact discount for OpenAI Batch API?',
        answer: 'The OpenAI Batch API provides a direct 50% discount on both input and output tokens across GPT-4o, GPT-4o-mini, and other supported models compared to standard real-time endpoints.',
      },
      {
        question: 'What is the turnaround SLA for OpenAI Batch API requests?',
        answer: 'OpenAI guarantees completion within 24 hours. In practice, most batches complete within 20 to 90 minutes depending on cluster queue load, but it is not intended for interactive user-facing applications.',
      },
      {
        question: 'Do Batch API requests consume standard organization rate limits?',
        answer: 'No. Batch API requests operate in a separate token pool with dedicated high-throughput Enqueued Token limits (typically 20M to 100M+ tokens), preventing batch jobs from starving real-time production traffic.',
      },
      {
        question: 'Can Prompt Caching discounts be combined with Batch API discounts?',
        answer: 'Yes. OpenAI supports prompt caching within Batch API requests, enabling cumulative discounts: 50% off for batch plus 50% off cached prompt reads.',
      },
    ];
  }

  return [
    {
      question: `Which model is cheaper overall: ${modelA.modelName} or ${modelB.modelName}?`,
      answer: `At base pricing, ${modelA.modelName} costs $${modelA.inputPerM}/1M input and $${modelA.outputPerM}/1M output, while ${modelB.modelName} costs $${modelB.inputPerM}/1M input and $${modelB.outputPerM}/1M output. The cheaper option depends on your input-to-output token ratio and whether prompt caching or batch discounts are utilized.`,
    },
    {
      question: `How does Prompt Caching impact the cost of ${modelA.modelName} vs ${modelB.modelName}?`,
      answer: `${modelA.modelName} offers a ${modelA.cacheDiscountPercent}% read discount (${modelA.cachedInputPerM > 0 ? `$${modelA.cachedInputPerM}/1M` : 'standard'}), whereas ${modelB.modelName} provides a ${modelB.cacheDiscountPercent}% read discount (${modelB.cachedInputPerM > 0 ? `$${modelB.cachedInputPerM}/1M` : 'standard'}). High cache hit ratios (>70%) significantly compress the cost delta in agentic and RAG architectures.`,
    },
    {
      question: `Can I use Batch API with ${modelA.modelName} or ${modelB.modelName} to save 50%?`,
      answer: `${modelA.batchDiscountPercent > 0 ? `${modelA.modelName} supports 50% batch offload discounts for asynchronous 24-hour turnaround tasks.` : `${modelA.modelName} does not have a native 50% batch endpoint.`} ${modelB.batchDiscountPercent > 0 ? `${modelB.modelName} supports 50% batch discounts.` : `${modelB.modelName} uses low base on-demand pricing.`}`,
    },
    {
      question: `What are the context window limits and tiered pricing rules for ${modelA.modelName} vs ${modelB.modelName}?`,
      answer: `${modelA.modelName} features a ${(modelA.contextWindow / 1000).toLocaleString()}k context window${modelA.tierThreshold ? ` with tiered escalation above ${(modelA.tierThreshold / 1000).toLocaleString()}k tokens` : ' with flat per-token pricing'}. In comparison, ${modelB.modelName} supports ${(modelB.contextWindow / 1000).toLocaleString()}k tokens${modelB.tierThreshold ? ` with tiered escalation above ${(modelB.tierThreshold / 1000).toLocaleString()}k tokens` : ' with flat per-token pricing'}.`,
    },
  ];
}

/**
 * Tier-1 模型名单：站内两两组合全部预生成静态对比页。
 *
 * 规模关系：N 个模型 → N*(N-1) 个页面（正反两个方向都生成）。
 * 名单同时决定 sitemap 收录范围与模型页的互链数量，改动会影响构建时长和磁盘占用。
 * 增删时请同步检查：build 会校验每个 id 都存在于模型数据中，写错会直接报错。
 */
export const TIER1_MODELS: string[] = [
  // —— Google (2026 Flagships)
  'gemini-4-neon',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-4-hydrogen',
  'gemini-4-argon',
  'gemini-4-carbon',
  'gemini-1.5-flash',
  'gemini-3.1-flash-lite',
  // —— OpenAI (2026 Flagships)
  'gpt-6.2-sol',
  'gpt-6.2-astra',
  'gpt-6.1-sol',
  'gpt-6.1-terra',
  'gpt-6-luna',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4.1',
  'gpt-4.1-mini',
  'o3',
  'o3-mini',
  'gpt-6-astra',
  // —— Anthropic
  'claude-sonnet-5.5',
  'claude-sonnet-5',
  'claude-haiku-4.5',
  'claude-haiku-5.5',
  'claude-opus-5.5',
  'claude-fable-5.2',
  'claude-3-5-sonnet',
  'claude-3-5-haiku',
  // —— DeepSeek
  'deepseek-v4.1-flash',
  'deepseek-v4-pro',
  'deepseek-v3',
  'deepseek-v3.2',
  // —— Alibaba Qwen
  'qwen3.7-max',
  'qwen3.5-397b-a17b',
  'qwen3-coder',
  // —— Meta / Groq
  'llama-3.3-70b',
  'llama-4-scout',
  'llama-4-maverick',
  'llama-3.1-8b-instruct',
  // —— xAI
  'grok-4.5',
  'grok-4.6',
  // —— Zhipu
  'glm-5.3-prime',
  'glm-5.3-flash',
  'glm-5.1',
  // —— Mistral
  'mistral-large-4-0',
  'mixtral-8x7b',
  // —— Moonshot
  'kimi-k3',
  'kimi-k2.5',
  // —— 其余厂商旗舰
  'nemotron-3-ultra-550b-a55b',
  'command-a',
  'nova-pro-v1',
  'sonar-pro',
  'sonar',
  'minimax-m3',
  'seed-2-1-turbo',
  'hy4',
  'phi-4',
];

// 构建期校验：拼错的 id 会让整站默默生成死页，这里直接让构建失败
const _modelIdSet = new Set(MODELS_DATA.map((m) => m.modelId));
const _invalidTier1 = TIER1_MODELS.filter((id) => !_modelIdSet.has(id));
if (_invalidTier1.length > 0) {
  throw new Error(`TIER1_MODELS 含数据中不存在的模型: ${_invalidTier1.join(', ')}`);
}

/**
 * 生成两个模型的对比页地址。
 *  - 已预生成 → /compare/<slug>/（可索引）
 *  - 未预生成 → /compare/view/?slug=<slug>（客户端按需渲染，noindex）
 */
export function compareHref(aId: string, bId: string): string {
  let slug: string;
  if (
    (aId === 'deepseek-r1' && (bId === 'o1' || bId === 'openai-o1')) ||
    ((aId === 'o1' || aId === 'openai-o1') && bId === 'deepseek-r1')
  ) {
    slug = 'deepseek-r1-vs-openai-o1';
  } else {
    const sorted = [aId, bId].sort();
    slug = `${sorted[0]}-vs-${sorted[1]}`;
  }
  return hasComparePage(slug)
    ? `/compare/${slug}/`
    : `/compare/view/?slug=${encodeURIComponent(slug)}`;
}

export function getAllCompareStaticSlugs(): string[] {
  const slugs: Set<string> = new Set();

  // 0. All 2026 Trending Comparisons
  for (const c of (trendingComparisonsData.comparisons as unknown as { slug?: string; canonicalSlug?: string }[] || [])) {
    if (c.slug) {
      slugs.add(c.slug);
      const parts = c.slug.split('-vs-');
      if (parts.length === 2) {
        slugs.add(parts[1] + "-vs-" + parts[0]);
      }
    }
    if (c.canonicalSlug) {
      slugs.add(c.canonicalSlug);
    }
  }

  // 1. All P0 Pairs (canonical and inverse)
  for (const pair of P0_COMPARE_PAIRS) {
    slugs.add(pair.canonicalSlug);
    if (!pair.canonicalSlug.includes('anthropic-prompt-caching') && !pair.canonicalSlug.includes('openai-batch-api')) {
      const parts = pair.canonicalSlug.split('-vs-');
      if (parts.length === 2) {
        slugs.add(`${parts[1]}-vs-${parts[0]}`);
      }
    }
  }

  // 2. Extra aliases for deepseek-r1-vs-openai-o1
  slugs.add('deepseek-r1-vs-openai-o1');
  slugs.add('openai-o1-vs-deepseek-r1');
  slugs.add('deepseek-r1-vs-o1');
  slugs.add('o1-vs-deepseek-r1');

  // 3. Extra popular pairs
  for (const p of POPULAR_COMPARE_PAIRS) {
    slugs.add(`${p.a}-vs-${p.b}`);
    slugs.add(`${p.b}-vs-${p.a}`);
  }

  // 4. Tier-1 模型两两组合（正反双向都生成，保证任意选择顺序都能命中）
  for (let i = 0; i < TIER1_MODELS.length; i++) {
    for (let j = i + 1; j < TIER1_MODELS.length; j++) {
      const sorted = [TIER1_MODELS[i], TIER1_MODELS[j]].sort();
      slugs.add(sorted[0] + '-vs-' + sorted[1]);
    }
  }

  return Array.from(slugs);
}

/**
 * 该组合是否有构建期预生成的静态页。
 *
 * 选择器和模型详情页都用它来决定链接指向：
 *  - 有 → /compare/<slug>/（预渲染，参与 SEO）
 *  - 没有 → /compare/view/?slug=<slug>（客户端按需渲染，noindex）
 *
 * 不这么做的话，用户从全部 ~371 个模型里选两个，99.5% 的组合会 404。
 */
let compareSlugCache: Set<string> | null = null;

export function hasComparePage(slug: string): boolean {
  if (!compareSlugCache) {
    compareSlugCache = new Set(getAllCompareStaticSlugs());
  }
  return compareSlugCache.has(slug);
}
