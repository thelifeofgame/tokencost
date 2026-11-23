import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';
import Compare404Redirect from '@/components/Compare404Redirect';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center space-y-5">
      {/* 长尾对比 URL 的兜底跳转（客户端执行） */}
      <Compare404Redirect />

      <Compass className="h-12 w-12 mx-auto text-zinc-400 dark:text-zinc-600" />

      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
        Page not found
      </h1>

      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        This page does not exist, or it may have been relocated. If you were
        looking for a model cost comparison, start from the compare hub.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href="/compare/"
          className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
        >
          Compare models
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
      </div>
    </div>
  );
}
