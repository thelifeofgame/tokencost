import type { Metadata } from 'next';
import ModelsClient from './ModelsClient';

export const metadata: Metadata = {
  title: 'Official LLM API Pricing Directory (2026) | 365+ AI Models | TokenCosts AI',
  description: 'Search official token pricing, prompt caching discounts, and context windows for 365+ LLMs including GPT-6.1 Sol, Claude 3.5 Sonnet, DeepSeek V3, and Gemini 1.5.',
  openGraph: {
    title: '365+ LLM Model API Pricing Directory (2026) | TokenCosts AI',
    description: 'Explore live token rates, prompt caching discounts, and context limits across OpenAI, Anthropic, DeepSeek, Google, and 50+ providers.',
    url: 'https://tokencostsai.com/models',
    siteName: 'TokenCosts AI',
    type: 'website',
  },
  alternates: {
    canonical: 'https://tokencostsai.com/models',
  },
};

export default function ModelsPage() {
  return <ModelsClient />;
}
