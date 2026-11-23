import type { Metadata } from 'next';
import ModelsClient from './ModelsClient';
import { MODELS_DATA } from '@/lib/models-data';
import {
  buildAlternates,
  getOgLocale,
  getAlternateOgLocales,
  DEFAULT_OG_IMAGES,
  DEFAULT_OG_IMAGE_URL,
} from '@/lib/seo-alternates';

const MODEL_COUNT = MODELS_DATA.length;

export const metadata: Metadata = {
  title: `Official LLM API Pricing Directory (2026) | ${MODEL_COUNT}+ AI Models | TokenCosts AI`,
  description: `Search official token pricing, prompt caching discounts, and context windows for ${MODEL_COUNT}+ LLMs including Gemini 4 Neon, GPT-6.2 Sol/Astra, Claude Sonnet 5.5, and DeepSeek-V4.1-Flash.`,
  openGraph: {
    title: `${MODEL_COUNT}+ LLM Model API Pricing Directory (2026) | TokenCosts AI`,
    description:
      'Explore live token rates, prompt caching discounts, and context limits across OpenAI, Anthropic, DeepSeek, Google, and 50+ providers.',
    url: 'https://tokencostsai.com/models/',
    siteName: 'TokenCosts AI',
    locale: getOgLocale('en'),
    alternateLocale: getAlternateOgLocales('en'),
    type: 'website',
    images: DEFAULT_OG_IMAGES,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${MODEL_COUNT}+ LLM Model API Pricing Directory (2026) | TokenCosts AI`,
    description: 'Explore live token rates, prompt caching discounts, and context limits across OpenAI, Anthropic, DeepSeek, Google, and 50+ providers.',
    images: [DEFAULT_OG_IMAGE_URL],
  },
  alternates: buildAlternates('/models/', 'en'),
};

export default function ModelsPage() {
  return <ModelsClient />;
}
