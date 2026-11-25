import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_SCENARIO, decodeScenario, encodeScenario, readScenarios, storeScenario } from '../src/lib/scenarios.ts';

test('share links round-trip the workload, routing controls, and advanced state', () => {
  const original = {
    params: { monthlyRequests: 50000, inputTokens: 128000, outputTokens: 8192, cacheHitRate: 0.625, batchRate: 0.15, enableLongContext: true, cacheLifetimeMultiplier: 7 },
    providers: ['Anthropic', 'Alibaba Qwen'], baseline: 'claude-sonnet-5.5', strategy: 'weekend-coding-flash', advanced: true,
  };
  assert.deepEqual(decodeScenario(new URLSearchParams(encodeScenario(original))), original);
});

test('legacy workload links restore, invalid values fall back or clamp', () => {
  const legacy = decodeScenario(new URLSearchParams('reqs=50000&in=25000&out=1500&cache=85&batch=15&long=0'));
  assert.deepEqual(legacy, { ...DEFAULT_SCENARIO, params: { monthlyRequests: 50000, inputTokens: 25000, outputTokens: 1500, cacheHitRate: 0.85, batchRate: 0.15, enableLongContext: false } });
  const invalid = decodeScenario(new URLSearchParams('reqs=bad&out=999999&cache=Infinity&model=<bad>&providers=invalid'));
  assert.equal(invalid.params.monthlyRequests, DEFAULT_SCENARIO.params.monthlyRequests);
  assert.equal(invalid.params.outputTokens, 8192);
  assert.equal(invalid.params.cacheHitRate, DEFAULT_SCENARIO.params.cacheHitRate);
  assert.equal(invalid.baseline, DEFAULT_SCENARIO.baseline);
  assert.deepEqual(invalid.providers, ['All']);
});

test('keeps five deduplicated scenarios and places the most recent first', () => {
  let data;
  const storage = { getItem: () => data, setItem: (_key, value) => { data = value; } };
  for (let i = 0; i < 7; i++) storeScenario(storage, { ...DEFAULT_SCENARIO, params: { ...DEFAULT_SCENARIO.params, inputTokens: i } });
  const newest = { ...DEFAULT_SCENARIO, params: { ...DEFAULT_SCENARIO.params, inputTokens: 4 } };
  assert.equal(storeScenario(storage, newest).length, 5);
  assert.equal(readScenarios(storage)[0], encodeScenario(newest));
  assert.equal(new Set(readScenarios(storage)).size, 5);
});
