'use client';

import React, { useState } from 'react';
import { RouterRecommendation } from '@/types/pricing';
import { X, Copy, Check, Terminal, FileCode, Code2 } from 'lucide-react';

interface ConfigExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: RouterRecommendation | null;
}

export default function ConfigExporterModal({
  isOpen,
  onClose,
  recommendation,
}: ConfigExporterModalProps) {
  const [activeTab, setActiveTab] = useState<'litellm' | 'ts' | 'py'>('litellm');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !recommendation) return null;

  const getCode = () => {
    switch (activeTab) {
      case 'litellm':
        return recommendation.codeSnippets.litellmYaml;
      case 'ts':
        return recommendation.codeSnippets.vercelAiTs;
      case 'py':
        return recommendation.codeSnippets.pythonSdk;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                Export Router Integration Code
              </h3>
              <p className="text-xs text-zinc-400">
                {recommendation.name} • Save {recommendation.savingsVsBaseline}%
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center justify-between mt-4 mb-3">
          <div className="flex gap-1 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('litellm')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'litellm'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>LiteLLM YAML</span>
            </button>
            <button
              onClick={() => setActiveTab('ts')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'ts'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Vercel AI SDK (TS)</span>
            </button>
            <button
              onClick={() => setActiveTab('py')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'py'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Python SDK</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-300" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Snippet</span>
              </>
            )}
          </button>
        </div>

        {/* Code View */}
        <pre className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800/80 font-mono text-xs text-zinc-200 overflow-x-auto max-h-80 leading-relaxed scrollbar-thin">
          <code>{getCode()}</code>
        </pre>

        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Compatible with LiteLLM Proxy, OpenAI Python/Node SDK, and Vercel AI SDK.</span>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
