import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'src', 'data');
const PUBLIC_DIR = path.join(ROOT, 'public');

const pricingSchema = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, 'model_pricing_schema.json'), 'utf8')
);
const radarEvents = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, 'market_radar_events.json'), 'utf8')
);
const trendingComparisons = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, 'trending_comparisons.json'), 'utf8')
);
const harnessTools = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, 'harness_tools.json'), 'utf8')
);

const models = pricingSchema.models || [];
const modelMap = new Map(models.map((m) => [m.modelId, m]));

const totalModels = models.length;
const totalProviders = Array.isArray(pricingSchema.providers)
  ? pricingSchema.providers.length
  : new Set(models.map((m) => m.providerOrg)).size;
const providerOrgsCount = new Set(models.map((m) => m.providerOrg)).size;
const lastUpdatedFull = pricingSchema.lastUpdated || new Date().toISOString();
const lastUpdatedDate = String(lastUpdatedFull).slice(0, 10);

function fmtRate(n) {
  if (typeof n !== 'number') return 'N/A';
  if (n === 0) return '$0';
  if (n < 0.1) return `$${Number(n.toFixed(4))}`;
  if (n < 1 && Math.round(n * 100) !== n * 100) return `$${Number(n.toFixed(4))}`;
  return `$${n.toFixed(2)}`;
}

// Top 24 high-intent models specified in data audit
const TOP_24_IDS = [
  // 11月前沿旗舰与多模态主力 (7)
  'gpt-6.2-astra',
  'gpt-6.2-sol',
  'gemini-4-neon',
  'gemini-4-carbon',
  'claude-opus-5.5',
  'claude-sonnet-5.5',
  'solar-mini-4-5',
  // 今日降价榜与周末 Coding / Flash 套利 (6)
  'deepseek-v4.1-flash',
  'glm-5.3-flash',
  'qwen3-coder-30b-a3b-instruct',
  'minimax-m3.1-flash',
  'gpt-oss-120b',
  'gpt-6.1-terra',
  // 经典生产基准与高速推理 (11)
  'deepseek-r1',
  'deepseek-v3',
  'llama-3.3-70b',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gpt-4o',
  'gpt-4o-mini',
  'o1',
  'o3-mini',
  'claude-3-5-sonnet',
  'claude-3-5-haiku',
];

function buildPricingNote(m) {
  if (m.modelId === 'solar-mini-4-5') {
    return `Preview floor ${fmtRate(m.inputPerM)}/${fmtRate(m.outputPerM)} (${fmtRate(m.cachedInputPerM)}/M cached, 524K ctx) through Nov 30, 2026.`;
  }
  if (m.modelId === 'gemini-4-carbon' || m.modelId === 'gemini-4-argon') {
    return 'Promotional $2.00/$10.00 expires Nov 30, 2026; doubles +100% to $4.00/$20.00 on Dec 1, 2026.';
  }
  if (m.modelId === 'minimax-m3.1-flash') {
    return 'Peak (01:00-15:00 UTC) $0.15/$0.60 ($0.015 cached) vs Off-Peak (15:00-01:00 UTC, 50% off) $0.075/$0.30 ($0.0075 cached).';
  }
  if (m.modelId === 'deepseek-v4.1-flash') {
    return `Live OpenRouter floor ${fmtRate(m.inputPerM)}/${fmtRate(m.outputPerM)} (${fmtRate(m.cachedInputPerM)}/M cached, -${Math.round(m.cacheDiscountPercent)}% cache); official on-demand Peak $0.30/$1.20, Off-Peak $0.15/$0.60.`;
  }
  if (m.modelId === 'glm-5.3-flash') {
    return `Live OpenRouter rates ${fmtRate(m.inputPerM)}/${fmtRate(m.outputPerM)} (${fmtRate(m.cachedInputPerM)}/M cached, -${Math.round(m.cacheDiscountPercent)}% cache, -${Math.round(m.batchDiscountPercent)}% batch).`;
  }
  if (m.modelId === 'qwen3-coder-30b-a3b-instruct') {
    return `Live OpenRouter rate drop (-53.3% to ${fmtRate(m.inputPerM)}/M input, ${fmtRate(m.outputPerM)}/M output).`;
  }
  return null;
}

