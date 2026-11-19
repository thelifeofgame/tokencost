import type { Metadata } from 'next';
import ModelsClient from './ModelsClient';

export const metadata: Metadata = {
  title: 'Official LLM API Pricing Directory (2026) | 371+ AI Models | TokenCosts AI',
  description: 'Search official token pricing, prompt caching discounts, and context windows for 371+ LLMs including Gemini 4 Neon, GPT-6.2 Sol/Astra, Claude Sonnet 5.5, and DeepSeek-V4.1-Flash.',
  openGraph: {
    title: '371+ LLM Model API Pricing Directory (2026) | TokenCosts AI',
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
