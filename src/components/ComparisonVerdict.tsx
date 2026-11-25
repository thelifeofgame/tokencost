import { getTranslation } from '@/i18n';
import type { Locale } from '@/i18n/types';
import type { ModelPricingRule } from '@/types/pricing';
import { formatCurrency } from '@/lib/utils';

export default function ComparisonVerdict({ a, b, costA, costB, locale }: {
  a: ModelPricingRule; b: ModelPricingRule; costA: number; costB: number; locale: Locale;
}) {
  const { detail } = getTranslation(locale);
  const lowerCost = costA <= costB ? a : b;
  const longer = a.contextWindow > b.contextWindow ? a : b;
  const aScore = a.benchmarks?.intelligenceIndex;
  const bScore = b.benchmarks?.intelligenceIndex;
  return (
    <section className="space-y-2 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-sm dark:border-indigo-900 dark:bg-indigo-950/40">
      <h2 className="text-base font-semibold">{detail.verdictTitle}</h2>
      <p>{costA === costB ? detail.tie : detail.verdictCost
        .replace('{model}', lowerCost.modelName).replace('{price}', formatCurrency(Math.min(costA, costB)))}</p>
      {a.contextWindow !== b.contextWindow && <p>{detail.verdictContext
        .replace('{limit}', Math.min(a.contextWindow, b.contextWindow).toLocaleString(locale)).replace('{model}', longer.modelName)}</p>}
      {aScore != null && bScore != null && <p>{detail.verdictBenchmarks
        .replace('{a}', a.modelName).replace('{b}', b.modelName)
        .replace('{aScore}', aScore.toFixed(1)).replace('{bScore}', bScore.toFixed(1))}</p>}
    </section>
  );
}
