'use client';

import SubscribeBox from '@/components/SubscribeBox';
import RecentPriceChanges from '@/components/RecentPriceChanges';
import React, { useState, useMemo, useEffect } from 'react';
import { trackEvent, trackEventThrottled } from '@/lib/analytics';
import { SimulationParams, RouterRecommendation } from '@/types/pricing';
import { MODELS_DATA } from '@/lib/models-data';
import { calculateAllModels, calculateMainstreamModels, calculateModelCost } from '@/lib/calculator-engine';
import { generateRouterRecommendations } from '@/lib/router-engine';
import { formatCurrency } from '@/lib/utils';
import { DEFAULT_SCENARIO, decodeScenario, encodeScenario, readScenarios, storeScenario } from '@/lib/scenarios';
import { useI18n } from '@/i18n/I18nProvider';
import { formatModelCount } from '@/i18n';
import { buildLocalizedCanonical } from '@/lib/seo-alternates';
import SchemaOrg from '@/components/seo/SchemaOrg';
import SimulatorDeck from '@/components/SimulatorDeck';
import SimpleComparisonPreview from '@/components/SimpleComparisonPreview';
import CostChart from '@/components/CostChart';
import SmartRouterCard from '@/components/SmartRouterCard';
import LeaderboardTable from '@/components/LeaderboardTable';
import SponsorBanner from '@/components/SponsorBanner';
import ConfigExporterModal from '@/components/ConfigExporterModal';
import TokenEstimatorModal from '@/components/TokenEstimatorModal';
import MarketPulseRadar from '@/components/MarketPulseRadar';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import officialDealsRaw from '@/data/official_deals.json';

function formatHomeBannerBadge(template: string, verifiedDate: string, bfDate: string): string {
  const [vy, vm, vd] = verifiedDate.split('-').map(Number);
  const [by, bm, bd] = bfDate.split('-').map(Number);
  const verifiedUtc = vy && vm && vd ? Date.UTC(vy, vm - 1, vd) : Date.now();
  const bfUtc = by && bm && bd ? Date.UTC(by, bm - 1, bd) : verifiedUtc;
  const days = Math.max(0, Math.round((bfUtc - verifiedUtc) / 86400000));
  const shortDate = verifiedDate.length >= 10 ? `${verifiedDate.slice(5, 7)}/${verifiedDate.slice(8, 10)}` : verifiedDate;
  return template.replace('{days}', String(days)).replace('{shortDate}', shortDate);
}

