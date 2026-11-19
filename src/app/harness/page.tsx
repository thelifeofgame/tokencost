import type { Metadata } from 'next';
import HarnessDirectoryClient from '@/components/HarnessDirectoryClient';
import SchemaOrg from '@/components/seo/SchemaOrg';

export const metadata: Metadata = {
  title: 'Coding Agent & Harness Token Multiplier Benchmark (2026) | TokenCosts AI',
  description:
    'Audit the real token multiplier, system prompt overhead, and BYOK cost optimization across 7 top coding agents: Claude Code, Cursor, Windsurf, Aider, Cline, Roo Code & OpenCode.',
  openGraph: {
    title: 'Coding Agent & Harness Token Multiplier Benchmark (2026) | TokenCosts AI',
    description:
      'Compare real token multipliers (1.2x Aider vs 3.5x Cursor), AST repo-map pruning, Prompt Caching hit rates, and BYOK configs across 7 coding agents.',
    url: 'https://tokencostsai.com/harness/',
    siteName: 'TokenCosts AI',
    type: 'website',
  },
  alternates: {
    canonical: 'https://tokencostsai.com/harness/',
  },
};

const HARNESS_HUB_FAQS = [
  {
    question: 'What is a Coding Agent\'s "Real Token Multiplier" and why does it matter?',
    answer:
      'A harness\'s Real Token Multiplier measures total input and output tokens billed during a multi-turn coding task divided by the raw user prompt and diff size. Due to system prompt overhead, file-tree indexing, tool schemas, and error retries, tools range from 1.2x (Aider) to 3.5x (Cursor Composer).',
  },
  {
    question: 'How does BYOK cost optimization beat flat $20/month IDE subscriptions?',
    answer:
      'Bring Your Own Key (BYOK) lets you pair lightweight harnesses like Aider, Cline, or Roo Code with 95%–98% Prompt Caching models such as Gemini 4 Neon, Claude Sonnet 5.5, and DeepSeek-V4.1-Flash to cut monthly spend to $4–$12 without subscription rate limits.',
  },
  {
    question: 'Which Coding Harness is the most token-efficient for large repositories in 2026?',
    answer:
      'Aider (1.2x–1.8x) leads in raw token efficiency via Tree-Sitter AST Repo-Map pruning, followed by OpenCode/Continue (1.5x–2.3x) and Roo Code (1.7x–2.6x).',
  },
];

export default function HarnessDirectoryPage() {
  return (
    <>
      <SchemaOrg
        type="software"
        name="Coding Agent & Harness Token Cost Benchmark (2026)"
        description="Real token multiplier audit and BYOK cost optimization directory across 7 top AI coding agents."
        url="https://tokencostsai.com/harness/"
        faqs={HARNESS_HUB_FAQS}
        breadcrumbs={[
          { name: 'Home', url: 'https://tokencostsai.com/' },
          { name: 'Harnesses', url: 'https://tokencostsai.com/harness/' },
        ]}
      />
      <HarnessDirectoryClient />
    </>
  );
}
