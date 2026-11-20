import type { Metadata } from 'next';
import CalculatorClient from './CalculatorClient';
import { MODELS_DATA } from '@/lib/models-data';
import { buildAlternates } from '@/lib/seo-alternates';

const MODEL_COUNT = MODELS_DATA.length;

export const metadata: Metadata = {
  title: 'LLM Prompt Caching & Batch API Cost Calculators (2026) | TokenCosts AI',
  description: `Simulate prompt caching ROI, write surcharge break-even curves, and 50% batch discounts for Gemini 4 Neon, GPT-6.2 Sol, Claude Sonnet 5.5, DeepSeek-V4.1-Flash, and ${MODEL_COUNT}+ models.`,
  alternates: buildAlternates('/calculator/', 'en'),
  openGraph: {
    title: 'Prompt Caching & LLM API ROI Calculators | TokenCosts AI',
    description: `Dedicated prompt caching break-even simulators for ${MODEL_COUNT}+ AI foundation models.`,
    url: 'https://tokencostsai.com/calculator/',
    siteName: 'TokenCosts AI',
    type: 'website',
  },
};

export default function CalculatorHubPage() {
  return <CalculatorClient />;
}
