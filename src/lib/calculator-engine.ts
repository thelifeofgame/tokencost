import { ModelPricingRule, SimulationParams, ModelCostBreakdown } from '@/types/pricing';

/**
 * High-precision calculator engine for LLM API pricing, prompt caching amortization,
 * batch discounts, and multi-tier context windows.
 */
export function calculateModelCost(
  model: ModelPricingRule,
  params: SimulationParams
): ModelCostBreakdown {
  const {
    monthlyRequests,
    inputTokens,
    outputTokens,
    cacheHitRate,
    batchRate,
    enableLongContext,
    cacheLifetimeMultiplier = 5,
  } = params;

  // 1. Determine base pricing rates (handling long context tiers, e.g. Gemini >128k)
  const isTierExceeded =
    (enableLongContext || inputTokens > (model.tierThreshold ?? Infinity)) &&
    Boolean(model.tierThreshold && model.tierInputPerM);

  const effectiveInputPerM = isTierExceeded && model.tierInputPerM ? model.tierInputPerM : model.inputPerM;
  const effectiveOutputPerM = isTierExceeded && model.tierOutputPerM ? model.tierOutputPerM : model.outputPerM;

  // Cache read rate
  const effectiveCacheReadPerM = isTierExceeded && model.tierInputPerM
    ? model.tierInputPerM * (1 - model.cacheDiscountPercent / 100)
    : model.cachedInputPerM;

  // 2. Base cost per single request without caching and without batch discount
  const baseInputCostSingle = (inputTokens / 1_000_000) * effectiveInputPerM;
  const baseOutputCostSingle = (outputTokens / 1_000_000) * effectiveOutputPerM;
  const baseCostSingle = baseInputCostSingle + baseOutputCostSingle;

  // 3. Input cost with prompt caching
  const missTokens = inputTokens * (1 - cacheHitRate);
  const hitTokens = inputTokens * cacheHitRate;

  const missCost = (missTokens / 1_000_000) * effectiveInputPerM;
  const hitCost = (hitTokens / 1_000_000) * effectiveCacheReadPerM;

  // Anthropic write surcharge amortization (if specified, e.g. +25% on initial write amortized over K calls)
  let amortizedWriteCost = 0;
  if (model.cacheWritePerM && model.cacheWritePerM > effectiveInputPerM) {
    const surcharge = (model.cacheWritePerM - effectiveInputPerM) / Math.max(1, cacheLifetimeMultiplier);
    amortizedWriteCost = (inputTokens / 1_000_000) * surcharge;
  }

  const netInputCostBeforeBatch = missCost + hitCost + amortizedWriteCost;
  const netSubtotalBeforeBatch = netInputCostBeforeBatch + baseOutputCostSingle;

  // 4. Batch discount application
  const batchDiscountFactor = (model.batchDiscountPercent / 100);
  const effectiveBatchMultiplier = 1 - (batchRate * batchDiscountFactor);

  const singleRequestCost = netSubtotalBeforeBatch * effectiveBatchMultiplier;
  const monthlyNetCost = singleRequestCost * monthlyRequests;
  const baseMonthlyCost = baseCostSingle * monthlyRequests;

  // 5. Savings calculations
  // Cache savings = difference between base input cost and cached input cost, before batch
  const cacheSavingsSingle = Math.max(0, baseInputCostSingle - netInputCostBeforeBatch);
  const cacheSavingsMonthly = cacheSavingsSingle * monthlyRequests;

  // Batch savings = savings applied via batch offload
  const batchSavingsSingle = Math.max(0, netSubtotalBeforeBatch * (batchRate * batchDiscountFactor));
  const batchSavingsMonthly = batchSavingsSingle * monthlyRequests;

  const totalSavingsMonthly = Math.max(0, baseMonthlyCost - monthlyNetCost);
  const savingsPercent = baseMonthlyCost > 0 ? (totalSavingsMonthly / baseMonthlyCost) * 100 : 0;
  const costPer1kRequests = singleRequestCost * 1000;

  return {
    model,
    singleRequestCost,
    monthlyNetCost,
    baseMonthlyCost,
    cacheSavingsMonthly,
    batchSavingsMonthly,
    totalSavingsMonthly,
    savingsPercent,
    costPer1kRequests,
  };
}

