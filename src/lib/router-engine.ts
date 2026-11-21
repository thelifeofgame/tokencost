import { ModelPricingRule, SimulationParams, RouterRecommendation } from '@/types/pricing';
import { calculateModelCost } from './calculator-engine';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const OPENROUTER_REF_URL =
  'https://openrouter.ai/?ref=tokencostsai_com&utm_source=tokencostsai_com&utm_medium=smart_router_export&utm_campaign=openrouter_gateway';

function fmtRate(val: number): string {
  if (val === 0) return '$0.00';
  if (val < 0.1) return `$${Number(val.toFixed(4))}`;
  if (Math.round(val * 100) === val * 100) return `$${val.toFixed(2)}`;
  return `$${Number(val.toFixed(4))}`;
}

export function generateRouterRecommendations(
  models: ModelPricingRule[],
  params: SimulationParams,
  customBaseline?: ModelPricingRule
): RouterRecommendation[] {
  const getModel = (id: string): ModelPricingRule =>
    models.find((m) => m.modelId === id) || models[0];

  // November 2026 Flagships & Daily Rate-Drop Models (live from model_pricing_schema.json)
  const gemini4Neon = getModel('gemini-4-neon');
  const gemini4Carbon = getModel('gemini-4-carbon');
  const gpt62Sol = getModel('gpt-6.2-sol');
  const gpt62Astra = getModel('gpt-6.2-astra');
  const claudeOpus55 = getModel('claude-opus-5.5');
  const sonnet55 = getModel('claude-sonnet-5.5');
  const gpt61Terra = getModel('gpt-6.1-terra');

  const deepseekR1 = getModel('deepseek-r1');
  const deepseekV3 = getModel('deepseek-v3');
  const deepseekV4Flash = getModel('deepseek-v4.1-flash');
  const glm53Flash = getModel('glm-5.3-flash');
  const qwen3Coder = getModel('qwen3-coder-30b-a3b-instruct');
  const llama70b = getModel('llama-3.3-70b');

  // Baseline model: defaults to GPT-6.2 Sol or GPT-6.1 Terra / user-selected custom baseline
  const baselineModel = customBaseline || gpt62Sol || gpt61Terra;
  const baselineCost = calculateModelCost(baselineModel, params).monthlyNetCost;

  // 1. Weekend Coding & Flash Arbitrage (Qwen3-Coder-30B + DeepSeek-V4.1-Flash / GLM-5.3-Flash + Gemini 4 Neon)
  const wCodeCost = calculateModelCost(qwen3Coder, params).monthlyNetCost * 0.35;
  const wFlashCost = calculateModelCost(deepseekV4Flash, params).monthlyNetCost * 0.50;
  const wArchCost = calculateModelCost(gemini4Neon, params).monthlyNetCost * 0.15;
  const wTotal = wCodeCost + wFlashCost + wArchCost;
  const wSavings = baselineCost > 0 ? Math.round(((baselineCost - wTotal) / baselineCost) * 100) : 0;

  const weekendCodingFlash: RouterRecommendation = {
    id: 'weekend-coding-flash',
    name: 'Weekend Coding & Flash Arbitrage',
    tagline: 'Lock 53%–84% Flash Drops via One Unified Gateway Key',
    description: `Combines DeepSeek V4.1 Flash (${fmtRate(deepseekV4Flash.inputPerM)}/M, ${fmtRate(deepseekV4Flash.cachedInputPerM)}/M cached), GLM-5.3-Flash (${fmtRate(glm53Flash.outputPerM)}/M out), Qwen3-Coder-30B (${fmtRate(qwen3Coder.inputPerM)}/${fmtRate(qwen3Coder.outputPerM)}), and Gemini 4 Neon (${fmtRate(gemini4Neon.inputPerM)}/${fmtRate(gemini4Neon.outputPerM)}) escalation into a single OpenRouter endpoint for weekend agents and bulk evals.`,
    savingsVsBaseline: wSavings,
    blendedMonthlyCost: wTotal,
    baselineModel,
    baselineCost,
    stages: [
      {
        stageName: 'Repo Coding & Diffs',
        model: qwen3Coder,
        trafficSharePercent: 35,
        purpose: `Execute repository-scale code generation, refactor diffs, and tool calls at -53% drop rates (${fmtRate(qwen3Coder.inputPerM)}/${fmtRate(qwen3Coder.outputPerM)}).`,
      },
      {
        stageName: 'High-Volume Flash & Evals',
        model: deepseekV4Flash,
        trafficSharePercent: 50,
        purpose: `Route bulk classification, test synthesis, and 1M-context RAG via DeepSeek V4.1 Flash (${fmtRate(deepseekV4Flash.cachedInputPerM)}/M cache) with GLM-5.3-Flash (${fmtRate(glm53Flash.outputPerM)}/M out) failover.`,
      },
      {
        stageName: 'Architect Escalation',
        model: gemini4Neon,
        trafficSharePercent: 15,
        purpose: `Escalate complex multi-file architecture reasoning and edge-case debugging to Gemini 4 Neon (${fmtRate(gemini4Neon.inputPerM)}/${fmtRate(gemini4Neon.outputPerM)}) via the same OpenRouter key.`,
      },
    ],
    codeSnippets: {
      litellmYaml: `# Routed via OpenRouter Unified Gateway (${OPENROUTER_BASE_URL})
# One key for DeepSeek V4.1 Flash (-83%), GLM-5.3-Flash (-84% out), Qwen3-Coder-30B (-53%) & Gemini 4 Neon
# Get your API key: ${OPENROUTER_REF_URL}
model_list:
  - model_name: weekend-arbitrage/coding
    litellm_params:
      model: openrouter/qwen/qwen3-coder-30b-a3b-instruct
      api_base: ${OPENROUTER_BASE_URL}
      api_key: os.environ/OPENROUTER_API_KEY
  - model_name: weekend-arbitrage/flash
    litellm_params:
      model: openrouter/deepseek/deepseek-v4.1-flash
      api_base: ${OPENROUTER_BASE_URL}
      api_key: os.environ/OPENROUTER_API_KEY
  - model_name: weekend-arbitrage/flash-fallback
    litellm_params:
      model: openrouter/z-ai/glm-5.3-flash
      api_base: ${OPENROUTER_BASE_URL}
      api_key: os.environ/OPENROUTER_API_KEY
  - model_name: weekend-arbitrage/architect
    litellm_params:
      model: openrouter/google/gemini-4-neon
      api_base: ${OPENROUTER_BASE_URL}
      api_key: os.environ/OPENROUTER_API_KEY

router_settings:
  routing_strategy: cost-based-routing
  fallbacks: [{"weekend-arbitrage/flash": ["weekend-arbitrage/flash-fallback"]}, {"weekend-arbitrage/coding": ["weekend-arbitrage/architect"]}]`,
      vercelAiTs: `import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

// OpenRouter Unified Gateway: single key for DeepSeek, GLM, Qwen & Gemini
// Get key: ${OPENROUTER_REF_URL}
const openrouter = createOpenAI({
  baseURL: '${OPENROUTER_BASE_URL}',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': 'https://tokencostsai.com',
    'X-Title': 'TokenCosts AI Smart Router',
  },
});

export async function weekendArbitrageRoute(
  tier: 'flash' | 'bulk' | 'code' | 'architect',
  prompt: string
) {
  const modelMap = {
    flash: 'deepseek/deepseek-v4.1-flash',       // ${fmtRate(deepseekV4Flash.inputPerM)}/${fmtRate(deepseekV4Flash.outputPerM)} (-83%)
    bulk: 'z-ai/glm-5.3-flash',                  // ${fmtRate(glm53Flash.inputPerM)}/${fmtRate(glm53Flash.outputPerM)} (-84% out)
    code: 'qwen/qwen3-coder-30b-a3b-instruct',   // ${fmtRate(qwen3Coder.inputPerM)}/${fmtRate(qwen3Coder.outputPerM)} (-53%)
    architect: 'google/gemini-4-neon',           // ${fmtRate(gemini4Neon.inputPerM)}/${fmtRate(gemini4Neon.outputPerM)} flagship fallback
  };

  return generateText({ model: openrouter(modelMap[tier]), prompt });
}`,
      pythonSdk: `import os
import openai

# OpenRouter Unified Gateway: 1 key routes all today's 53%-84% flash drops
# Get key: ${OPENROUTER_REF_URL}
client = openai.OpenAI(
    base_url="${OPENROUTER_BASE_URL}",
    api_key=os.environ["OPENROUTER_API_KEY"],
    default_headers={
        "HTTP-Referer": "https://tokencostsai.com",
        "X-Title": "TokenCosts AI Smart Router",
    },
)

response = client.chat.completions.create(
    model="deepseek/deepseek-v4.1-flash",
    extra_body={
        "models": [
            "z-ai/glm-5.3-flash",
            "qwen/qwen3-coder-30b-a3b-instruct",
            "google/gemini-4-neon",
        ]
    },
    messages=[{"role": "user", "content": "Refactor this module and generate unit tests"}],
)`,
    },
  };

  // 2. 2026 Frontier Agentic Hybrid (DeepSeek-R1 + GPT-6.2 Sol + GPT-6.1 Terra / Gemini 4 Neon & GPT-6.2 Astra fallback)
  const fReasonCost = calculateModelCost(deepseekR1, params).monthlyNetCost * 0.15;
  const fSolCost = calculateModelCost(gpt62Sol, params).monthlyNetCost * 0.50;
  const fTerraCost = calculateModelCost(gpt61Terra, params).monthlyNetCost * 0.35;
  const fTotal = fReasonCost + fSolCost + fTerraCost;
  const fSavings = baselineCost > 0 ? Math.round(((baselineCost - fTotal) / baselineCost) * 100) : 0;

  const frontier2026: RouterRecommendation = {
    id: 'frontier-2026',
    name: '2026 Frontier Hybrid',
    tagline: 'Next-Gen November Flagships with 95% Prompt Cache Discounts',
    description: `Deploys OpenAI GPT-6.2 Sol (${fmtRate(gpt62Sol.cachedInputPerM)}/M cached, 1.05M ctx) for core coding & reasoning, GPT-6.1 Terra (${fmtRate(gpt61Terra.cachedInputPerM)}/M cached) for high-speed subtasks, and DeepSeek-R1 for planning—with GPT-6.2 Astra (${fmtRate(gpt62Astra.inputPerM)}/${fmtRate(gpt62Astra.outputPerM)}) & Gemini 4 Neon escalation.`,
    savingsVsBaseline: fSavings,
    blendedMonthlyCost: fTotal,
    baselineModel,
    baselineCost,
    stages: [
      {
        stageName: 'Deep Planning & Architecture',
        model: deepseekR1,
        trafficSharePercent: 15,
        purpose: `Deconstruct complex multi-step goals at ${fmtRate(deepseekR1.inputPerM)}/${fmtRate(deepseekR1.outputPerM)} with verified reasoning chains.`,
      },
      {
        stageName: 'Flagship Agent Execution',
        model: gpt62Sol,
        trafficSharePercent: 50,
        purpose: `Execute code generation and multi-file edits via GPT-6.2 Sol (${fmtRate(gpt62Sol.inputPerM)}/${fmtRate(gpt62Sol.outputPerM)}, ${fmtRate(gpt62Sol.cachedInputPerM)}/M cached).`,
      },
      {
        stageName: 'Fast Sub-agent Routing',
        model: gpt61Terra,
        trafficSharePercent: 35,
        purpose: `Handle fast summarization, intermediate evaluations, and tool calls via 1M-context GPT-6.1 Terra (${fmtRate(gpt61Terra.cachedInputPerM)}/M cached).`,
      },
    ],
    codeSnippets: {
      litellmYaml: `# Routed via OpenRouter Unified Gateway (${OPENROUTER_BASE_URL})
# Flagship stack: DeepSeek-R1 + GPT-6.2 Sol (with GPT-6.2 Astra / Gemini 4 Neon escalation)
# Get your API key: ${OPENROUTER_REF_URL}
model_list:
  - model_name: 2026-frontier/planning
    litellm_params:
      model: openrouter/deepseek/deepseek-r1
      api_base: ${OPENROUTER_BASE_URL}
      api_key: os.environ/OPENROUTER_API_KEY
  - model_name: 2026-frontier/flagship-exec
    litellm_params:
      model: openrouter/openai/gpt-6.2-sol
      api_base: ${OPENROUTER_BASE_URL}
      api_key: os.environ/OPENROUTER_API_KEY
  - model_name: 2026-frontier/sub-agent
    litellm_params:
      model: openrouter/openai/gpt-6.1-terra
      api_base: ${OPENROUTER_BASE_URL}
      api_key: os.environ/OPENROUTER_API_KEY
  - model_name: 2026-frontier/astra-escalation
    litellm_params:
      model: openrouter/openai/gpt-6.2-astra
      api_base: ${OPENROUTER_BASE_URL}
      api_key: os.environ/OPENROUTER_API_KEY

router_settings:
  routing_strategy: usage-based-routing
  fallbacks: [{"2026-frontier/flagship-exec": ["2026-frontier/sub-agent"]}]
  enable_pre_call_checks: true`,
      vercelAiTs: `import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

// OpenRouter Unified Gateway (${OPENROUTER_BASE_URL})
const openrouter = createOpenAI({
  baseURL: '${OPENROUTER_BASE_URL}',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': 'https://tokencostsai.com',
    'X-Title': 'TokenCosts AI Smart Router',
  },
});

export async function frontierAgentRouter({
  stage,
  prompt,
}: {
  stage: 'plan' | 'exec' | 'sub' | 'astra';
  prompt: string;
}) {
  const modelMap = {
    plan: 'deepseek/deepseek-r1',
    exec: 'openai/gpt-6.2-sol',
    sub: 'openai/gpt-6.1-terra',
    astra: 'openai/gpt-6.2-astra',
  };

  return generateText({
    model: openrouter(modelMap[stage] || 'openai/gpt-6.2-sol'),
    prompt,
  });
}`,
      pythonSdk: `import os
import openai

# OpenRouter Unified Gateway: 1 key for GPT-6.2 Sol/Astra, DeepSeek-R1 & Gemini 4 Neon
# Get key: ${OPENROUTER_REF_URL}
client = openai.OpenAI(
    base_url="${OPENROUTER_BASE_URL}",
    api_key=os.environ["OPENROUTER_API_KEY"],
    default_headers={
        "HTTP-Referer": "https://tokencostsai.com",
        "X-Title": "TokenCosts AI Smart Router",
    },
)

response = client.chat.completions.create(
    model="openai/gpt-6.2-sol",
    extra_body={"models": ["google/gemini-4-neon", "openai/gpt-6.1-terra"]},
    messages=[{"role": "user", "content": "Execute agentic architecture workflow"}],
)`,
    },
  };

  // 3. Quality-First Pareto Hybrid (Claude Opus 5.5 / Sonnet 5.5 + GPT-6.1 Terra + DeepSeek-R1)
  const qPlanCost = calculateModelCost(deepseekR1, params).monthlyNetCost * 0.15;
  const qExecCost = calculateModelCost(sonnet55, params).monthlyNetCost * 0.55;
  const qFilterCost = calculateModelCost(gpt61Terra, params).monthlyNetCost * 0.30;
  const qTotal = qPlanCost + qExecCost + qFilterCost;
  const qSavings = baselineCost > 0 ? Math.round(((baselineCost - qTotal) / baselineCost) * 100) : 0;

  const qualityFirst: RouterRecommendation = {
    id: 'quality-first',
    name: 'Quality-First Pareto (Claude 5.5)',
    tagline: 'Drop-In Carbon Migration & High-Reliability Production Engineering',
    description: `Routes high-stakes planning to DeepSeek-R1, code generation to Claude Sonnet 5.5 (${fmtRate(sonnet55.inputPerM)}/${fmtRate(sonnet55.outputPerM)}, ${fmtRate(sonnet55.cachedInputPerM)}/M cached — zero Dec 1 hike vs Gemini 4 Carbon ${fmtRate(gemini4Carbon.inputPerM)}/${fmtRate(gemini4Carbon.outputPerM)}), and Opus 5.5 (${fmtRate(claudeOpus55.inputPerM)}/${fmtRate(claudeOpus55.outputPerM)}) escalation.`,
    savingsVsBaseline: qSavings,
    blendedMonthlyCost: qTotal,
    baselineModel,
    baselineCost,
    stages: [
      {
        stageName: 'Planning & Reasoning',
        model: deepseekR1,
        trafficSharePercent: 15,
        purpose: 'Deconstruct complex multi-step user prompts into actionable tool calling plans.',
      },
      {
        stageName: 'Code & Core Execution',
        model: sonnet55,
        trafficSharePercent: 55,
        purpose: `Execute code generation and artifact writing via Claude Sonnet 5.5 (${fmtRate(sonnet55.cachedInputPerM)}/M cached) with Opus 5.5 fallback.`,
      },
      {
        stageName: 'Filter & Extraction',
        model: gpt61Terra,
        trafficSharePercent: 30,
        purpose: 'Run input classification, guardrails, and structured JSON parsing with 1M context GPT-6.1 Terra.',
      },
    ],
    codeSnippets: {
      litellmYaml: `# Routed via OpenRouter Unified Gateway (${OPENROUTER_BASE_URL})
# Avoid Dec 1 Gemini 4 Carbon 2x hike with Claude Sonnet 5.5 & Opus 5.5
# Get your API key: ${OPENROUTER_REF_URL}
model_list:
  - model_name: cost-router/planning
    litellm_params:
      model: openrouter/deepseek/deepseek-r1
      api_base: ${OPENROUTER_BASE_URL}
      api_key: os.environ/OPENROUTER_API_KEY
  - model_name: cost-router/execution
    litellm_params:
      model: openrouter/anthropic/claude-sonnet-5.5
      api_base: ${OPENROUTER_BASE_URL}
      api_key: os.environ/OPENROUTER_API_KEY
  - model_name: cost-router/opus-escalation
    litellm_params:
      model: openrouter/anthropic/claude-opus-5.5
      api_base: ${OPENROUTER_BASE_URL}
      api_key: os.environ/OPENROUTER_API_KEY
  - model_name: cost-router/extraction
    litellm_params:
      model: openrouter/openai/gpt-6.1-terra
      api_base: ${OPENROUTER_BASE_URL}
      api_key: os.environ/OPENROUTER_API_KEY

router_settings:
  routing_strategy: usage-based-routing
  fallbacks: [{"cost-router/execution": ["cost-router/opus-escalation", "cost-router/extraction"]}]
  enable_pre_call_checks: true`,
      vercelAiTs: `import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const openrouter = createOpenAI({
  baseURL: '${OPENROUTER_BASE_URL}',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': 'https://tokencostsai.com',
    'X-Title': 'TokenCosts AI Smart Router',
  },
});

export async function smartRouteExecution({
  taskType,
  prompt,
}: {
  taskType: 'plan' | 'code' | 'opus' | 'extract';
  prompt: string;
}) {
  const modelMap = {
    plan: 'deepseek/deepseek-r1',
    code: 'anthropic/claude-sonnet-5.5',
    opus: 'anthropic/claude-opus-5.5',
    extract: 'openai/gpt-6.1-terra',
  };

  return generateText({
    model: openrouter(modelMap[taskType] || 'anthropic/claude-sonnet-5.5'),
    prompt,
  });
}`,
      pythonSdk: `import os
import openai

# OpenRouter Unified Gateway: Claude Sonnet 5.5 + Opus 5.5 + DeepSeek-R1
# Get key: ${OPENROUTER_REF_URL}
client = openai.OpenAI(
    base_url="${OPENROUTER_BASE_URL}",
    api_key=os.environ["OPENROUTER_API_KEY"],
    default_headers={
        "HTTP-Referer": "https://tokencostsai.com",
        "X-Title": "TokenCosts AI Smart Router",
    },
)

response = client.chat.completions.create(
    model="anthropic/claude-sonnet-5.5",
    extra_body={"models": ["anthropic/claude-opus-5.5", "openai/gpt-6.1-terra"]},
    messages=[{"role": "user", "content": "Analyze and refactor this microservice"}],
)`,
    },
  };

  // 4. Maximum Cost-Cutting Routing (DeepSeek-V4.1-Flash + V3 + R1)
  const cPlanCost = calculateModelCost(deepseekR1, params).monthlyNetCost * 0.15;
  const cExecCost = calculateModelCost(deepseekV3, params).monthlyNetCost * 0.45;
  const cExtCost = calculateModelCost(deepseekV4Flash, params).monthlyNetCost * 0.40;
  const cTotal = cPlanCost + cExecCost + cExtCost;
  const cSavings = baselineCost > 0 ? Math.round(((baselineCost - cTotal) / baselineCost) * 100) : 0;

  const maxSavings: RouterRecommendation = {
    id: 'max-savings',
    name: 'Max Cost-Cutting (DeepSeek)',
    tagline: 'Slash Bills by 85%-95% with Live $0.001/M Cached Floor',
    description: `Leverages DeepSeek-R1 for reasoning, DeepSeek-V3 (${fmtRate(deepseekV3.inputPerM)}/${fmtRate(deepseekV3.outputPerM)}) for general synthesis, and DeepSeek-V4.1-Flash (${fmtRate(deepseekV4Flash.inputPerM)}/${fmtRate(deepseekV4Flash.outputPerM)}, ${fmtRate(deepseekV4Flash.cachedInputPerM)}/M cached) for ultra-cheap sub-tasks.`,
    savingsVsBaseline: cSavings,
    blendedMonthlyCost: cTotal,
    baselineModel,
    baselineCost,
    stages: [
      {
        stageName: 'Deep Reasoning',
        model: deepseekR1,
        trafficSharePercent: 15,
        purpose: 'Deliver o1-caliber reasoning benchmarks at 1/27th of the cost.',
      },
      {
        stageName: 'General Synthesis',
        model: deepseekV3,
        trafficSharePercent: 45,
        purpose: `Handle standard agent conversations with ${fmtRate(deepseekV3.inputPerM)}/1M ground-floor rates.`,
      },
      {
        stageName: 'Ultra-Cheap Ground Floor',
        model: deepseekV4Flash,
        trafficSharePercent: 40,
        purpose: `Process large 1M contexts with ${fmtRate(deepseekV4Flash.inputPerM)}/1M input and ${fmtRate(deepseekV4Flash.cachedInputPerM)}/M cached read.`,
      },
    ],
    codeSnippets: {
      litellmYaml: `# Routed via OpenRouter Unified Gateway (${OPENROUTER_BASE_URL})
# Live DeepSeek V4.1 Flash (${fmtRate(deepseekV4Flash.inputPerM)}/${fmtRate(deepseekV4Flash.outputPerM)}, ${fmtRate(deepseekV4Flash.cachedInputPerM)}/M cached)
# Get your API key: ${OPENROUTER_REF_URL}
model_list:
  - model_name: max-savings/reasoning
    litellm_params:
      model: openrouter/deepseek/deepseek-r1
      api_base: ${OPENROUTER_BASE_URL}
      api_key: os.environ/OPENROUTER_API_KEY
  - model_name: max-savings/chat
    litellm_params:
      model: openrouter/deepseek/deepseek-chat
      api_base: ${OPENROUTER_BASE_URL}
      api_key: os.environ/OPENROUTER_API_KEY
  - model_name: max-savings/flash
    litellm_params:
      model: openrouter/deepseek/deepseek-v4.1-flash
      api_base: ${OPENROUTER_BASE_URL}
      api_key: os.environ/OPENROUTER_API_KEY

router_settings:
  routing_strategy: lowest-cost`,
      vercelAiTs: `import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const openrouter = createOpenAI({
  baseURL: '${OPENROUTER_BASE_URL}',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': 'https://tokencostsai.com',
    'X-Title': 'TokenCosts AI Smart Router',
  },
});

export async function costCuttingRouter({ prompt, isFlash = false }: { prompt: string; isFlash?: boolean }) {
  const selectedModel = isFlash ? 'deepseek/deepseek-v4.1-flash' : 'deepseek/deepseek-chat';
  return generateText({ model: openrouter(selectedModel), prompt });
}`,
      pythonSdk: `import os
import openai

# OpenRouter Unified Gateway: ${fmtRate(deepseekV4Flash.inputPerM)}/${fmtRate(deepseekV4Flash.outputPerM)} (${fmtRate(deepseekV4Flash.cachedInputPerM)}/M cached)
# Get key: ${OPENROUTER_REF_URL}
client = openai.OpenAI(
    base_url="${OPENROUTER_BASE_URL}",
    api_key=os.environ["OPENROUTER_API_KEY"],
    default_headers={
        "HTTP-Referer": "https://tokencostsai.com",
        "X-Title": "TokenCosts AI Smart Router",
    },
)

response = client.chat.completions.create(
    model="deepseek/deepseek-v4.1-flash",
    messages=[{"role": "user", "content": "Clean this structured dataset"}],
    stream=False,
)`,
    },
  };

  // 5. Ultra-Low Latency Groq LPU Strategy
  const lPlanCost = calculateModelCost(deepseekR1, params).monthlyNetCost * 0.15;
  const lExecCost = calculateModelCost(llama70b, params).monthlyNetCost * 0.85;
  const lTotal = lPlanCost + lExecCost;
  const lSavings = baselineCost > 0 ? Math.round(((baselineCost - lTotal) / baselineCost) * 100) : 0;

  const lowLatency: RouterRecommendation = {
    id: 'ultra-speed',
    name: 'Real-Time Streaming (Groq LPU)',
    tagline: '420+ Tokens/sec for Instant Voice & Interactive Agents',
    description: 'Pair Groq LPU hardware acceleration with DeepSeek-R1 planning via OpenRouter provider pinning for sub-200ms latency.',
    savingsVsBaseline: lSavings,
    blendedMonthlyCost: lTotal,
    baselineModel,
    baselineCost,
    stages: [
      {
        stageName: 'Strategic Planning',
        model: deepseekR1,
        trafficSharePercent: 15,
        purpose: 'Formulate conversational intentions and tool parameters.',
      },
      {
        stageName: 'Groq LPU Generation',
        model: llama70b,
        trafficSharePercent: 85,
        purpose: 'Stream tokens at 420+ t/s for fluid human-like speech and instant feedback.',
      },
    ],
    codeSnippets: {
      litellmYaml: `# Routed via OpenRouter Unified Gateway (${OPENROUTER_BASE_URL}) with Groq LPU provider pinning
# Get your API key: ${OPENROUTER_REF_URL}
model_list:
  - model_name: voice-router/planning
    litellm_params:
      model: openrouter/deepseek/deepseek-r1
      api_base: ${OPENROUTER_BASE_URL}
      api_key: os.environ/OPENROUTER_API_KEY
  - model_name: voice-router/fast-stream
    litellm_params:
      model: openrouter/meta-llama/llama-3.3-70b-instruct
      api_base: ${OPENROUTER_BASE_URL}
      api_key: os.environ/OPENROUTER_API_KEY

router_settings:
  routing_strategy: latency-cost-balanced`,
      vercelAiTs: `import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

const openrouter = createOpenAI({
  baseURL: '${OPENROUTER_BASE_URL}',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': 'https://tokencostsai.com',
    'X-Title': 'TokenCosts AI Smart Router',
  },
});

export async function voiceStreamingRoute(prompt: string) {
  return streamText({
    model: openrouter('meta-llama/llama-3.3-70b-instruct'),
    prompt,
  });
}`,
      pythonSdk: `import os
import openai

# OpenRouter Unified Gateway targeting Groq LPU provider
# Get key: ${OPENROUTER_REF_URL}
client = openai.OpenAI(
    base_url="${OPENROUTER_BASE_URL}",
    api_key=os.environ["OPENROUTER_API_KEY"],
    default_headers={
        "HTTP-Referer": "https://tokencostsai.com",
        "X-Title": "TokenCosts AI Smart Router",
    },
)

response = client.chat.completions.create(
    model="meta-llama/llama-3.3-70b-instruct",
    extra_body={"provider": {"order": ["Groq"]}},
    messages=[{"role": "user", "content": "Generate instant voice response"}],
    stream=True,
)`,
    },
  };

  return [weekendCodingFlash, frontier2026, qualityFirst, maxSavings, lowLatency];
}
