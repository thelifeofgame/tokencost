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
 * Curated list of high-profile mainstream production benchmark models,
 * ranging from ultra-cost-efficient entry models (GPT-6 Luna) to flagship frontier models (Claude Fable 5.2).
 */
export const MAINSTREAM_BENCHMARK_MODEL_IDS: string[] = [
  'gpt-6-luna',        // OpenAI: GPT-6 Luna ($0.10 / $0.50)
  'deepseek-v3',       // DeepSeek-V3 ($0.27 / $1.10)
  'gpt-4.1-mini',      // OpenAI: GPT-4.1 Mini ($0.40 / $1.60)
  'gemini-2.5-flash',  // Google: Gemini 2.5 Flash ($0.30 / $2.50)
  'deepseek-r1',       // DeepSeek-R1 ($0.55 / $2.19)
  'claude-3-5-haiku',  // Anthropic: Claude 3.5 Haiku ($0.80 / $4.00)
  'gpt-6.1-terra',     // OpenAI: GPT-6.1 Terra ($1.00 / $5.00)
  'claude-haiku-4.5',  // Anthropic: Claude Haiku 4.5 ($1.00 / $5.00)
  'gemini-2.5-pro',    // Google: Gemini 2.5 Pro ($1.25 / $10.00)
  'gpt-6.1-sol',       // OpenAI: GPT-6.1 Sol ($2.00 / $10.00)
  'claude-sonnet-5.5', // Anthropic: Claude Sonnet 5.5 ($2.00 / $10.00)
  'gpt-4o',            // OpenAI: GPT-4o ($2.50 / $10.00)
  'claude-fable-5.2',  // Anthropic: Claude Fable 5.2 ($8.00 / $40.00)
];

/**
 * Calculates and returns the clean mainstream models for Monthly Net Cost Breakdown,
 * sorted strictly by monthlyNetCost from lowest (e.g. GPT-6 Luna) to highest (e.g. Claude Fable 5.2).
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
