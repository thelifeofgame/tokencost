import assert from 'node:assert/strict';
import test from 'node:test';
import { convertUsdPriceRate } from '../src/lib/domestic-pricing.ts';

test('converts input and output at the supplied USD to CNY rate', () => {
  assert.deepEqual(convertUsdPriceRate({ input: 2, output: 10 }, 7.2), { input: 14.4, output: 72 });
});

test('does not invent a conversion for invalid or missing exchange rates', () => {
  for (const rate of [0, -1, Infinity, NaN, 1001]) assert.equal(convertUsdPriceRate({ input: 2, output: 10 }, rate), null);
});
