import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SchemaOrg from '@/components/seo/SchemaOrg';
import { I18nProvider } from '@/i18n/I18nProvider';
import { MODELS_DATA } from '@/lib/models-data';
import { buildAlternates } from '@/lib/seo-alternates';

const MODEL_COUNT = MODELS_DATA.length;

export const metadata: Metadata = {
  metadataBase: new URL('https://tokencostsai.com'),
  title: 'TokenCosts AI | LLM API Pricing, Coding Agent Costs & Smart Router (2026)',
  description: `Compare real-time LLM API pricing across ${MODEL_COUNT}+ models including Gemini 4 Neon, GPT-6.2 Astra & Sol, Claude Sonnet 5.5, and DeepSeek-V4.1-Flash. Audit Prompt Caching ROI, Batch 50% discounts, and Coding Agent token multipliers.`,
  keywords: [
    'LLM API pricing 2026',
    'Gemini 4 Neon pricing',
    'GPT-6.2 Sol vs Astra cost',
    'Claude Sonnet 5.5 API cost',
    'DeepSeek V4.1 Flash pricing',
    'Prompt caching ROI calculator',
    'Coding agent token multiplier',
    'AI API cost comparison',
    'BYOK LLM cost router',
    '大模型API价格计算器',
    '大模型提示词缓存省钱对比',
  ],
  authors: [{ name: 'TokenCosts AI Engineering' }],
  alternates: buildAlternates('/', 'en'),
  openGraph: {
    title: 'TokenCosts AI | Stop Guessing Your AI & Coding Agent Bill',
    description:
      'Simulate real-world LLM API costs for Gemini 4 Neon, GPT-6.2, Claude Sonnet 5.5 & DeepSeek-V4.1-Flash with 95% Prompt Caching and Coding Harness overhead.',
    url: 'https://tokencostsai.com/',
    siteName: 'TokenCosts AI',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TokenCosts AI | 2026 LLM Cost Intelligence & Agent Overhead Calculator',
    description:
      'Compare Gemini 4 Neon, GPT-6.2 Sol/Astra, Claude Sonnet 5.5 & DeepSeek-V4.1-Flash token bills with Prompt Caching & Batch savings.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <SchemaOrg includeHreflang={false} />
      </head>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
        <I18nProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
