import type { Metadata } from 'next';
import CalculatorClient from './CalculatorClient';

export const metadata: Metadata = {
  title: 'LLM Prompt Caching & Batch API Cost Calculators (2026) | TokenCosts AI',
  description: 'Simulate prompt caching ROI, write surcharge break-even curves, and 50% batch discounts for Gemini 4 Neon, GPT-6.2 Sol, Claude Sonnet 5.5, DeepSeek-V4.1-Flash, and 371+ models.',
  alternates: {
    canonical: 'https://tokencostsai.com/calculator',
  },
  openGraph: {
    title: 'Prompt Caching & LLM API ROI Calculators | TokenCosts AI',
    description: 'Dedicated prompt caching break-even simulators for 371+ AI foundation models.',
    url: 'https://tokencostsai.com/calculator',
    siteName: 'TokenCosts AI',
    type: 'website',
  },
};

export default function CalculatorHubPage() {
  return <CalculatorClient />;
}
