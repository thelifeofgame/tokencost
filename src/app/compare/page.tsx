import type { Metadata } from 'next';
import CompareClient from './CompareClient';
import { MODELS_DATA } from '@/lib/models-data';
import {
  buildAlternates,
  DEFAULT_OG_IMAGES,
  DEFAULT_OG_IMAGE_URL,
} from '@/lib/seo-alternates';

const MODEL_COUNT = MODELS_DATA.length;

export const metadata: Metadata = {
  title: 'LLM API Model Versus & Cost Comparison Hub (2026) | TokenCosts AI',
  description: `Side-by-side API cost comparison between OpenAI GPT-6.2, Google Gemini 4 Neon, Anthropic Claude 5.5, DeepSeek-V4.1-Flash, and ${MODEL_COUNT}+ models with Prompt Caching and Batch 50% analysis.`,
  alternates: buildAlternates('/compare/', 'en'),
  openGraph: {
    title: 'LLM API Model Versus & Cost Comparison Hub | TokenCosts AI',
    description: `Head-to-head benchmarks and cost parity analysis for ${MODEL_COUNT}+ AI foundation models.`,
    url: 'https://tokencostsai.com/compare/',
    siteName: 'TokenCosts AI',
    type: 'website',
      images: DEFAULT_OG_IMAGES,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LLM API Model Versus & Cost Comparison Hub | TokenCosts AI',
    description: `Head-to-head benchmarks and cost parity analysis for ${MODEL_COUNT}+ AI foundation models.`,
    images: [DEFAULT_OG_IMAGE_URL],
  },
};

export default function CompareHubPage() {
  return <CompareClient />;
}
