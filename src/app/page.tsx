'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SimulationParams, RouterRecommendation } from '@/types/pricing';
import { MODELS_DATA } from '@/lib/models-data';
import { calculateAllModels, calculateMainstreamModels } from '@/lib/calculator-engine';
import { generateRouterRecommendations } from '@/lib/router-engine';
import { encodeSimulationParams, decodeSimulationParams } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nProvider';
import SimulatorDeck from '@/components/SimulatorDeck';
import CostChart from '@/components/CostChart';
import SmartRouterCard from '@/components/SmartRouterCard';
import LeaderboardTable from '@/components/LeaderboardTable';
import SponsorBanner from '@/components/SponsorBanner';
import ConfigExporterModal from '@/components/ConfigExporterModal';
import TokenEstimatorModal from '@/components/TokenEstimatorModal';
import MarketPulseRadar from '@/components/MarketPulseRadar';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const defaultParams: SimulationParams = {
  monthlyRequests: 100000,
  inputTokens: 4000,
  outputTokens: 1000,
  cacheHitRate: 0.65,
  batchRate: 0.0,
  enableLongContext: false,
};

function SimulatorContent() {
  const searchParams = useSearchParams();

  const [params, setParams] = useState<SimulationParams>(() =>
    decodeSimulationParams(searchParams, defaultParams)
  );

  const [selectedProviders, setSelectedProviders] = useState<string[]>(['All']);
  const [selectedBaselineId, setSelectedBaselineId] = useState<string>('gpt-6.1-terra');

  const [exporterModalOpen, setExporterModalOpen] = useState(false);
  const [selectedRecForExport, setSelectedRecForExport] = useState<RouterRecommendation | null>(null);
  const [estimatorModalOpen, setEstimatorModalOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Sync params to URL query
  useEffect(() => {
    const q = encodeSimulationParams(params);
    const newUrl = `${window.location.pathname}?${q}`;
    window.history.replaceState({}, '', newUrl);
  }, [params]);

  const toggleProvider = (provider: string) => {
    if (provider === 'All') {
      setSelectedProviders(['All']);
      return;
    }
    if (selectedProviders.includes('All')) {
      setSelectedProviders([provider]);
      return;
    }
    if (selectedProviders.includes(provider)) {
      if (selectedProviders.length > 1) {
        setSelectedProviders(selectedProviders.filter((p) => p !== provider));
      } else {
        setSelectedProviders(['All']);
      }
    } else {
      setSelectedProviders([...selectedProviders, provider]);
    }
  };

  // Filter models by selected provider
  const filteredModels = useMemo(() => {
    if (selectedProviders.includes('All')) {
      return MODELS_DATA;
    }
    return MODELS_DATA.filter((m) => selectedProviders.includes(m.providerOrg));
  }, [selectedProviders]);

  // Calculate costs for all models
  const allBreakdowns = useMemo(() => {
    return calculateAllModels(filteredModels, params);
  }, [filteredModels, params]);

  // Mainstream models for CostChart (sorted from low to high: GPT-6 Luna to Claude Fable 5.2)
  const mainstreamBreakdowns = useMemo(() => {
    return calculateMainstreamModels(MODELS_DATA, params, selectedProviders);
  }, [params, selectedProviders]);

  // Selected baseline model object
  const selectedBaselineModel = useMemo(() => {
    return (
      MODELS_DATA.find((m) => m.modelId === selectedBaselineId) ||
      MODELS_DATA.find((m) => m.modelId === 'gpt-6.1-terra') ||
      MODELS_DATA[0]
    );
  }, [selectedBaselineId]);

  // Generate router recommendations dynamically with the selected baseline
  const routerRecs = useMemo(() => {
    return generateRouterRecommendations(MODELS_DATA, params, selectedBaselineModel);
  }, [params, selectedBaselineModel]);

  const handleShare = () => {
    const q = encodeSimulationParams(params);
    const url = `${window.location.origin}${window.location.pathname}?${q}`;
    navigator.clipboard.writeText(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handleOpenExporter = (rec: RouterRecommendation) => {
    setSelectedRecForExport(rec);
    setExporterModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Main 3-Column Parallel Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-5 items-start">
        {/* Left Column: Workload Simulator Controls (3 cols on xl, 5 on lg) */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-3 space-y-5">
          <SimulatorDeck
            params={params}
            onChange={setParams}
            selectedProviders={selectedProviders}
            onToggleProvider={toggleProvider}
            onOpenEstimator={() => setEstimatorModalOpen(true)}
            onShare={handleShare}
            copiedShare={copiedShare}
          />
        </div>

        {/* Middle Column: Smart Router Strategy & Comparison (5 cols on xl, 7 on lg) */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-5 space-y-5">
          <SmartRouterCard
            recommendations={routerRecs}
            onOpenExporter={handleOpenExporter}
            selectedBaselineId={selectedBaselineId}
            onSelectBaseline={setSelectedBaselineId}
            availableModels={MODELS_DATA}
          />

          {/* Sponsored Provider Placement */}
          <SponsorBanner />
        </div>

        {/* Right Column: Monthly Net Cost Waterfall Breakdown (4 cols on xl, 12 on lg) */}
        <div className="col-span-12 lg:col-span-12 xl:col-span-4 space-y-5">
          <CostChart breakdowns={mainstreamBreakdowns} />
        </div>
      </div>

      {/* 行业热点与降价雷达 (Market Radar / Price Drops) */}
      <section className="pt-2">
        <MarketPulseRadar />
      </section>

      {/* Full Width Model Leaderboard (Full catalog of 371 models) */}
      <div className="pt-2">
        <LeaderboardTable breakdowns={allBreakdowns} />
      </div>

      {/* Modals */}
      <ConfigExporterModal
        isOpen={exporterModalOpen}
        onClose={() => setExporterModalOpen(false)}
        recommendation={selectedRecForExport}
      />

      <TokenEstimatorModal
        isOpen={estimatorModalOpen}
        onClose={() => setEstimatorModalOpen(false)}
        onApplyTokens={(tokens: number) => {
          setParams({
            ...params,
            inputTokens: tokens,
          });
        }}
      />
    </div>
  );
}

export default function HomePage() {
  const { t, getLocalizedPath } = useI18n();

  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Pre-rendered Static Hero Section (紧凑现代，确保第一屏清晰直达计算器) */}
      <div className="relative text-center max-w-4xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>{t.simulator.heroBadge} • 371 Models (GPT-6.1 Sol/Terra, Claude 5.5, Gemini 4, DeepSeek R1/V4)</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-100 leading-tight">
          {t.simulator.heroTitle}{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
            Simulate, Route & Save up to 90%
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          {t.simulator.heroDesc}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1 text-xs">
          <Link
            href={getLocalizedPath('/models')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
          >
            <span>{t.nav.models} (371)</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
          <Link
            href={getLocalizedPath('/compare/claude-sonnet-5.5-vs-gpt-6.1-sol/')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
          >
            <span>🔥 2026 旗舰：GPT-6.1 Sol vs Claude 5.5</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
          <Link
            href={getLocalizedPath('/compare/deepseek-r1-vs-openai-o1/')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
          >
            <span>🧠 深度推理：DeepSeek-R1 vs o1 (-96%)</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
          <Link
            href={getLocalizedPath('/compare/deepseek-v4.1-flash-vs-gpt-6.1-terra/')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
          >
            <span>⚡ 极速降本：V4.1-Flash vs Terra ($0.004/M)</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* 核心算费模拟器 (首屏即见，三栏并排) */}
      <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center text-zinc-500 font-mono text-sm">{t.common.loading}</div>}>
        <SimulatorContent />
      </Suspense>
    </div>
  );
}