const topModels = TOP_24_IDS.map((id) => modelMap.get(id))
  .filter(Boolean)
  .map((m) => {
    const note = buildPricingNote(m);
    const entry = {
      id: m.modelId,
      name: m.modelName,
      provider: m.providerOrg,
      inputPerM: m.inputPerM,
      outputPerM: m.outputPerM,
      cachedInputPerM: m.cachedInputPerM,
      cacheDiscountPercent: m.cacheDiscountPercent,
      batchDiscountPercent: m.batchDiscountPercent,
      contextWindow: m.contextWindow,
      maxOutputTokens: m.maxOutputTokens,
      latencyTier: m.latencyTier,
      intelligenceIndex: m.benchmarks?.intelligenceIndex ?? null,
      codingIndex: m.benchmarks?.codingIndex ?? null,
      arenaElo: m.benchmarks?.arenaElo ?? null,
      throughputTps: m.performance?.throughputTokensPerSec ?? null,
      ttftSec: m.performance?.timeToFirstTokenSec ?? null,
    };
    if (note) {
      entry.pricingNote = note;
    }
    return entry;
  });

const alerts = (radarEvents.events || [])
  .filter((ev) => ev.isFeatured)
  .map((ev) => ({
    id: ev.id,
    badgeText: ev.badgeText,
    title: ev.title,
    highlight: ev.highlight,
    primaryUrl: ev.topicLink || ev.ctaLink,
    secondaryUrl: ev.topicLink ? ev.ctaLink : null,
  }));

const topComparisons = (trendingComparisons.comparisons || [])
  .slice(0, 12)
  .map((c) => ({
    rank: c.rank,
    slug: c.slug,
    category: c.category,
    badge: c.badge,
    headline: c.headline,
    cheaperModel: c.metricsDelta?.cheaperModel ?? null,
    costReductionPercent: c.metricsDelta?.costReductionPercent ?? null,
    url: `/compare/${c.slug}/`,
  }));

const pricingSummary = {
  generatedAt: lastUpdatedFull,
  lastUpdated: lastUpdatedFull,
  totalModels,
  totalProviders,
  providerOrgsCount,
  unit: pricingSchema.unit || 'per_1m_tokens',
  currency: pricingSchema.currency || 'USD',
  alerts,
  topModels,
  topComparisons,
  endpoints: {
    calculator: '/calculator/{modelId}/',
    compare: '/compare/{slug}/',
    model: '/models/{modelId}/',
    deals: '/deals/',
    llmsTxt: '/llms.txt',
  },
};

fs.writeFileSync(
  path.join(PUBLIC_DIR, 'pricing-summary.json'),
  JSON.stringify(pricingSummary, null, 2) + '\n',
  'utf8'
);

const solarMini = modelMap.get('solar-mini-4-5');
const dsFlash = modelMap.get('deepseek-v4.1-flash');
const glmFlash = modelMap.get('glm-5.3-flash');
const gptTerra = modelMap.get('gpt-6.1-terra');
const dsR1 = modelMap.get('deepseek-r1');
const o3Mini = modelMap.get('o3-mini');

const solarIn = fmtRate(solarMini?.inputPerM ?? 0.01);
const solarOut = fmtRate(solarMini?.outputPerM ?? 0.04);
const solarCached = fmtRate(solarMini?.cachedInputPerM ?? 0.001);
const solarCachePct = Math.round(solarMini?.cacheDiscountPercent ?? 90);
const solarCtxK = Math.round((solarMini?.contextWindow ?? 524288) / 1024);

