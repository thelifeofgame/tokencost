import type { Metadata } from 'next';
import DevelopersClient from './DevelopersClient';
import { buildAlternates } from '@/lib/seo-alternates';

export const metadata: Metadata = {
  title: 'Developer API & LiteLLM / Vercel AI SDK Routing Guide | TokenCosts AI',
  description:
    'Drop-in LiteLLM Proxy YAML configs, Vercel AI SDK dynamic model routers, and GitHub README cost badges for Gemini 4 Neon, Claude Sonnet 5.5, GPT-6.2 Sol & DeepSeek-V4.1-Flash.',
  alternates: buildAlternates('/developers/', 'en'),
  openGraph: {
    title: 'Developer API & Cost-Optimized Routing SDKs | TokenCosts AI',
    description:
      'Copy production LiteLLM & Vercel AI SDK routing configs to cut LLM token spend automatically.',
    url: 'https://tokencostsai.com/developers/',
    siteName: 'TokenCosts AI',
    type: 'website',
  },
};

export default function DevelopersPage() {
  return <DevelopersClient />;
}
