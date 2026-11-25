export type PriceField = 'input' | 'output' | 'cached';
export type ModelPrice = { id: string; name: string; provider: string } & Record<PriceField, number | null>;
export interface ExpiringDeal { title: string; endsAt: string; source: string; verifiedAt: string }
export interface PriceFeed { updatedAt: string; models: ModelPrice[]; deals: ExpiringDeal[] }
export interface PriceChange {
  modelId: string;
  modelName: string;
  field: PriceField | 'new';
  oldValue: number | null;
  newValue: number | null;
  percent: number | null;
  foundAt: string;
}

const fields: PriceField[] = ['input', 'output', 'cached'];
const DAY_MS = 86_400_000;

export function comparePrices(previous: ModelPrice[], current: ModelPrice[], foundAt: string): PriceChange[] {
  const known = new Map(previous.map(model => [model.id, model]));
  return current.flatMap<PriceChange>(model => {
    const before = known.get(model.id);
    const identity = { modelId: model.id, modelName: model.name, foundAt };
    if (!before) {
      return [{ ...identity, field: 'new' as const, oldValue: null, newValue: null, percent: null }];
    }
    return fields.filter(field => before[field] !== model[field]).map(field => {
      const oldValue = before[field];
      const newValue = model[field];
      return {
        ...identity, field, oldValue, newValue,
        percent: oldValue && newValue !== null
          ? Math.round((newValue / oldValue - 1) * 10000) / 100
          : null,
      };
    });
  });
}

export function isReduction(change: PriceChange): boolean {
  return change.oldValue !== null && change.newValue !== null && change.newValue < change.oldValue;
}

export function mergeAlerts(changes: PriceChange[], models: string[]): PriceChange[][] {
  const groups = new Map<string, PriceChange[]>();
  const selected = new Set(models);
  for (const change of changes) {
    if (!selected.has(change.modelId) || !isReduction(change)) continue;
    const group = groups.get(change.modelId) ?? [];
    group.push(change);
    groups.set(change.modelId, group);
  }
  return Array.from(groups.values());
}

export function buildDigest(changes: PriceChange[], deals: ExpiringDeal[], now: number) {
  const recent = changes.filter(change => {
    const discovered = Date.parse(change.foundAt);
    return discovered >= now - 7 * DAY_MS && discovered < now;
  });
  const increases = recent.filter(change => change.oldValue !== null && change.newValue !== null && change.newValue > change.oldValue);
  return {
    cuts: recent.filter(isReduction).sort((a, b) => (a.percent ?? 0) - (b.percent ?? 0)).slice(0, 5),
    increases: increases.sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0)).slice(0, 5),
    launches: recent.filter(change => change.field === 'new').slice(0, 5),
    deals: deals.filter(deal => {
      const deadline = Date.parse(deal.endsAt) + (deal.endsAt.length === 10 ? DAY_MS : 0);
      return deadline >= now && deadline <= now + 7 * DAY_MS;
    }).sort((a, b) => a.endsAt.localeCompare(b.endsAt)),
  };
}

export type Digest = ReturnType<typeof buildDigest>;
