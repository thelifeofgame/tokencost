import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SchemaOrg from '@/components/seo/SchemaOrg';
import { I18nProvider } from '@/i18n/I18nProvider';

export const metadata: Metadata = {
  metadataBase: new URL('https://tokencostsai.com'),
  title: 'TokenCosts AI | LLM API Cost Intelligence & Smart Router',
  description: 'Simulate true LLM API costs with prompt caching discounts, batch 50% savings, and intelligent multi-model routing recommendations for OpenAI, Claude, DeepSeek, and Google Gemini.',
  keywords: [
    'LLM API pricing',
    'Token cost calculator',
    'Prompt caching calculator',
    'DeepSeek pricing',
    'Claude 3.5 Sonnet cost',
    'GPT-4o token cost',
    'LLM cost router',
    'Batch API pricing',
    '大模型API价格计算器',
    '提示词缓存省钱对比',
  ],
  authors: [{ name: 'TokenCosts AI Engineering' }],
  alternates: {
    canonical: 'https://tokencostsai.com/',
    languages: {
      'en': 'https://tokencostsai.com/',
      'zh-CN': 'https://tokencostsai.com/zh-CN/',
      'zh-TW': 'https://tokencostsai.com/zh-TW/',
      'ja': 'https://tokencostsai.com/ja/',
      'ko': 'https://tokencostsai.com/ko/',
      'es': 'https://tokencostsai.com/es/',
      'x-default': 'https://tokencostsai.com/',
    },
  },
  openGraph: {
    title: 'TokenCosts AI | Stop Guessing Your AI Bill',
    description: 'Simulate true LLM costs with Prompt Caching, Batch discounts, and Pareto-optimal smart routing.',
    url: 'https://tokencostsai.com',
    siteName: 'TokenCosts AI',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TokenCosts AI | LLM Cost Intelligence & Smart Router',
    description: 'Simulate true LLM API costs with prompt caching discounts, batch 50% savings, and multi-model router.',
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
        <SchemaOrg />
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
