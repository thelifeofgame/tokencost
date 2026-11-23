'use client';

import React, { useState } from 'react';
import { estimateTokensFromText } from '@/lib/calculator-engine';
import { X, Check, FileText } from 'lucide-react';

interface TokenEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTokens: (tokenCount: number) => void;
}

export default function TokenEstimatorModal({
  isOpen,
  onClose,
  onApplyTokens,
}: TokenEstimatorModalProps) {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const stats = estimateTokensFromText(text);

  const handleApply = () => {
    onApplyTokens(stats.tokens);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl shadow-zinc-950/15 dark:shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Prompt Token Estimator
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Paste your prompt, system prompt, or RAG context to calculate tokens
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Textarea */}
        <div className="mt-4 space-y-3">
          <textarea
            rows={7}
            placeholder="Paste your prompt text or JSON payload here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 font-mono leading-relaxed resize-none transition-colors"
          />

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/90 dark:border-zinc-800/80 text-center font-mono">
            <div>
              <span className="text-[10px] uppercase text-zinc-600 dark:text-zinc-500 block">Estimated Tokens</span>
              <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {stats.tokens.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-zinc-600 dark:text-zinc-500 block">Word Count</span>
              <span className="text-base font-bold text-zinc-900 dark:text-zinc-200 tabular-nums">
                {stats.words.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-zinc-600 dark:text-zinc-500 block">Characters</span>
              <span className="text-base font-bold text-zinc-900 dark:text-zinc-200 tabular-nums">
                {stats.chars.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-5 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={stats.tokens <= 1}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-all shadow-sm"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Apply {stats.tokens.toLocaleString()} Tokens to Simulator</span>
          </button>
        </div>
      </div>
    </div>
  );
}
