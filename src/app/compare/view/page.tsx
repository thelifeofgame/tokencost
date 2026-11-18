import type { Metadata } from 'next';
import { Suspense } from 'react';
import CompareFallbackClient from '@/components/CompareFallbackClient';

/**
 * 长尾对比页（按需渲染）
 *
 * 背景：站点是 output: 'export' 纯静态导出，构建时只为 tier-1 模型矩阵
 * 预生成 compare 页面（约 331 个）。而选择器允许用户从全部 ~367 个模型里挑，
 * 组合数远超预生成范围，命中率约 0.5%。
 *
 * 这个页面用客户端渲染兜底：任意 <modelA>-vs-<modelB> 组合都能看到对比内容。
 * 走 noindex，不参与搜索索引，避免产生大量低质量页面。
 */
export const metadata: Metadata = {
  title: 'Model Cost Comparison | TokenCosts AI',
  description:
    'Live side-by-side API cost comparison for two LLM models, computed in your browser.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  alternates: { canonical: 'https://tokencostsai.com/compare/' },
};

export default function CompareFallbackPage() {
  return (
    <Suspense fallback={null}>
      <CompareFallbackClient />
    </Suspense>
  );
}