const dsIn = fmtRate(dsFlash?.inputPerM ?? 0.14);
const dsOut = fmtRate(dsFlash?.outputPerM ?? 0.42);
const dsCached = fmtRate(dsFlash?.cachedInputPerM ?? 0.0042);
const dsCachePct = Math.round(dsFlash?.cacheDiscountPercent ?? 97);
const dsBatchPct = Math.round(dsFlash?.batchDiscountPercent ?? 64.29);

const glmIn = fmtRate(glmFlash?.inputPerM ?? 0.12);
const glmOut = fmtRate(glmFlash?.outputPerM ?? 0.38);
const glmCached = fmtRate(glmFlash?.cachedInputPerM ?? 0.02);
const glmCachePct = Math.round(glmFlash?.cacheDiscountPercent ?? 83.33);
const glmBatchPct = Math.round(glmFlash?.batchDiscountPercent ?? 80.83);

const terraIn = fmtRate(gptTerra?.inputPerM ?? 1.0);
const terraOut = fmtRate(gptTerra?.outputPerM ?? 5.0);
const r1In = fmtRate(dsR1?.inputPerM ?? 0.55);
const r1Out = fmtRate(dsR1?.outputPerM ?? 2.19);
const o3MiniIn = fmtRate(o3Mini?.inputPerM ?? 1.1);
const o3MiniOut = fmtRate(o3Mini?.outputPerM ?? 4.4);

const compMap = new Map((trendingComparisons.comparisons || []).map((c) => [c.slug, c]));
const flashVsTerraPct = compMap.get('deepseek-v4.1-flash-vs-gpt-6.1-terra')?.metricsDelta?.costReductionPercent ?? 89.2;
const flashVsLlamaPct = compMap.get('deepseek-v4.1-flash-vs-llama-3.3-70b')?.metricsDelta?.costReductionPercent ?? 65.0;

const dailyHighlights = [
  `Upstage Solar Mini 4.5 (${solarIn}/${solarOut}, ${solarCtxK}K ctx, -${solarCachePct}% cache to ${solarCached})`,
  `DeepSeek V4.1 Flash (${dsIn}/${dsOut}, -${dsCachePct}% cache ${dsCached}, -${dsBatchPct}% batch)`,
  `GLM-5.3-Flash (${glmIn}/${glmOut}, -${glmCachePct}% cache ${glmCached}, -${glmBatchPct}% batch)`,
].join('; ');

const toolsList = harnessTools.tools || [];
const harnessMinMult = toolsList.length
  ? Math.min(...toolsList.map((t) => t.tokenMultiplierMin)).toFixed(1)
  : '1.2';
const harnessMaxMult = toolsList.length
  ? Math.max(...toolsList.map((t) => t.tokenMultiplierMax)).toFixed(1)
  : '3.8';

const harnessLines = toolsList.map((tool) => {
  const overhead = tool.basePromptOverheadTokens ?? tool.baseSystemPromptTokens ?? 0;
  const cleanTagline = String(tool.tagline || '').replace(/\.+$/, '');
  return `- [${tool.name} Token Cost & BYOK Guide](https://tokencostsai.com/harness/${tool.slug}/): ${tool.tokenMultiplierMin.toFixed(1)}x–${tool.tokenMultiplierMax.toFixed(1)}x multiplier (~${overhead.toLocaleString('en-US')} token overhead) — ${cleanTagline}.`;
});

