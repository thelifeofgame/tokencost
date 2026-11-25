import type { SimulationParams } from '../types/pricing';

export const SCENARIO_PROVIDERS = ['All', 'OpenAI', 'Anthropic', 'DeepSeek', 'Google', 'xAI', 'Alibaba Qwen', 'Mistral', 'Meta', 'Groq'];

export interface Scenario {
  params: SimulationParams;
  providers: string[];
  baseline: string;
  strategy: string;
  advanced: boolean;
}

export const DEFAULT_SCENARIO: Scenario = {
  params: { monthlyRequests: 100000, inputTokens: 4000, outputTokens: 1000, cacheHitRate: 0.65, batchRate: 0, enableLongContext: false },
  providers: ['All'],
  baseline: 'gpt-6.2-sol',
  strategy: '',
  advanced: false,
};

export const SCENARIO_STORAGE_KEY = 'tc_recent_scenarios_v1';

export function encodeScenario({ params, providers, baseline, strategy, advanced }: Scenario): string {
  const query = new URLSearchParams({
    reqs: String(params.monthlyRequests),
    in: String(params.inputTokens),
    out: String(params.outputTokens),
    cache: String(Number((params.cacheHitRate * 100).toFixed(10))),
    batch: String(Number((params.batchRate * 100).toFixed(10))),
    long: params.enableLongContext ? '1' : '0',
    providers: providers.join(','),
    model: baseline,
    strategy,
    advanced: advanced ? '1' : '0',
  });
  if (params.cacheLifetimeMultiplier !== undefined) query.set('reuse', String(params.cacheLifetimeMultiplier));
  return query.toString();
}

export function decodeScenario(query: URLSearchParams): Scenario {
  const { params, baseline } = DEFAULT_SCENARIO;
  function number(key: string, fallback: number, min: number, max: number, whole = true) {
    const raw = query.get(key);
    if (raw === null || !/^\d+(?:\.\d+)?$/.test(raw)) return fallback;
    const n = Number(raw);
    if (!Number.isFinite(n) || (whole && !Number.isInteger(n))) return fallback;
    return Math.max(min, Math.min(max, n));
  }
  function token(key: string, fallback: string) {
    const value = query.get(key);
    return value && /^[a-zA-Z0-9._:-]{1,128}$/.test(value) ? value : fallback;
  }
  const providers = (query.get('providers') ?? '').split(',').filter(provider => SCENARIO_PROVIDERS.includes(provider));
  return {
    params: {
      monthlyRequests: number('reqs', params.monthlyRequests, 1, 2_000_000),
      inputTokens: number('in', params.inputTokens, 0, 128000),
      outputTokens: number('out', params.outputTokens, 0, 8192),
      cacheHitRate: number('cache', params.cacheHitRate * 100, 0, 100, false) / 100,
      batchRate: number('batch', params.batchRate * 100, 0, 100, false) / 100,
      enableLongContext: query.get('long') === '1',
      ...(query.has('reuse') ? { cacheLifetimeMultiplier: number('reuse', 5, 1, 100) } : {}),
    },
    providers: providers.length && !providers.includes('All') ? Array.from(new Set(providers)) : ['All'],
    baseline: token('model', baseline),
    strategy: token('strategy', ''),
    advanced: query.get('advanced') === '1',
  };
}

export function readScenarios(storage: Storage): string[] {
  let data: unknown;
  try {
    data = JSON.parse(storage.getItem(SCENARIO_STORAGE_KEY) ?? '[]');
  } catch (error) {
    if (error instanceof SyntaxError) return [];
    throw error;
  }
  return Array.isArray(data)
    ? data.filter((entry): entry is string => typeof entry === 'string' && entry.length <= 1000 && new URLSearchParams(entry).has('reqs')).slice(0, 5)
    : [];
}

export function storeScenario(storage: Storage, scenario: Scenario): string[] {
  const current = encodeScenario(scenario);
  const saved = [current, ...readScenarios(storage).filter(entry => entry !== current)].slice(0, 5);
  storage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(saved));
  return saved;
}
