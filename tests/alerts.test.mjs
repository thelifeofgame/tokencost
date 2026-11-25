import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDigest, comparePrices, mergeAlerts } from '../workers/visits-24h/src/alerts-logic.ts';
import { renderEmail } from '../workers/visits-24h/src/alert-email.ts';

const now = Date.parse('2026-11-30T01:00:00Z');
const found = '2026-11-29T12:00:00Z';
const model = { id: 'one', name: 'One', provider: 'Provider', input: 2, output: 5, cached: null };
const after = { ...model, input: 1, output: 6, cached: 0 };
const second = { ...model, id: 'two', name: 'Two' };

test('reports numeric deltas, new models and changes from unavailable with no fabricated percent', () => {
  const changes = comparePrices([model], [after, second], found);
  assert.deepEqual(changes.map(x => [x.field, x.oldValue, x.newValue, x.percent]), [
    ['input', 2, 1, -50], ['output', 5, 6, 20], ['cached', null, 0, null], ['new', null, null, null],
  ]);
  assert.deepEqual(comparePrices([model], [model], found), []);
});

test('groups reductions for followed models for one email', () => {
  const changes = comparePrices([model, second], [{ ...after, output: 3 }, { ...second, input: 1 }], found);
  const groups = mergeAlerts(changes, ['one']);
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].map(x => x.field), ['input', 'output']);
  assert.deepEqual(mergeAlerts(changes, []), []);
});

test('digest uses the previous seven days and verified offers expiring within seven days', () => {
  const changes = comparePrices([model], [after, second], found);
  const expired = { title: 'Expired', endsAt: '2026-11-28', source: 'https://example.com/', verifiedAt: '2026-11-28' };
  const active = { ...expired, title: 'Offer', endsAt: '2026-12-02' };
  const digest = buildDigest([...changes, { ...changes[0], foundAt: '2026-11-10T00:00:00Z' }], [expired, active], now);
  assert.equal(digest.cuts.length, 1);
  assert.equal(digest.increases.length, 1);
  assert.equal(digest.launches.length, 1);
  assert.deepEqual(digest.deals, [active]);
  const email = renderEmail('zh-CN', 'https://tokencostsai.com', 'https://tokencostsai.com/api/unsubscribe?token=test', { kind: 'digest', digest });
  assert.match(email.html, /\/zh-CN\/models\/one\/\?utm_source=digest/);
  assert.equal(email.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
});
