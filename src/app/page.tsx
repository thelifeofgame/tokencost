'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SimulationParams, RouterRecommendation } from '@/types/pricing';
import { MODELS_DATA } from '@/lib/models-data';
import { calculateAllModels, calculateMainstreamModels } from '@/lib/calculator-engine';
import { generateRouterRecommendations } from '@/lib/router-engine';
import { encodeSimulationParams, decodeSimulationParams } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nProvider';
import { formatModelCount } from '@/i18n';
import { buildLocalizedCanonical } from '@/lib/seo-alternates';
import SchemaOrg from '@/components/seo/SchemaOrg';
import SimulatorDeck from '@/components/SimulatorDeck';
import CostChart from '@/components/CostChart';
import SmartRouterCard from '@/components/SmartRouterCard';
import LeaderboardTable from '@/components/LeaderboardTable';
import SponsorBanner from '@/components/SponsorBanner';
import ConfigExporterModal from '@/components/ConfigExporterModal';
import TokenEstimatorModal from '@/components/TokenEstimatorModal';
import MarketPulseRadar from '@/components/MarketPulseRadar';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
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
  const [selectedBaselineId, setSelectedBaselineId] = useState<string>('gpt-6.2-sol');

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

  // Mainstream models for CostChart
  const mainstreamBreakdowns = useMemo(() => {
    return calculateMainstreamModels(MODELS_DATA, params, selectedProviders);
  }, [params, selectedProviders]);

  // Selected baseline model object
  const selectedBaselineModel = useMemo(() => {
    return (
      MODELS_DATA.find((m) => m.modelId === selectedBaselineId) ||
      MODELS_DATA.find((m) => m.modelId === 'gpt-6.2-sol') ||
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
        <div data-analytics-module="calculator" className="col-span-12 lg:col-span-5 xl:col-span-3 space-y-5">
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
          <div data-analytics-module="smart_router">
          <SmartRouterCard
            recommendations={routerRecs}
            onOpenExporter={handleOpenExporter}
            selectedBaselineId={selectedBaselineId}
            onSelectBaseline={setSelectedBaselineId}
            availableModels={MODELS_DATA}
            monthlyRequests={params.monthlyRequests}
          />
          </div>

          {/* Dual-Engine Sponsored Provider Placement */}
          <div data-analytics-module="sponsor">
            <SponsorBanner />
          </div>
        </div>

        {/* Right Column: Monthly Net Cost Waterfall Breakdown (4 cols on xl, 12 on lg) */}
        <div className="col-span-12 lg:col-span-12 xl:col-span-4 space-y-5">
          <CostChart breakdowns={mainstreamBreakdowns} />
        </div>
      </div>

      {/* Market Radar / Featured Event Strip & Price Drops */}
      <section data-analytics-module="radar" className="pt-2">
        <MarketPulseRadar />
      </section>

      {/* Full Width Model Leaderboard */}
      <div data-analytics-module="leaderboard" className="pt-2">
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
  const { t, locale, getLocalizedPath } = useI18n();
  const modelCount = MODELS_DATA.length;
  const isZh = locale === 'zh-CN' || locale === 'zh-TW';

  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <SchemaOrg
        type="software"
        name={`${t.common.brand} | ${t.simulator.heroTitle}`}
        description={formatModelCount(t.simulator.heroDesc, modelCount)}
        url={buildLocalizedCanonical('/', locale)}
        inLanguage={locale}
        includeHreflang={false}
      />

      {/* Pre-rendered Static Hero Section */}
      <div className="relative text-center max-w-4xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-xs font-medium text-indigo-700 dark:text-indigo-400">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{t.simulator.heroBadge} • {modelCount}+ Models (Gemini 4 Neon, GPT-6.2 Sol/Astra, Claude 5.5, DeepSeek-V4.1)</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
          {t.simulator.heroTitle}{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 dark:from-indigo-400 dark:via-indigo-300 dark:to-emerald-400 bg-clip-text text-transparent">
            Simulate, Route &amp; Save up to 90%
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          {formatModelCount(t.simulator.heroDesc, modelCount)}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1 text-xs">
          <Link
            href={getLocalizedPath('/models/')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm dark:shadow-none transition-colors"
          >
            <span>{formatModelCount(t.common.modelsCount, modelCount)}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
          <Link
            href={getLocalizedPath('/compare/gemini-4-neon-vs-gpt-6.2-sol/')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm dark:shadow-none transition-colors"
          >
            <span>🔥 {t.simulator.quickCompareGptClaude}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
          <Link
            href={getLocalizedPath('/compare/claude-sonnet-5.5-vs-deepseek-v4.1-flash/')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm dark:shadow-none transition-colors"
          >
            <span>⚡ {t.simulator.quickCompareDeepseekLlama}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
          <Link
            href={getLocalizedPath('/harness/')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 hover:border-indigo-300 dark:hover:border-indigo-400/50 transition-colors"
          >
            <span>🛠️ {t.nav.harness} (1.2x–3.8x)</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
          <Link
            href={getLocalizedPath('/pricing/realtime-voice-world-model-api-costs/')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 hover:border-purple-300 dark:hover:border-purple-400/50 transition-colors"
          >
            <span>
              {isZh
                ? '🎙️ Genie 4 ($0.10/s) 与实时语音待机算费指南'
                : '🎙️ Genie 4 ($0.10/s) & GPT-Live Standby Guide'}
            </span>
            <ArrowRight className="h-3 w-3" />
          </Link>
          <Link
            href={getLocalizedPath('/pricing/gemini-4-carbon-dec-1-migration-guide/')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 hover:text-rose-800 dark:hover:text-rose-200 hover:border-rose-300 dark:hover:border-rose-400/50 transition-colors"
          >
            <span>
              {isZh
                ? '⚠️ Gemini 4 Carbon 12/1 翻倍涨价与 o3 迁移攻略'
                : '⚠️ Gemini 4 Carbon Dec 1 2x Hike & o3 Migration'}
            </span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Lightweight Official Deals & Billing Watch Entry Strip */}
      <Link
        href={getLocalizedPath('/deals/')}
        className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 rounded-xl border border-emerald-200/90 dark:border-emerald-500/25 bg-gradient-to-r from-emerald-50/80 via-white/95 to-amber-50/60 dark:from-emerald-950/25 dark:via-zinc-900/75 dark:to-amber-950/20 px-3.5 py-2.5 backdrop-blur-sm shadow-sm shadow-zinc-950/[0.03] dark:shadow-none hover:border-emerald-300 dark:hover:border-emerald-400/45 transition-all"
      >
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 shrink-0">
            <ShieldCheck className="h-3 w-3 text-emerald-700 dark:text-emerald-400" />
            <span>{t.deals.homeBannerBadge}</span>
          </span>
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 line-clamp-2 sm:truncate">
            {t.deals.homeBannerText}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 whitespace-nowrap shrink-0">
          <span>{t.deals.homeBannerCta}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>

      {/* Core Cost Simulator */}
      <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center text-zinc-500 font-mono text-sm">{t.common.loading}</div>}>
        <SimulatorContent />
      </Suspense>
    </div>
  );
}
