import React from 'react';
import { ExternalLink, Zap } from 'lucide-react';

export default function SponsorBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-r from-zinc-900/80 via-indigo-950/20 to-zinc-900/80 p-4 sm:p-5 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-100">
                Partner Inference Cloud: Groq LPU Ultra-Fast Execution
              </span>
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                Sponsored Partner
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Stream Llama 3.3 70B & Mixtral at 280+ tokens/sec with deterministic sub-200ms TTFT. Claim $50 free compute credits.
            </p>
          </div>
        </div>

        <a
          href="https://groq.com?ref=tokencost_io&utm_source=tokencost_io&utm_medium=router_affiliate"
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 shadow-md transition-all active:scale-[0.98]"
        >
          <span>Claim $50 Free Credits</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
