import type { Metadata } from 'next';
import CalculatorClient from './CalculatorClient';

export const metadata: Metadata = {
  title: 'LLM Prompt Caching & Batch API Cost Calculators (2026) | TokenCosts AI',
  description: 'Simulate prompt caching ROI, write surcharge break-even curves, and 50% batch discounts for GPT-6.1 Sol, Claude 3.5 Sonnet, DeepSeek, and 365+ models.',
  alternates: {
    canonical: 'https://tokencostsai.com/calculator',
  },
  openGraph: {
    title: 'Prompt Caching & LLM API ROI Calculators | TokenCosts AI',
    description: 'Dedicated prompt caching break-even simulators for 365+ AI foundation models.',
    url: 'https://tokencostsai.com/calculator',
    siteName: 'TokenCosts AI',
    type: 'website',
  },
};

export default function CalculatorHubPage() {
  return <CalculatorClient />;
}
