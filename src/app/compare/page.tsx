import type { Metadata } from 'next';
import CompareClient from './CompareClient';

export const metadata: Metadata = {
  title: 'LLM API Model Versus & Cost Comparison Hub (2026) | TokenCosts AI',
  description: 'Side-by-side API cost comparison between OpenAI GPT-6.2, Google Gemini 4 Neon, Anthropic Claude 5.5, DeepSeek-V4.1-Flash, and 371+ models with Prompt Caching and Batch 50% analysis.',
  alternates: {
    canonical: 'https://tokencostsai.com/compare',
  },
  openGraph: {
    title: 'LLM API Model Versus & Cost Comparison Hub | TokenCosts AI',
    description: 'Head-to-head benchmarks and cost parity analysis for 371+ AI foundation models.',
    url: 'https://tokencostsai.com/compare',
    siteName: 'TokenCosts AI',
    type: 'website',
  },
};

export default function CompareHubPage() {
  return <CompareClient />;
}