/**
 * Calculates costs for all provided models and sorts them by monthlyNetCost ascending.
 */
export function calculateAllModels(
  models: ModelPricingRule[],
  params: SimulationParams
): ModelCostBreakdown[] {
  return models
    .map((m) => calculateModelCost(m, params))
    .sort((a, b) => a.monthlyNetCost - b.monthlyNetCost);
}

/**
 * Curated list of 16 zero-orphan 2026-11 mainstream production benchmark models
 * across Fast (5), Frontier (6), and Reasoning (5) camps.
 */
export const MAINSTREAM_BENCHMARK_MODEL_IDS: string[] = [
  // Fast (5)
  'deepseek-v4.1-flash', // DeepSeek-V4.1-Flash ($0.14 / $0.42)
  'glm-5.3-flash',       // Zhipu GLM 5.3 Flash ($0.12 / $0.38)
  'claude-haiku-5.5',    // Anthropic Claude Haiku 5.5 ($0.10 / $0.50)
  'gpt-6-luna',          // OpenAI GPT-6 Luna ($0.10 / $0.50)
  'qwen3.8-flash',       // Alibaba Qwen3.8 Flash ($0.15 / $0.47)
  // Reasoning (5)
  'deepseek-r1',         // DeepSeek-R1 ($0.55 / $2.19)
  'kimi-k3.1-pro',       // Moonshot Kimi K3.1 Pro ($0.2403 / $8.4023)
  'o3-mini',             // OpenAI o3-mini ($1.10 / $4.40)
  'gemini-4-carbon',     // Google Gemini 4 Carbon ($2.00 / $10.00)
  'claude-fable-5.2',    // Anthropic Claude Fable 5.2 ($8.00 / $40.00)
  // Frontier (6)
  'gemini-4-hydrogen',   // Google Gemini 4 Hydrogen ($1.50 / $7.50)
  'claude-sonnet-5.5',   // Anthropic Claude Sonnet 5.5 ($2.00 / $10.00)
  'gpt-6.2-sol',         // OpenAI GPT-6.2 Sol ($2.00 / $10.00)
  'gemini-4-neon',       // Google Gemini 4 Neon ($3.00 / $15.00)
  'claude-opus-5.5',     // Anthropic Claude Opus 5.5 ($4.00 / $20.00)
  'gpt-6.2-astra',       // OpenAI GPT-6.2 Astra ($8.00 / $40.00)
];

/**
 * Calculates and returns the clean mainstream models for Monthly Net Cost Breakdown,
 * sorted strictly by monthlyNetCost from lowest (e.g. DeepSeek-V4.1-Flash) to highest (e.g. GPT-6.2 Astra).
 */
export function calculateMainstreamModels(
  models: ModelPricingRule[],
  params: SimulationParams,
  selectedProviders: string[] = ['All']
): ModelCostBreakdown[] {
  const modelMap = new Map<string, ModelPricingRule>();
  models.forEach((m) => modelMap.set(m.modelId, m));

  let candidateModels: ModelPricingRule[] = MAINSTREAM_BENCHMARK_MODEL_IDS
    .map((id) => modelMap.get(id))
    .filter((m): m is ModelPricingRule => Boolean(m));

  // If a provider filter is active
  if (!selectedProviders.includes('All')) {
    candidateModels = candidateModels.filter((m) =>
      selectedProviders.includes(m.providerOrg)
    );
    // If the provider filter didn't match the benchmark list (e.g. Meta or Mistral),
    // pick top production models from that provider excluding free/zero
    if (candidateModels.length === 0) {
      candidateModels = models.filter(
        (m) =>
          selectedProviders.includes(m.providerOrg) &&
          m.inputPerM > 0 &&
          !m.modelId.includes(':free') &&
          !m.modelName.includes('(free)')
      );
    }
  }

  return candidateModels
    .map((m) => calculateModelCost(m, params))
    .sort((a, b) => a.monthlyNetCost - b.monthlyNetCost);
}

/**
 * Approximates token count from raw text (characters / word heuristic or 4 chars/token).
 */
export function estimateTokensFromText(text: string): { tokens: number; words: number; chars: number } {
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const tokens = Math.max(1, Math.round(chars / 3.8));
  return { tokens, words, chars };
}
