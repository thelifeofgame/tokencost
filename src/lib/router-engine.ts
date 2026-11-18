import { ModelPricingRule, SimulationParams, RouterRecommendation } from '@/types/pricing';
import { calculateModelCost } from './calculator-engine';

export function generateRouterRecommendations(
  models: ModelPricingRule[],
  params: SimulationParams,
  customBaseline?: ModelPricingRule
): RouterRecommendation[] {
  const getModel = (id: string): ModelPricingRule =>
    models.find((m) => m.modelId === id) || models[0];

  const gpt61Sol = getModel('gpt-6.1-sol');
  const gpt61Terra = getModel('gpt-6.1-terra');
  const sonnet55 = getModel('claude-sonnet-5.5');
  const deepseekV3 = getModel('deepseek-v3');
  const deepseekR1 = getModel('deepseek-r1');
  const deepseekV4Flash = getModel('deepseek-v4.1-flash');
  const llama70b = getModel('llama-3.3-70b');

  // Baseline model: defaults to GPT-6.1 Terra or user-selected custom baseline
  const baselineModel = customBaseline || gpt61Terra;
  const baselineCost = calculateModelCost(baselineModel, params).monthlyNetCost;

  // 1. 2026 Frontier Agentic Hybrid (GPT-6.1 Sol + GPT-6.1 Terra + DeepSeek-R1)
  const fReasonCost = calculateModelCost(deepseekR1, params).monthlyNetCost * 0.15;
  const fSolCost = calculateModelCost(gpt61Sol, params).monthlyNetCost * 0.50;
  const fTerraCost = calculateModelCost(gpt61Terra, params).monthlyNetCost * 0.35;
  const fTotal = fReasonCost + fSolCost + fTerraCost;
  const fSavings = baselineCost > 0 ? Math.round(((baselineCost - fTotal) / baselineCost) * 100) : 0;

  const frontier2026: RouterRecommendation = {
    id: 'frontier-2026',
    name: '2026 Frontier Agentic Hybrid (GPT-6.1 Sol + Terra)',
    tagline: 'Next-Gen Agentic Architecture with 95% Prompt Cache Discounts',
    description: 'Deploys OpenAI GPT-6.1 Sol for core coding & reasoning ($0.10/M cached), GPT-6.1 Terra for high-speed subtasks ($0.05/M cached), and DeepSeek-R1 for complex planning.',
    savingsVsBaseline: fSavings,
    blendedMonthlyCost: fTotal,
    baselineModel: baselineModel,
    baselineCost: baselineCost,
    stages: [
      {
        stageName: 'Deep Planning & Architecture',
        model: deepseekR1,
        trafficSharePercent: 15,
        purpose: 'Deconstruct complex multi-step goals into verified execution sub-plans.',
      },
      {
        stageName: 'Flagship Agent Execution',
        model: gpt61Sol,
        trafficSharePercent: 50,
        purpose: 'Execute code generation, refactoring, and multi-file edits via GPT-6.1 Sol with 95% prompt cache discount.',
      },
      {
        stageName: 'Fast Sub-agent Routing',
        model: gpt61Terra,
        trafficSharePercent: 35,
        purpose: 'Handle fast summarization, intermediate evaluations, and tool calls via 1M-context GPT-6.1 Terra.',
      },
    ],
    codeSnippets: {
      litellmYaml: `model_list:
  - model_name: 2026-frontier/planning
    litellm_params:
      model: deepseek/deepseek-reasoner
      api_base: https://api.deepseek.com
  - model_name: 2026-frontier/flagship-exec
    litellm_params:
      model: openai/gpt-6.1-sol
  - model_name: 2026-frontier/sub-agent
    litellm_params:
      model: openai/gpt-6.1-terra

router_settings:
  routing_strategy: usage-based-routing
  fallbacks: [{"2026-frontier/flagship-exec": ["2026-frontier/sub-agent"]}]
  enable_pre_call_checks: true`,
      vercelAiTs: `import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function frontierAgentRouter({ stage, prompt }: { stage: 'plan' | 'exec' | 'sub', prompt: string }) {
  const modelMap = {
    plan: 'deepseek-reasoner',
    exec: 'gpt-6.1-sol',
    sub: 'gpt-6.1-terra',
  };

  return await generateText({
    model: openai(modelMap[stage] || 'gpt-6.1-terra'),
    prompt,
  });
}`,
      pythonSdk: `import openai

client = openai.OpenAI(base_url="https://api.tokencostsai.com/v1", api_key="YOUR_TOKEN")

# Dynamic smart routing according to complexity header
response = client.chat.completions.create(
    model="tokencost-2026-frontier",
    messages=[{"role": "user", "content": "Execute agentic architecture workflow"}],
    extra_headers={"X-Router-Stage": "exec"}
)`,
    },
  };

  // 2. Quality-First Pareto Hybrid (Claude Sonnet 5.5 + GPT-6.1 Terra)
  const qPlanCost = calculateModelCost(deepseekR1, params).monthlyNetCost * 0.15;
  const qExecCost = calculateModelCost(sonnet55, params).monthlyNetCost * 0.55;
  const qFilterCost = calculateModelCost(gpt61Terra, params).monthlyNetCost * 0.30;
  const qTotal = qPlanCost + qExecCost + qFilterCost;
  const qSavings = baselineCost > 0 ? Math.round(((baselineCost - qTotal) / baselineCost) * 100) : 0;

  const qualityFirst: RouterRecommendation = {
    id: 'quality-first',
    name: 'Quality-First Pareto Hybrid (Claude 5.5 + Terra)',
    tagline: 'Best for Complex Agents & Production Engineering',
    description: 'Routes high-stakes planning to DeepSeek-R1, code generation to Claude Sonnet 5.5, and rapid verification to GPT-6.1 Terra.',
    savingsVsBaseline: qSavings,
    blendedMonthlyCost: qTotal,
    baselineModel: baselineModel,
    baselineCost: baselineCost,
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
        purpose: 'Execute code generation, artifact writing, and high-fidelity responses via Claude Sonnet 5.5.',
      },
      {
        stageName: 'Filter & Extraction',
        model: gpt61Terra,
        trafficSharePercent: 30,
        purpose: 'Run input classification, guardrails, and structured JSON parsing with 1M context GPT-6.1 Terra.',
      },
    ],
    codeSnippets: {
      litellmYaml: `model_list:
  - model_name: cost-router/planning
    litellm_params:
      model: deepseek/deepseek-reasoner
      api_base: https://api.deepseek.com
  - model_name: cost-router/execution
    litellm_params:
      model: anthropic/claude-sonnet-5.5
  - model_name: cost-router/extraction
    litellm_params:
      model: openai/gpt-6.1-terra

router_settings:
  routing_strategy: usage-based-routing
  fallbacks: [{"cost-router/execution": ["cost-router/extraction"]}]
  enable_pre_call_checks: true`,
      vercelAiTs: `import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function smartRouteExecution({ taskType, prompt }: { taskType: 'plan' | 'code' | 'extract', prompt: string }) {
  const modelMap = {
    plan: 'deepseek-reasoner',
    code: 'claude-sonnet-5.5',
    extract: 'gpt-6.1-terra',
  };

  return await generateText({
    model: openai(modelMap[taskType] || 'gpt-6.1-terra'),
    prompt,
  });
}`,
      pythonSdk: `import openai

client = openai.OpenAI(base_url="https://api.tokencostsai.com/v1", api_key="YOUR_TOKEN")

response = client.chat.completions.create(
    model="tokencost-quality-hybrid",
    messages=[{"role": "user", "content": "Analyze and refactor this microservice"}],
    extra_headers={"X-Router-Priority": "quality"}
)`,
    },
  };

  // 3. Maximum Cost-Cutting Routing (DeepSeek-V4.1-Flash + V3)
  const cPlanCost = calculateModelCost(deepseekR1, params).monthlyNetCost * 0.15;
  const cExecCost = calculateModelCost(deepseekV3, params).monthlyNetCost * 0.45;
  const cExtCost = calculateModelCost(deepseekV4Flash, params).monthlyNetCost * 0.40;
  const cTotal = cPlanCost + cExecCost + cExtCost;
  const cSavings = baselineCost > 0 ? Math.round(((baselineCost - cTotal) / baselineCost) * 100) : 0;

  const maxSavings: RouterRecommendation = {
    id: 'max-savings',
    name: 'Maximum Cost-Cutting (DeepSeek V4.1-Flash Flywheel)',
    tagline: 'Slash Bills by 85%-93% with Near-Flagship Quality',
    description: 'Leverages DeepSeek-R1 for reasoning, DeepSeek-V3 for conversational heavy-lifting, and DeepSeek-V4.1-Flash ($0.004/M cached) for ultra-cheap sub-tasks.',
    savingsVsBaseline: cSavings,
    blendedMonthlyCost: cTotal,
    baselineModel: baselineModel,
    baselineCost: baselineCost,
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
        purpose: 'Handle standard agent conversations with $0.27/1M ground-floor rates.',
      },
      {
        stageName: 'Ultra-Cheap Ground Floor',
        model: deepseekV4Flash,
        trafficSharePercent: 40,
        purpose: 'Process large contexts with $0.022/1M input and $0.004/M cached read.',
      },
    ],
    codeSnippets: {
      litellmYaml: `model_list:
  - model_name: max-savings/reasoning
    litellm_params:
      model: deepseek/deepseek-reasoner
      api_base: https://api.deepseek.com
  - model_name: max-savings/chat
    litellm_params:
      model: deepseek/deepseek-chat
      api_base: https://api.deepseek.com
  - model_name: max-savings/flash
    litellm_params:
      model: deepseek/deepseek-v4.1-flash
      api_base: https://api.deepseek.com

router_settings:
  routing_strategy: lowest-cost`,
      vercelAiTs: `import { generateText } from 'ai';

export async function costCuttingRouter({ prompt, isFlash = false }: { prompt: string; isFlash?: boolean }) {
  const selectedModel = isFlash ? 'deepseek/deepseek-v4.1-flash' : 'deepseek/deepseek-chat';
  return generateText({ model: selectedModel, prompt });
}`,
      pythonSdk: `import openai

client = openai.OpenAI(base_url="https://api.deepseek.com")

response = client.chat.completions.create(
    model="deepseek-v4.1-flash",
    messages=[{"role": "user", "content": "Clean this structured dataset"}],
    stream=False
)`,
    },
  };

  // 4. Ultra-Low Latency Groq LPU Strategy
  const lPlanCost = calculateModelCost(deepseekR1, params).monthlyNetCost * 0.15;
  const lExecCost = calculateModelCost(llama70b, params).monthlyNetCost * 0.85;
  const lTotal = lPlanCost + lExecCost;
  const lSavings = baselineCost > 0 ? Math.round(((baselineCost - lTotal) / baselineCost) * 100) : 0;

  const lowLatency: RouterRecommendation = {
    id: 'ultra-speed',
    name: 'Real-Time Voice & Streaming (Groq LPU)',
    tagline: '420+ Tokens/sec for Instant Voice & Interactive Agents',
    description: 'Pair Groq LPU hardware acceleration with DeepSeek-R1 planning for sub-200ms latency and high conversational fidelity.',
    savingsVsBaseline: lSavings,
    blendedMonthlyCost: lTotal,
    baselineModel: baselineModel,
    baselineCost: baselineCost,
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
      litellmYaml: `model_list:
  - model_name: voice-router/planning
    litellm_params:
      model: deepseek/deepseek-reasoner
      api_base: https://api.deepseek.com
  - model_name: voice-router/fast-stream
    litellm_params:
      model: groq/llama-3.3-70b-versatile
      api_key: os.environ/GROQ_API_KEY

router_settings:
  routing_strategy: latency-cost-balanced`,
      vercelAiTs: `import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export async function voiceStreamingRoute(prompt: string) {
  return await streamText({
    model: groq('llama-3.3-70b-versatile'),
    prompt,
  });
}`,
      pythonSdk: `import openai

client = openai.OpenAI(base_url="https://api.groq.com/openai/v1", api_key="YOUR_GROQ_KEY")

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": "Generate instant voice response"}],
    stream=True
)`,
    },
  };

  return [frontier2026, qualityFirst, maxSavings, lowLatency];
}