function SimulatorContent() {
  const { t } = useI18n();
  const [scenario, setScenario] = useState(DEFAULT_SCENARIO);
  const { params, providers: selectedProviders, baseline: selectedBaselineId, strategy, advanced } = scenario;
  const [saved, setSaved] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setScenario(decodeScenario(new URLSearchParams(window.location.search)));
    try {
      setSaved(readScenarios(window.localStorage));
    } catch {
      // Storage can be unavailable in private browsing.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(''), 3000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const updateParams = (params: SimulationParams) => {
    setScenario((current) => ({ ...current, params }));
    trackEventThrottled('simulator_run');
  };

  const [exporterModalOpen, setExporterModalOpen] = useState(false);
  const [selectedRecForExport, setSelectedRecForExport] = useState<RouterRecommendation | null>(null);
  const [estimatorModalOpen, setEstimatorModalOpen] = useState(false);

  const toggleProvider = (provider: string) => {
    const providers =
      provider === 'All'
        ? ['All']
        : selectedProviders.includes('All')
          ? [provider]
          : selectedProviders.includes(provider)
            ? selectedProviders.filter((item) => item !== provider)
            : [...selectedProviders, provider];
    setScenario((current) => ({ ...current, providers: providers.length ? providers : ['All'] }));
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

  const baselineNetCost = useMemo(() => {
    return calculateModelCost(selectedBaselineModel, params).monthlyNetCost;
  }, [selectedBaselineModel, params]);

  // Generate router recommendations dynamically with the selected baseline
  const routerRecs = useMemo(() => {
    return generateRouterRecommendations(MODELS_DATA, params, selectedBaselineModel);
  }, [params, selectedBaselineModel]);

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}?${encodeScenario(scenario)}`;
      await navigator.clipboard.writeText(url);
      setFeedback(t.common.shareSuccess);
      trackEvent('scenario_share_copy');
    } catch {
      setFeedback(t.scenarios.shareError);
    }
  };

  const handleSave = () => {
    try {
      setSaved(storeScenario(window.localStorage, scenario));
      setFeedback(t.scenarios.saved);
      trackEvent('scenario_save');
    } catch {
      setFeedback(t.scenarios.saveError);
    }
  };

  const handleOpenExporter = (rec: RouterRecommendation) => {
    setSelectedRecForExport(rec);
    setExporterModalOpen(true);
  };

  return (
    <fieldset disabled={!hydrated} className="min-w-0 space-y-5 sm:space-y-6">
      {/* Primary Dual-Mode Bento Workspace */}
      <div data-analytics-module="calculator" className="w-full">
        {!advanced ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-7 min-w-0">
              <SimulatorDeck
                params={params}
                onChange={updateParams}
                selectedProviders={selectedProviders}
                onToggleProvider={toggleProvider}
                advanced={false}
                onToggleAdvanced={() => {
                  setScenario((current) => ({ ...current, advanced: true }));
                  trackEvent('advanced_toggle', { value: 'open' });
                }}
                onShare={handleShare}
                onSave={handleSave}
                saved={saved}
                feedback={feedback}
                onRestore={(encoded) => {
                  setScenario(decodeScenario(new URLSearchParams(encoded)));
                  setFeedback(t.scenarios.restored);
                  trackEventThrottled('simulator_run');
                }}
                monthlyCost={formatCurrency(baselineNetCost)}
                modelName={selectedBaselineModel.modelName}
                onOpenEstimator={() => setEstimatorModalOpen(true)}
                className="h-full"
              />
            </div>

            <div className="lg:col-span-5 min-w-0">
              <SimpleComparisonPreview
                breakdowns={allBreakdowns}
                routerRecs={routerRecs}
                baselineModel={selectedBaselineModel}
                baselineCost={baselineNetCost}
                onExpandAdvanced={() => {
                  setScenario((current) => ({ ...current, advanced: true }));
                  trackEvent('advanced_toggle', { value: 'open', source: 'simple_preview_cta' });
                }}
                className="h-full"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-4 xl:col-span-3 min-w-0">
              <SimulatorDeck
                params={params}
                onChange={updateParams}
                selectedProviders={selectedProviders}
                onToggleProvider={toggleProvider}
                advanced={true}
                onToggleAdvanced={() => {
                  setScenario((current) => ({ ...current, advanced: false }));
                  trackEvent('advanced_toggle', { value: 'closed' });
                }}
                onShare={handleShare}
                onSave={handleSave}
                saved={saved}
                feedback={feedback}
                onRestore={(encoded) => {
                  setScenario(decodeScenario(new URLSearchParams(encoded)));
                  setFeedback(t.scenarios.restored);
                  trackEventThrottled('simulator_run');
                }}
                monthlyCost={formatCurrency(baselineNetCost)}
                modelName={selectedBaselineModel.modelName}
                onOpenEstimator={() => setEstimatorModalOpen(true)}
              />
            </div>

            <div data-analytics-module="smart_router" className="lg:col-span-8 xl:col-span-5 min-w-0">
              <SmartRouterCard
                recommendations={routerRecs}
                onOpenExporter={handleOpenExporter}
                selectedBaselineId={selectedBaselineId}
                onSelectBaseline={(baseline) => setScenario((current) => ({ ...current, baseline }))}
                selectedStrategyId={strategy}
                onSelectStrategy={(strategy) => setScenario((current) => ({ ...current, strategy }))}
                availableModels={MODELS_DATA}
                monthlyRequests={params.monthlyRequests}
              />
            </div>

            <div className="lg:col-span-12 xl:col-span-4 min-w-0">
              <CostChart breakdowns={mainstreamBreakdowns} />
            </div>
          </div>
        )}
      </div>

      {/* Primary Commercial Anchor */}
      <div data-analytics-module="sponsor">
        <SponsorBanner />
      </div>

      {/* Market Radar / Featured Event Strip & Price Drops */}
      <section data-analytics-module="radar">
        <MarketPulseRadar />
      </section>

      {/* Adaptive 12-Col Alerts & Recent Price Changes Group */}
      <div className="group grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-12 group-has-[[data-price-changes]]:lg:col-span-5 min-w-0">
          <SubscribeBox placement="home" />
        </div>
        <RecentPriceChanges />
      </div>

      {/* Full Width Model Leaderboard */}
      <div data-analytics-module="leaderboard">
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
          updateParams({
            ...params,
            inputTokens: tokens,
          });
        }}
      />
    </fieldset>
  );
}

export default function HomePage() {
  const { t, locale, getLocalizedPath } = useI18n();
  const modelCount = MODELS_DATA.length;
  const isZh = locale === 'zh-CN' || locale === 'zh-TW';

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">
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
          <span>
            {t.simulator.heroBadge} • {formatModelCount(t.common.modelsCount, modelCount)} (Gemini 4 Neon, GPT-6.2 Sol/Astra, Claude 5.5, DeepSeek-V4.1)
          </span>
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
          {locale === 'zh-CN' && (
            <Link
              href="/zh-CN/domestic-models/"
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50/90 dark:bg-amber-500/10 border border-amber-200/90 dark:border-amber-500/30 text-amber-900 dark:text-amber-300 hover:bg-amber-100/80 dark:hover:bg-amber-500/20 hover:border-amber-300 dark:hover:border-amber-400/50 shadow-sm dark:shadow-none transition-colors"
            >
              <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-amber-200/80 dark:bg-amber-500/20 font-mono text-[10px] font-bold text-amber-900 dark:text-amber-200">
                ¥
              </span>
              <span className="font-medium">{t.domestic.title}</span>
              <ArrowRight className="h-3 w-3 shrink-0" />
            </Link>
          )}
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
            <span>
              {formatHomeBannerBadge(
                t.deals.homeBannerBadge,
                officialDealsRaw.lastVerifiedDate,
                officialDealsRaw.blackFridayDate
              )}
            </span>
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
      <SimulatorContent />
    </div>
  );
}
