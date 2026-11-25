'use client';

import { useEffect } from 'react';

const LOCALE_PREFIX = '(?:es|ja|ko|zh-CN|zh-TW)';
const COMPARE_404 = new RegExp(
  `^/(?:(${LOCALE_PREFIX})/)?compare/([^/]+)/?$`
);

/**
 * 兜底跳转：当用户访问一个没有被静态预生成的长尾对比 URL
 * （例如 /compare/deepseek-v4.1-flash-vs-solar-mini-4-5/）时，
 * Next 的静态导出会返回 404，这里在浏览器端把它接到按需渲染页。
 *
 * 保留 404 状态码是有意为之：
 *  - 对搜索引擎来说，这类页面本就不该被索引，404 是正确信号；
 *  - 对真人来说，页面会瞬间落到 /compare/view/ 继续看对比。
 */
export default function Compare404Redirect() {
  useEffect(() => {
    const match = window.location.pathname.match(COMPARE_404);
    if (!match) return;

    const locale = match[1] ? `/${match[1]}` : '';
    const slug = decodeURIComponent(match[2]);

    // 不是 <modelA>-vs-<modelB> 形态的就不处理
    if (!slug.includes('-vs-')) return;

    window.location.replace(
      `${locale}/compare/view/?slug=${encodeURIComponent(slug)}`
    );
  }, []);

  return null;
}
