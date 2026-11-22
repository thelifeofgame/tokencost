import rawSchema from '@/data/model_pricing_schema.json';

export const LIVE_MODEL_COUNT: number = rawSchema.models.length; // e.g. 367

export function formatShortUsd(val: number): string {
  if (val === 0) return '$0';
  if (val < 0.1) return `$${Number(val.toFixed(4))}`;
  const rounded4 = Number(val.toFixed(4));
  const str = String(rounded4);
  const dotIdx = str.indexOf('.');
  if (dotIdx !== -1 && str.length - dotIdx - 1 > 2) {
    return `$${str}`;
  }
  return `$${val.toFixed(2)}`;
}

/**
 * Computes UTC-aligned Gemini 4 Carbon / Argon Dec 1 price hike countdown.
 * 2026-11-22 -> daysLeft = 8 ('8d Left')
 * 2026-11-30 -> daysLeft = 0 ('Last Day')
 * >= 2026-12-01 -> isHikeActive = true ('2x Hike Live')
 */
export function getCarbonMigrationCountdown(now: Date = new Date()) {
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const cutoffUtc = Date.UTC(2026, 10, 30); // Nov 30, 2026 UTC
  const hikeUtc = Date.UTC(2026, 11, 1); // Dec 1, 2026 UTC
  const daysLeft = Math.max(0, Math.round((cutoffUtc - todayUtc) / 86400000));
  const isHikeActive = todayUtc >= hikeUtc;

  const shortTagEn = isHikeActive
    ? '2x Hike Live'
    : daysLeft > 0
      ? `${daysLeft}d Left`
      : 'Last Day';

  return { daysLeft, isHikeActive, shortTagEn };
}

export function getLiveFlashRates() {
  const find = (id: string) => rawSchema.models.find((m) => m.modelId === id);
  const deepseek = find('deepseek-v4.1-flash');
  const glm = find('glm-5.3-flash');
  const qwen = find('qwen3-coder-30b-a3b-instruct');

  return {
    deepseekIn: formatShortUsd(deepseek?.inputPerM ?? 0.0498),
    deepseekOut: formatShortUsd(deepseek?.outputPerM ?? 0.1992),
    deepseekCached: formatShortUsd(deepseek?.cachedInputPerM ?? 0.001),
    glmIn: formatShortUsd(glm?.inputPerM ?? 0.0399),
    glmOut: formatShortUsd(glm?.outputPerM ?? 0.0784),
    qwenIn: formatShortUsd(qwen?.inputPerM ?? 0.07),
    qwenOut: formatShortUsd(qwen?.outputPerM ?? 0.28),
    minDropPct: 53,
    maxDropPct: 84,
  };
}
