'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Mic,
  Video,
  ArrowRight,
  Zap,
  Scale,
  Calculator,
  HelpCircle,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { trackEvent } from '@/lib/analytics';
import { TopicFaqItem } from '@/lib/pricing-topics-seo';

interface RealtimeVoiceWorldModelSimulatorProps {
  faqs: TopicFaqItem[];
}

const VOICE_PRESETS = [
  { label: 'Startup 10k min', value: 10000 },
  { label: 'Voice SaaS 100k min', value: 100000 },
  { label: 'Call Center 500k min', value: 500000 },
];

const GENIE_PRESETS = [
  { label: '10 min (600s)', value: 600 },
  { label: '1 hr (3,600s)', value: 3600 },
  { label: '10 hrs (36,000s)', value: 36000 },
];

export default function RealtimeVoiceWorldModelSimulator({
  faqs,
}: RealtimeVoiceWorldModelSimulatorProps) {
  const { getLocalizedPath, locale } = useI18n();

  // GPT-Live-1.1 State
  const [monthlyMinutes, setMonthlyMinutes] = useState<number>(100000);
  const [standbyPercent, setStandbyPercent] = useState<number>(65);

  // Google Genie 4 State
  const [genieSeconds, setGenieSeconds] = useState<number>(3600);
  const [genieHighContext, setGenieHighContext] = useState<boolean>(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackDebounced = useCallback(
    (controlName: string, value: string | number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        trackEvent('pricing_simulator_interact', {
          topic: 'realtime-voice-world-model-api-costs',
          control_name: controlName,
          value,
          locale,
        });
      }, 300);
    },
    [locale]
  );

  // GPT-Live-1.1 Math ($0.05/min active, $0.02/min WebRTC standby)
  const safeMinutes = Math.max(0, Number.isFinite(monthlyMinutes) ? monthlyMinutes : 0);
  const standbyRatio = Math.min(0.9, Math.max(0, standbyPercent / 100));
  const activeRatio = 1 - standbyRatio;
  const blendedPerMin = activeRatio * 0.05 + standbyRatio * 0.02;
  const oldUniformMonthly = safeMinutes * 0.05;
  const newHybridMonthly = safeMinutes * blendedPerMin;
  const monthlySavings = oldUniformMonthly - newHybridMonthly;
  const savingsPercent = oldUniformMonthly > 0 ? (monthlySavings / oldUniformMonthly) * 100 : 0;

  // Google Genie 4 Math (720p 24fps = 5,760 video tokens/sec @ $17.50/M + state input @ $1.50/M)
  const videoPerSecUsd = (5760 / 1_000_000) * 17.5; // $0.1008/s
  const baseInputPerSecUsd = (67 / 1_000_000) * 1.5; // ~$0.0001005/s (~$0.006/min)
  const inputMultiplier = genieHighContext ? 4 : 1;
  const effectiveInputPerSecUsd = baseInputPerSecUsd * inputMultiplier;
  const geniePerSecUsd = videoPerSecUsd + effectiveInputPerSecUsd;
  const geniePerMinUsd = geniePerSecUsd * 60;
  const genieMonthlyTotal = genieSeconds * geniePerSecUsd;
  const videoSharePct = (videoPerSecUsd / geniePerSecUsd) * 100;
  const inputSharePct = 100 - videoSharePct;

  const formatUsd = (val: number, decimals = 2) =>
    val.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  return (
    <div className="space-y-8">
      {/* Module 1: Dual Engine Interactive Calculators */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: GPT-Live-1.1 Real-Time Voice & WebRTC Standby */}
        <div className="lg:col-span-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-5 sm:p-6 backdrop-blur-md shadow-xl flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400">
                  <Mic className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                    OpenAI GPT-Live-1.1 Standby Calculator
                  </h2>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Active $0.05/min ($3.00/hr) vs WebRTC Standby $0.02/min (-60%)
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300">
                WebRTC Standby
              </span>
            </div>

            {/* Control 1: Monthly Voice Minutes */}
            <div className="space-y-2">
              <label
                htmlFor="voice-minutes-input"
                className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                <span>Monthly Voice Session Minutes</span>
                <span className="font-mono text-zinc-500 dark:text-zinc-400">
                  {(safeMinutes / 60).toLocaleString('en-US', { maximumFractionDigits: 0 })} hrs/mo
                </span>
              </label>
              <input
                id="voice-minutes-input"
                type="number"
                min={0}
                step={1000}
                value={monthlyMinutes}
                onChange={(e) => {
                  const next = Math.max(0, Number(e.target.value) || 0);
                  setMonthlyMinutes(next);
                  trackDebounced('voice_minutes', next);
                }}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex flex-wrap gap-1.5">
                {VOICE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setMonthlyMinutes(preset.value);
                      trackDebounced('voice_minutes', preset.value);
                    }}
                    className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                      monthlyMinutes === preset.value
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-zinc-100 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Control 2: Standby Ratio Slider */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <label
                  htmlFor="standby-ratio-slider"
                  className="font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Idle WebRTC Standby Share
                </label>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/25 text-indigo-700 dark:text-indigo-300 font-semibold">
                    Active: {100 - standbyPercent}%
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-semibold">
                    Standby: {standbyPercent}%
                  </span>
                </div>
              </div>
              <input
                id="standby-ratio-slider"
                type="range"
                min={0}
                max={90}
                step={5}
                value={standbyPercent}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setStandbyPercent(next);
                  trackDebounced('standby_ratio', next);
                }}
                className="w-full"
              />
              {/* Dual-segment visual bar */}
              <div className="h-2 w-full rounded-full flex overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                <div
                  className="bg-indigo-500 transition-all duration-150"
                  style={{ width: `${100 - standbyPercent}%` }}
                />
                <div
                  className="bg-emerald-500 transition-all duration-150"
                  style={{ width: `${standbyPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* 2x2 KPI Output Sub-Cards */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/70 p-3">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                Old Uniform Billing ($0.05/m)
              </span>
              <span className="text-base sm:text-lg font-mono font-semibold text-zinc-400 line-through">
                ${formatUsd(oldUniformMonthly)}
              </span>
            </div>

            <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/[0.06] dark:bg-indigo-950/25 p-3">
              <span className="text-[10px] uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block font-semibold">
                New Hybrid Billing
              </span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-zinc-900 dark:text-zinc-50">
                ${formatUsd(newHybridMonthly)}
              </span>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
              <span className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block font-semibold">
                Monthly Net Savings
              </span>
              <span className="text-sm sm:text-base font-mono font-bold text-emerald-700 dark:text-emerald-400">
                -${formatUsd(monthlySavings)}/mo (-{savingsPercent.toFixed(1)}%)
              </span>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/70 p-3">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                Effective Blended Rate
              </span>
              <span className="text-sm sm:text-base font-mono font-bold text-zinc-900 dark:text-zinc-100">
                ${blendedPerMin.toFixed(4)} / min
              </span>
            </div>
          </div>
        </div>

        {/* Right Card: Google Genie 4 World Model Video Budget Simulator */}
        <div className="lg:col-span-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-5 sm:p-6 backdrop-blur-md shadow-xl flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-600 dark:text-purple-400">
                  <Video className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                    Google Genie 4 World Model Simulator
                  </h2>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    720p · 24fps · 5,760 video tok/s ($17.50/M out, $1.50/M in)
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold bg-purple-500/10 border border-purple-500/25 text-purple-700 dark:text-purple-300">
                Paid Tier Only
              </span>
            </div>

            {/* Control 1: Seconds / Month */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <label htmlFor="genie-seconds-slider">Monthly Streaming Seconds</label>
                <span className="font-mono font-bold text-purple-700 dark:text-purple-300">
                  {genieSeconds.toLocaleString('en-US')}s ({(genieSeconds / 60).toFixed(1)} min)
                </span>
              </div>
              <input
                id="genie-seconds-slider"
                type="range"
                min={60}
                max={36000}
                step={60}
                value={genieSeconds}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setGenieSeconds(next);
                  trackDebounced('genie_seconds', next);
                }}
                className="w-full"
              />
              <div className="flex flex-wrap gap-1.5">
                {GENIE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setGenieSeconds(preset.value);
                      trackDebounced('genie_seconds', preset.value);
                    }}
                    className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                      genieSeconds === preset.value
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-zinc-100 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Control 2: Segmented Context Mode */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
                Interaction &amp; State Context Profile
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGenieHighContext(false);
                    trackDebounced('genie_mode', 'baseline_720p_24fps');
                  }}
                  className={`min-h-[42px] px-3 py-2 rounded-xl border text-left text-[11px] transition-all ${
                    !genieHighContext
                      ? 'border-purple-500/60 bg-purple-500/10 text-purple-900 dark:text-purple-200 font-semibold'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  720p · 24fps + 48kHz Audio (GA Baseline)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGenieHighContext(true);
                    trackDebounced('genie_mode', 'high_context_4x_input');
                  }}
                  className={`min-h-[42px] px-3 py-2 rounded-xl border text-left text-[11px] transition-all ${
                    genieHighContext
                      ? 'border-purple-500/60 bg-purple-500/10 text-purple-900 dark:text-purple-200 font-semibold'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  High-Context Prompting (Est. 4× Input Turns)
                </button>
              </div>
            </div>
          </div>

          {/* 3-Unit Conversion Output + Progress Bar */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/70 p-3">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                  Per Second
                </span>
                <span className="text-sm sm:text-base font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  ~${geniePerSecUsd.toFixed(3)}/s
                </span>
              </div>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/70 p-3">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                  Per Minute
                </span>
                <span className="text-sm sm:text-base font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  ~${formatUsd(geniePerMinUsd)}/m
                </span>
              </div>
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3">
                <span className="text-[10px] uppercase tracking-wider text-purple-700 dark:text-purple-300 block font-semibold">
                  Monthly Total
                </span>
                <span className="text-sm sm:text-base font-mono font-bold text-purple-700 dark:text-purple-200">
                  ${formatUsd(genieMonthlyTotal)}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  Video Output ({videoSharePct.toFixed(1)}%) vs Text/State Input ({inputSharePct.toFixed(1)}%)
                </span>
                <span className="font-mono text-zinc-500 dark:text-zinc-400">
                  {(genieSeconds * 5760 / 1_000_000).toFixed(2)}M video tok
                </span>
              </div>
              <div className="h-2 w-full rounded-full flex overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                <div className="bg-purple-500" style={{ width: `${videoSharePct}%` }} />
                <div className="bg-cyan-500" style={{ width: `${inputSharePct}%` }} />
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Tip: Video frames dominate &gt;99% of Genie 4 billing—cap stream TTL and cascade non-visual reasoning to text routers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Module 2: Unit Economics Conversion Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Real-Time Multimodal Unit Economics Comparison
          </h2>
          <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            Verified Nov 20, 2026 Rates
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/85 dark:bg-zinc-900/60 backdrop-blur-md shadow-xl">
          <table className="w-full text-left text-xs min-w-[680px]">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-950/70 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                <th className="py-3 px-4 sticky left-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  Model / Mode
                </th>
                <th className="py-3 px-4">Billing Unit</th>
                <th className="py-3 px-4">Raw Rate</th>
                <th className="py-3 px-4">Per Minute Eq.</th>
                <th className="py-3 px-4">10,000-Min Est.</th>
                <th className="py-3 px-4">Best Use Case</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/70 text-zinc-700 dark:text-zinc-300">
              <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100 sticky left-0 bg-white dark:bg-zinc-900 z-10">
                  GPT-Live-1.1 (Active)
                </td>
                <td className="py-3 px-4">Per-Second Session</td>
                <td className="py-3 px-4 font-mono">$0.05 / min</td>
                <td className="py-3 px-4 font-mono">$0.0500 / min</td>
                <td className="py-3 px-4 font-mono font-semibold">$500.00</td>
                <td className="py-3 px-4">Full-duplex speech &amp; live turn-taking</td>
              </tr>
              <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 bg-emerald-500/[0.04]">
                <td className="py-3 px-4 font-semibold text-emerald-700 dark:text-emerald-300 sticky left-0 bg-emerald-50/80 dark:bg-zinc-900 z-10">
                  GPT-Live-1.1 (WebRTC Standby -60%)
                </td>
                <td className="py-3 px-4">Idle Connection (5–60s)</td>
                <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400">$0.02 / min</td>
                <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400">$0.0200 / min</td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">$200.00</td>
                <td className="py-3 px-4">Persistent voice channels &amp; pause-heavy agents</td>
              </tr>
              <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                <td className="py-3 px-4 font-semibold text-purple-700 dark:text-purple-300 sticky left-0 bg-white dark:bg-zinc-900 z-10">
                  Google Genie 4 (720p 24fps)
                </td>
                <td className="py-3 px-4">5,760 video tok/s</td>
                <td className="py-3 px-4 font-mono">$17.50 / 1M out</td>
                <td className="py-3 px-4 font-mono font-semibold">~$6.05 / min</td>
                <td className="py-3 px-4 font-mono font-semibold">$60,500.00</td>
                <td className="py-3 px-4">Interactive 3D world simulation &amp; gaming QA</td>
              </tr>
              <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100 sticky left-0 bg-white dark:bg-zinc-900 z-10">
                  Groq LPU + Whisper Pipeline (OSS)
                </td>
                <td className="py-3 px-4">LPU Token + Audio</td>
                <td className="py-3 px-4 font-mono">$0.59 / $0.79 (1M)</td>
                <td className="py-3 px-4 font-mono">~$0.004 / min</td>
                <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400">~$40.00</td>
                <td className="py-3 px-4">420 t/s sub-200ms TTFT modular voice stack</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Module 3: Bidirectional Funnel Cards -> Compare & Calculator */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
          Next Step: Compare Orchestration Flagships &amp; Cascade Costs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href={getLocalizedPath('/compare/gemini-4-neon-vs-gpt-6.2-sol/')}
            className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 p-4 hover:border-indigo-500/50 transition-all flex flex-col justify-between gap-2"
          >
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                <Scale className="h-3 w-3" />
                COMPARE FLAGSHIPS
              </span>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                Compare Gemini 4 Flagship Tiers
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Gemini 4 Neon ($3/$15, 61.4 AA) vs GPT-6.2 Sol ($2/$10) orchestration cost.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <span>Inspect Side-by-Side</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>

          <Link
            href={getLocalizedPath('/compare/gpt-6.2-astra-vs-claude-opus-5.5/')}
            className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 p-4 hover:border-indigo-500/50 transition-all flex flex-col justify-between gap-2"
          >
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-purple-600 dark:text-purple-400">
                <Zap className="h-3 w-3" />
                OPENAI STACK AUDIT
              </span>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                Audit OpenAI Flagship Stack
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Benchmark GPT-6.2 Astra vs Claude Opus 5.5 reasoning &amp; cache savings.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <span>Open Benchmark</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>

          <Link
            href={getLocalizedPath('/calculator/deepseek-v4.1-flash/')}
            className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 p-4 hover:border-emerald-500/50 transition-all flex flex-col justify-between gap-2"
          >
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                <Calculator className="h-3 w-3" />
                CASCADE OFFROAD
              </span>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
                Simulate Text Cascade Cost
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Offload background RAG &amp; tool routing to DeepSeek-V4.1-Flash ($0.006/M cache).
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span>Launch Calculator</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        </div>
      </section>

      {/* Module 4: FAQ Accordion matching FAQPage Schema */}
      {faqs.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 p-6 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 p-4 space-y-1.5"
              >
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-mono">
                    {idx + 1}
                  </span>
                  <span>{faq.question}</span>
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pl-7">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
