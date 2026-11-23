export type KnownProviderOrg =
  | 'OpenAI'
  | 'Anthropic'
  | 'DeepSeek'
  | 'Google'
  | 'Groq'
  | 'xAI'
  | 'Alibaba Qwen'
  | 'Mistral'
  | 'Meta'
  | 'Microsoft'
  | 'Cohere'
  | 'Baidu'
  | 'Tencent'
  | 'ByteDance'
  | 'Zhipu AI'
  | 'MiniMax'
  | 'Moonshot AI'
  | 'StepFun'
  | 'Xiaomi'
  | 'Meituan'
  | 'Amazon'
  | 'Fireworks'
  | 'NVIDIA'
  | 'Perplexity'
  | 'OpenSource'
  | 'Openrouter';

export type ProviderOrg = KnownProviderOrg | (string & {});

export type LatencyTier = 'ultra-low' | 'fast' | 'standard' | 'reasoning-medium' | 'reasoning-heavy';

export interface ModelCapabilities {
  reasoning: boolean;
  vision: boolean;
  functionCalling: boolean;
  structuredOutputs: boolean;
}

export interface ModelBenchmarks {
  evalScore?: number;
  intelligenceIndex?: number;
  codingIndex?: number;
  arenaElo?: number;
  agenticIndex?: number;
  evalSources?: string[];
  mmlu?: number;
  avgLatencyTtftMs?: number;
  avgThroughputTokS?: number;
  isEstimatedPerformance?: boolean;
}

export interface HostedProvider {
  name: string;
  inputPerM: number;
  outputPerM: number;
  cachedInputPerM?: number;
  supportsCaching: boolean;
  affiliateUrl: string;
  isSponsored?: boolean;
}

export interface ModelPricingRule {
  modelId: string;
  modelName: string;
  providerOrg: ProviderOrg;
  inputPerM: number;          // USD per 1M tokens (base cache-miss input)
  outputPerM: number;         // USD per 1M tokens
  cachedInputPerM: number;    // USD per 1M tokens (cache hit read)
  cacheWritePerM?: number;    // USD per 1M tokens (cache write surcharge, e.g. Anthropic +25%)
  cacheDiscountPercent: number;
  batchDiscountPercent: number;
  contextWindow: number;
  maxOutputTokens: number;
  latencyTier: LatencyTier;
  capabilities: ModelCapabilities;
  benchmarks?: ModelBenchmarks;
  officialDocUrl: string;
  affiliateUrl?: string;
  isSponsored?: boolean;
  isFrontier?: boolean;       // 2026 Frontier model flag (e.g. GPT-6.2 Sol, Claude 5.5)
  notes?: string;
  hostedProviders?: HostedProvider[];
  tierThreshold?: number;     // e.g. Gemini 128000
  tierInputPerM?: number;     // e.g. Gemini >128k input rate
  tierOutputPerM?: number;    // e.g. Gemini >128k output rate
}

export interface NonTokenDisplayRate {
  label: string;
  rateUsd: number;
  unitLabel: string;
  secondaryEquivalent: string;
  isHighlightDiscount?: boolean;
}

export interface NonTokenModelRule {
  modelId: string;
  modelName: string;
  providerOrg: ProviderOrg;
  billingType: 'non_token';
  billingUnit: 'per_second' | 'per_minute';
  primaryRateLabel: string;
  secondaryRateLabel: string;
  displayRates: NonTokenDisplayRate[];
  streamSpecs: {
    resolution?: string;
    frameRateFps?: number;
    videoTokensPerSec?: number;
    audioSampleRateKhz?: number;
    maxSessionMinutes?: number;
    underlyingTokenRates: string;
  };
  targetCalculatorPath: string;
  officialDocUrl: string;
  isFrontier?: boolean;
  isRealtimeWorld?: boolean;
  capabilities: {
    reasoning: boolean;
    vision: boolean;
    audio?: boolean;
    videoStream?: boolean;
    realtimeVoice?: boolean;
    worldModel?: boolean;
    functionCalling: boolean;
    structuredOutputs: boolean;
  };
  notes: string;
}

export type DirectoryModelItem = ModelPricingRule | NonTokenModelRule;

export function isNonTokenModel(item: DirectoryModelItem): item is NonTokenModelRule {
  return 'billingType' in item && item.billingType === 'non_token';
}

export interface SimulationParams {
  monthlyRequests: number;
  inputTokens: number;
  outputTokens: number;
  cacheHitRate: number;      // 0.0 - 1.0 (e.g. 0.65 for 65%)
  batchRate: number;         // 0.0 - 1.0 (e.g. 0.30 for 30%)
  enableLongContext: boolean;
  cacheLifetimeMultiplier?: number; // Anthropic write amortization (e.g. 5 rounds)
}

export interface ModelCostBreakdown {
  model: ModelPricingRule;
  singleRequestCost: number;     // USD
  monthlyNetCost: number;        // USD
  baseMonthlyCost: number;       // USD without caching or batch discounts
  cacheSavingsMonthly: number;   // USD saved from prompt caching
  batchSavingsMonthly: number;   // USD saved from batch processing
  totalSavingsMonthly: number;   // USD
  savingsPercent: number;        // % saved compared to base
  costPer1kRequests: number;     // USD per 1k requests
}

export interface ScenarioPreset {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  params: SimulationParams;
}

export interface RouterRecommendation {
  id: string;
  name: string;
  tagline: string;
  description: string;
  monthlyRequests: number;
  savingsVsBaseline: number; // percentage, e.g. 38 or 88
  blendedMonthlyCost: number;
  baselineModel: ModelPricingRule;
  baselineCost: number;
  stages: {
    stageName: string;
    model: ModelPricingRule;
    trafficSharePercent: number;
    allocatedMonthlyCost: number;
    purpose: string;
  }[];
  codeSnippets: {
    litellmYaml: string;
    vercelAiTs: string;
    pythonSdk: string;
  };
}