const llmsTxt = `# TokenCosts AI (tokencostsai.com)

> Real-time LLM API pricing tracker, Prompt Caching & Batch 50% cost simulator, and Coding Agent token multiplier directory covering ${totalModels} frontier and open-weight models across ${providerOrgsCount} provider organizations (${totalProviders} core labs).

TokenCosts AI normalizes per-1M-token input, output, cached-read, cache-write, and asynchronous batch rates in USD alongside context windows, throughput (tokens/sec), TTFT latency, and benchmark ELO scores. For machine-readable lookups, AI agents and automated FinOps pipelines should fetch the lightweight structured catalog at https://tokencostsai.com/pricing-summary.json (synced daily from verified vendor rate cards; last updated ${lastUpdatedDate}).

Current market highlights (${lastUpdatedDate}): ${dailyHighlights}.

## Authoritative Data & API Endpoints

- [Structured Pricing Summary JSON](https://tokencostsai.com/pricing-summary.json): Lightweight machine-readable JSON feed of top benchmarked models across all ${totalModels} tracked LLMs with normalized input, output, cached read, batch discount, and context window fields.
- [Full Model Pricing Directory](https://tokencostsai.com/models/): Searchable, sortable catalog of ${totalModels} LLMs with provider direct vs. gateway rates and live latency metrics.
- [Interactive Token & Caching Cost Calculator](https://tokencostsai.com/calculator/): Simulate monthly spend with 95%+ Prompt Caching hit ratios, 50% Batch API offloading, and tiered long-context escalation.
- [Official AI Deals & Billing Changes Watch](https://tokencostsai.com/deals/): Daily-verified official Black Friday promos, anti-reseller policy disclosures, Mistral Vibe Pro credit removals, and upcoming Nov 30 / Dec 1 API pricing cliffs & endpoint retirements across 12 vendors.
- [Upstage Solar Mini 4.5 Live Cost Calculator](https://tokencostsai.com/calculator/solar-mini-4-5/): Ultra-low-floor 35B/3B-active MoE (${solarIn}/M input, ${solarOut}/M output, ${solarCached}/M cached read at ${solarCachePct}% off, ${solarCtxK}K context) for high-volume agent routing and classification workloads.
- [Developer SDK & LiteLLM Integration Guide](https://tokencostsai.com/developers/): Ready-to-run LiteLLM YAML, Vercel AI SDK, and OpenAI-compatible Python router configs plus embeddable SVG pricing badges.

## High-Intent Pricing & Migration Guides

- [Gemini 4 Carbon Dec 1 Price Hike (2x) & Azure o3 Migration Guide](https://tokencostsai.com/pricing/gemini-4-carbon-dec-1-migration-guide/): Deadline playbook before Gemini 4 Carbon & Argon double from $2/$10 to $4/$20 on Dec 1, 2026, covering drop-in replacements (Claude Sonnet 5.5, GPT-6.2 Sol, DeepSeek-R1, DeepSeek-V4.1-Flash).
- [Real-Time Voice & World Model API Costs (Genie 4 vs GPT-Live-1.1)](https://tokencostsai.com/pricing/realtime-voice-world-model-api-costs/): Unit-economics breakdown of Google Genie 4 ($0.10/sec, $6.05/min) and OpenAI GPT-Live-1.1 WebRTC Standby (-60% idle cost to $0.02/min).
- [Cheapest LLM API Providers in 2026](https://tokencostsai.com/pricing/cheapest-llm-api-providers/): Ranked floor-rate leaderboard across sub-dollar flash models, open-weight MoE endpoints, and aggregated gateways.
- [The Ultimate Prompt Caching Cost Guide](https://tokencostsai.com/pricing/prompt-caching-cost-guide/): Break-even math on Anthropic cache-write surcharges vs. zero-surcharge caching on OpenAI, Google Gemini, and DeepSeek (${dsCached}/M).
- [Best Coding Models & Price-Performance Index](https://tokencostsai.com/pricing/best-coding-models-pricing/): Cost-adjusted coding ELO rankings across Gemini 4 Neon, Claude Sonnet 5.5, GPT-6.2 Sol, and Qwen3-Coder-30B.
- [Batch API 50% Off Comparison](https://tokencostsai.com/pricing/batch-api-discount-comparison/): Asynchronous 24-hour queue savings across OpenAI, Anthropic, and Google Gemini for evals and ETL pipelines.

## Official Deals, Deprecations & Nov 30 Deadlines

- [Black Friday Official Deals & Billing Watch (Last verified ${lastUpdatedDate})](https://tokencostsai.com/deals/): Primary-domain-only audit of active official vendor promos vs. "No Official BF Promo" transparency, plus Mistral Vibe Pro bundled API credit removal and Dec 1 price hike alerts.
- [Nov 30 Deadline: Gemini 4 Carbon/Argon 2x Hike & OpenAI Endpoints Shutdown](https://tokencostsai.com/pricing/gemini-4-carbon-dec-1-migration-guide/): Migrate before Nov 30, 2026 when Gemini 4 Carbon/Argon double from $2/$10 to $4/$20, \`gemini-2.5-pro/flash\` auto-route on Dec 1, and OpenAI \`/v1/prompts\`, Evals API, and Agent Builder sunset.
- [Sub-Cent Frontier Alternative: Upstage Solar Mini 4.5 (${solarIn}/${solarOut})](https://tokencostsai.com/models/solar-mini-4-5/): ${solarCtxK}K-context 3B-active MoE with ${solarCachePct}% prompt cache discount (${solarCached}/M cached read) and 145 t/s throughput — available via [OpenRouter](https://openrouter.ai/models/upstage/solar-mini-4-5?ref=tokencostsai_com).

## Coding Agent & Harness Benchmarks

- [Coding Agent Harness Cost Directory](https://tokencostsai.com/harness/): Measured real-world token multipliers (${harnessMinMult}x–${harnessMaxMult}x), system prompt overhead, and BYOK cost optimization across ${toolsList.length} AI coding tools.
${harnessLines.join('\n')}

## Top Model Comparisons

- [DeepSeek-V4.1-Flash vs GPT-6.1 Terra](https://tokencostsai.com/compare/deepseek-v4.1-flash-vs-gpt-6.1-terra/): ${flashVsTerraPct}% cost reduction (${dsIn}/${dsOut} vs ${terraIn}/${terraOut}) with ${dsCached}/M cached reads.
- [DeepSeek-V4.1-Flash vs Groq Llama 3.3 70B](https://tokencostsai.com/compare/deepseek-v4.1-flash-vs-llama-3.3-70b/): ${flashVsLlamaPct}% bill savings and ${dsCachePct}% cache discount vs. 420 tokens/sec LPU throughput.
- [Gemini 4 Carbon vs Claude Sonnet 5.5](https://tokencostsai.com/compare/gemini-4-carbon-vs-claude-sonnet-5.5/): $2/$10 parity today before Carbon doubles to $4/$20 on Dec 1, 2026.
- [Gemini 4 Neon vs GPT-6.2 Sol](https://tokencostsai.com/compare/gemini-4-neon-vs-gpt-6.2-sol/): 2026 flagship coding & reasoning cost-performance shootout ($3/$15 vs $2/$10).
- [GPT-6.2 Astra vs Claude Opus 5.5](https://tokencostsai.com/compare/gpt-6.2-astra-vs-claude-opus-5.5/): Peak frontier intelligence vs. enterprise 1M-context unit economics.
- [DeepSeek-R1 vs OpenAI o3-mini](https://tokencostsai.com/compare/deepseek-r1-vs-o3-mini/): 50.1% reasoning cost cut (${r1In}/${r1Out} vs ${o3MiniIn}/${o3MiniOut}) for teams migrating off retired Azure o3/o4-mini.
- [DeepSeek-R1 vs OpenAI o1](https://tokencostsai.com/compare/deepseek-r1-vs-openai-o1/): 96% reasoning cost reduction guide for high-depth chain-of-thought workloads.
`;

fs.writeFileSync(path.join(PUBLIC_DIR, 'llms.txt'), llmsTxt, 'utf8');

console.log(
  `[generate-ai-feeds] Generated pricing-summary.json (${topModels.length} topModels, ${totalModels} totalModels) and llms.txt (lastUpdated: ${lastUpdatedDate})`
);
