'use client';

import React from 'react';
import { SimulationParams, ScenarioPreset } from '@/types/pricing';
import { SCENARIO_PRESETS } from '@/lib/models-data';
import { useI18n } from '@/i18n/I18nProvider';
import {
  Sliders,
  Sparkles,
  RotateCcw,
  Bot,
  Database,
  Headphones,
  Cpu,
  Share2,
  Check,
  Calculator,
} from 'lucide-react';

interface SimulatorDeckProps {
  params: SimulationParams;
  onChange: (newParams: SimulationParams) => void;
  selectedProviders: string[];
  onToggleProvider: (provider: string) => void;
  onOpenEstimator: () => void;
  onShare: () => void;
  copiedShare: boolean;
}

export default function SimulatorDeck({
  params,
  onChange,
  selectedProviders,
  onToggleProvider,
  onOpenEstimator,
  onShare,
  copiedShare,
}: SimulatorDeckProps) {
  const { t } = useI18n();

  const allProviders = [
    'All',
    'OpenAI',
    'Anthropic',
    'DeepSeek',
    'Google',
    'xAI',
    'Alibaba Qwen',
    'Mistral',
    'Meta',
    'Groq',
  ];

  const handlePresetSelect = (preset: ScenarioPreset) => {
    onChange({
      ...params,
      ...preset.params,
    });
  };

  const handleReset = () => {
    onChange({
      monthlyRequests: 100000,
      inputTokens: 4000,
      outputTokens: 1000,
      cacheHitRate: 0.65,
      batchRate: 0.0,
      enableLongContext: false,
    });
  };

  const getPresetTranslated = (id: string, defaultTitle: string, defaultSub: string) => {
    switch (id) {
      case 'general':
        return { title: t.simulator.presets.generalTitle, sub: t.simulator.presets.generalDesc };
      case 'rag':
        return { title: t.simulator.presets.ragTitle, sub: t.simulator.presets.ragDesc };
      case 'agent':
        return { title: t.simulator.presets.agentTitle, sub: t.simulator.presets.agentDesc };
      case 'support':
        return { title: t.simulator.presets.supportTitle, sub: t.simulator.presets.supportDesc };
      case 'batch':
        return { title: t.simulator.presets.batchTitle, sub: t.simulator.presets.batchDesc };
      default:
        return { title: defaultTitle, sub: defaultSub };
    }
  };

  return (
    <div className="relative rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 sm:p-6 backdrop-blur-md shadow-xl">
      {/* Hairline Sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-zinc-100 uppercase">
              {t.nav.simulator}
            </h2>
            <p className="text-xs text-zinc-400">{t.simulator.controls.estimateTokensBtn}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 rounded-xl transition-all active:scale-95"
            title="Copy shareable URL"
          >
            {copiedShare ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">{t.common.copied}</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span>{t.common.share}</span>
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 rounded-xl transition-colors"
            title="Reset to default"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Scenario Presets */}
      <div className="mb-6 space-y-2">
        <label className="text-xs font-medium text-zinc-400 flex items-center justify-between">
          <span>{t.simulator.presetsTitle}</span>
          <span className="text-[10px] text-zinc-500">1-click FinOps templates</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SCENARIO_PRESETS.map((preset) => {
            const tr = getPresetTranslated(preset.id, preset.title, preset.subtitle);
            const getIcon = () => {
              switch (preset.iconName) {
                case 'Database':
                  return <Database className="h-3.5 w-3.5" />;
                case 'Bot':
                  return <Bot className="h-3.5 w-3.5" />;
                case 'Headphones':
                  return <Headphones className="h-3.5 w-3.5" />;
                case 'Cpu':
                  return <Cpu className="h-3.5 w-3.5" />;
                default:
                  return <Sparkles className="h-3.5 w-3.5" />;
              }
            };

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className="group relative flex flex-col p-2.5 text-left rounded-xl border border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-800/60 hover:border-zinc-700/80 transition-all"
              >
                <div className="flex items-center gap-1.5 text-indigo-400 mb-1">
                  {getIcon()}
                  <span className="text-xs font-semibold text-zinc-200 group-hover:text-indigo-300">
                    {tr.title}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 line-clamp-1">{tr.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="space-y-5">
        {/* Monthly Requests */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="font-medium text-zinc-300">{t.simulator.controls.monthlyRequests}</label>
            <span className="font-mono font-semibold text-indigo-400">
              {params.monthlyRequests.toLocaleString()} reqs
            </span>
          </div>
          <input
            type="range"
            min={1000}
            max={2000000}
            step={5000}
            value={params.monthlyRequests}
            onChange={(e) =>
              onChange({ ...params, monthlyRequests: parseInt(e.target.value, 10) })
            }
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>1k</span>
            <span>500k</span>
            <span>1M</span>
            <span>2M</span>
          </div>
        </div>

        {/* Input Tokens */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <label className="font-medium text-zinc-300">{t.simulator.controls.inputTokens}</label>
              <button
                type="button"
                onClick={onOpenEstimator}
                className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
              >
                <Calculator className="h-3 w-3" />
                <span>{t.simulator.controls.estimateTokensBtn}</span>
              </button>
            </div>
            <span className="font-mono font-semibold text-zinc-200">
              {params.inputTokens.toLocaleString()} tokens
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={128000}
            step={500}
            value={params.inputTokens}
            onChange={(e) =>
              onChange({ ...params, inputTokens: parseInt(e.target.value, 10) })
            }
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>100</span>
            <span>4k</span>
            <span>16k</span>
            <span>64k</span>
            <span>128k</span>
          </div>
        </div>

        {/* Output Tokens */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="font-medium text-zinc-300">{t.simulator.controls.outputTokens}</label>
            <span className="font-mono font-semibold text-zinc-200">
              {params.outputTokens.toLocaleString()} tokens
            </span>
          </div>
          <input
            type="range"
            min={50}
            max={8192}
            step={50}
            value={params.outputTokens}
            onChange={(e) =>
              onChange({ ...params, outputTokens: parseInt(e.target.value, 10) })
            }
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>50</span>
            <span>1k</span>
            <span>2k</span>
            <span>4k</span>
            <span>8k</span>
          </div>
        </div>

        {/* Prompt Cache Hit Rate */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="font-medium text-zinc-300">{t.simulator.controls.cacheHitRate}</label>
            <span className="font-mono font-semibold text-emerald-400">
              {Math.round(params.cacheHitRate * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={params.cacheHitRate}
            onChange={(e) =>
              onChange({ ...params, cacheHitRate: parseFloat(e.target.value) })
            }
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>0% (No Cache)</span>
            <span>50%</span>
            <span>80%</span>
            <span>100% (Full Hit)</span>
          </div>
        </div>

        {/* Batch API Offload */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="font-medium text-zinc-300">{t.simulator.controls.batchOffload}</label>
            <span className="font-mono font-semibold text-indigo-400">
              {Math.round(params.batchRate * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={params.batchRate}
            onChange={(e) =>
              onChange({ ...params, batchRate: parseFloat(e.target.value) })
            }
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>0% (Realtime)</span>
            <span>50%</span>
            <span>100% (Batch 24h)</span>
          </div>
        </div>

        {/* Long Context Tier Escalation Checkbox */}
        <div className="pt-2">
          <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-800/30 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={params.enableLongContext}
              onChange={(e) =>
                onChange({ ...params, enableLongContext: e.target.checked })
              }
              className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-950"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-zinc-200">
                {t.simulator.controls.longContext}
              </span>
              <span className="text-[11px] text-zinc-500">
                {t.simulator.controls.longContextDesc}
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Provider Filter Chips */}
      <div className="mt-6 pt-5 border-t border-zinc-800/80 space-y-2">
        <label className="text-xs font-medium text-zinc-400 block">
          {t.models.filterByProvider}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {allProviders.map((prov) => {
            const isSelected = selectedProviders.includes(prov);
            return (
              <button
                key={prov}
                type="button"
                onClick={() => onToggleProvider(prov)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                    : 'bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {prov === 'All' ? t.models.allProviders : prov}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
