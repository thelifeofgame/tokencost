'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  MODELS_DATA,
  NON_TOKEN_MODELS,
  ALL_DIRECTORY_MODELS,
  DirectoryCapabilityFilterKey,
  matchesDirectoryCapabilityFilter,
} from '@/lib/models-data';
import { isNonTokenModel, NonTokenModelRule } from '@/types/pricing';
import {
  Search,
  ChevronRight,
  Filter,
  Sparkles,
  ChevronDown,
  ExternalLink,
  Radio,
  Layers,
  Brain,
  Percent,
  Check,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import SchemaOrg from '@/components/seo/SchemaOrg';
import TrackedAffiliateLink from '@/components/TrackedAffiliateLink';
import { useI18n } from '@/i18n/I18nProvider';
import { formatModelCount, Locale } from '@/i18n';
import { formatPerMillionPrice } from '@/lib/utils';
import { buildLocalizedCanonical } from '@/lib/seo-alternates';

const QUICK_PROVIDERS = [
  'All',
  'Frontier 2026',
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

const DISPLAY_UNIT_OVERRIDE: Record<
  string,
  { primaryLabel: string; rateValue: string; unitSuffix: string; secondaryLabel: string; secondaryValue: string; footerText: string }
> = {
  'lyria-3-clip-preview': {
    primaryLabel: 'Per Clip (30s)',
    rateValue: '$0.04',
    unitSuffix: '/clip',
    secondaryLabel: 'Audio Output',
    secondaryValue: '48kHz Stereo',
    footerText: 'Flat per-clip billing (non-token)',
  },
  'lyria-3-pro-preview': {
    primaryLabel: 'Per Song (Full)',
    rateValue: '$0.08',
    unitSuffix: '/song',
    secondaryLabel: 'Audio Output',
    secondaryValue: '48kHz Master',
    footerText: 'Flat per-song billing (non-token)',
  },
};

const CAPABILITY_PILL_COPY: Record<
  DirectoryCapabilityFilterKey,
  {
    labels: Record<Locale, string>;
    tooltips: Record<Locale, string>;
  }
> = {
  'realtime-world': {
    labels: {
      en: 'Realtime & World',
      'zh-CN': '实时语音与世界模型',
      'zh-TW': '即時語音與世界模型',
      ja: 'リアルタイム音声・世界',
      ko: '실시간 음성·월드',
      es: 'Voz y Mundo en Vivo',
    },
    tooltips: {
      en: 'Per-second & per-minute streaming models (Genie 4, GPT-Live-1.1, Omni/Audio)',
      'zh-CN': '按秒/按分钟计费的实时音频与世界生成模型',
      'zh-TW': '按秒/按分鐘計費的即時音訊與世界生成模型',
      ja: '秒・分単位課金の音声／ワールド生成モデル',
      ko: '초·분 단위 과금 실시간 음성/월드 모델',
      es: 'Modelos de voz y mundo con cobro por segundo/minuto',
    },
  },
  '1m-context': {
    labels: {
      en: '1M+ Context',
      'zh-CN': '1M+ 超长上下文',
      'zh-TW': '1M+ 超長上下文',
      ja: '1M+ コンテキスト',
      ko: '1M+ 컨텍스트',
      es: 'Contexto 1M+',
    },
    tooltips: {
      en: 'Models with 1,000,000+ token context window',
      'zh-CN': '支持 1M 以上超长上下文窗口的模型',
      'zh-TW': '支援 1M 以上超長上下文視窗的模型',
      ja: '100万トークン以上のコンテキスト長に対応',
      ko: '1M 이상 초장문 컨텍스트 지원 모델',
      es: 'Modelos con ventana de contexto de 1M+ tokens',
    },
  },
  reasoning: {
    labels: {
      en: 'Reasoning',
      'zh-CN': '深度推理',
      'zh-TW': '深度推理',
      ja: '推論特化',
      ko: '추론 모델',
      es: 'Razonamiento',
    },
    tooltips: {
      en: 'Chain-of-thought and multi-step reasoning models',
      'zh-CN': '具备深度思维链与复杂推理能力的模型',
      'zh-TW': '具備深度思維鏈與複雜推理能力的模型',
      ja: '深い推論・思考プロセス特化モデル',
      ko: '심층 추론 및 사고 과정 특화 모델',
      es: 'Modelos especializados en razonamiento complejo',
    },
  },
  'off-peak': {
    labels: {
      en: 'Off-Peak Discount',
      'zh-CN': '峰谷分时降价',
      'zh-TW': '峰谷分時降價',
      ja: 'オフピーク割引',
      ko: '오프피크 할인',
      es: 'Descuento Valle',
    },
    tooltips: {
      en: 'Models offering 50%+ off-peak UTC / weekend API rates',
      'zh-CN': '支持 UTC 谷期或周末 5 折以上分时优惠的模型',
      'zh-TW': '支援 UTC 谷期或週末 5 折以上分時優惠的模型',
      ja: 'UTC オフピーク時間帯で最大50%以上の割引が適用されるモデル',
      ko: 'UTC 비혼잡 시간대 최대 50%+ 할인이 적용되는 모델',
      es: 'Modelos con descuentos del 50%+ en horas valle (UTC)',
    },
  },
};

const CLEAR_FILTERS_LABEL: Record<Locale, string> = {
  en: 'Clear Filters',
  'zh-CN': '清除筛选',
  'zh-TW': '清除篩選',
  ja: '条件をリセット',
  ko: '필터 초기화',
  es: 'Limpiar filtros',
};

const NON_TOKEN_COPY: Record<
  'genie-4' | 'gpt-live-1.1',
  Record<
    Locale,
    {
      badge: string;
      ratePrimary: string;
      rateSecondary: string;
      summary: string;
      ctaPrimary: string;
      ctaSecondary: string;
    }
  >
> = {
  'genie-4': {
    en: {
      badge: '$/sec · World Video',
      ratePrimary: '~$0.1008',
      rateSecondary: '~$6.05/min · 5,760 tok/s',
      summary: 'Interactive 720p/24fps world + 48kHz audio stream (5,760 tok/s). Paid Tier only; no Batch.',
      ctaPrimary: 'Audit $/sec Cost',
      ctaSecondary: 'Official API',
    },
    'zh-CN': {
      badge: '按秒计费 · 世界模型',
      ratePrimary: '~$0.1008',
      rateSecondary: '约 $6.05/分钟 · 720p24',
      summary: '实时生成 720p/24fps 交互世界与 48kHz 音频（5,760 tok/s），仅支持付费档且无 Batch 折扣。',
      ctaPrimary: '测算每秒账单',
      ctaSecondary: '官方文档',
    },
    'zh-TW': {
      badge: '按秒計費 · 世界模型',
      ratePrimary: '~$0.1008',
      rateSecondary: '約 $6.05/分鐘 · 720p24',
      summary: '即時生成 720p/24fps 互動世界與 48kHz 音訊（5,760 tok/s），僅支援付費層且無 Batch 折扣。',
      ctaPrimary: '試算每秒帳單',
      ctaSecondary: '官方文件',
    },
    ja: {
      badge: '秒単位課金 · 世界モデル',
      ratePrimary: '~$0.1008',
      rateSecondary: '約 $6.05/分 · 720p24',
      summary: '720p/24fps映像＋48kHz音声のリアルタイム世界生成（5,760 tok/s）。Paid Tier専用・Batch非対応。',
      ctaPrimary: '秒単位コスト試算',
      ctaSecondary: '公式仕様',
    },
    ko: {
      badge: '초당 과금 · 월드 모델',
      ratePrimary: '~$0.1008',
      rateSecondary: '약 $6.05/분 · 720p24',
      summary: '720p/24fps 실시간 월드 및 48kHz 오디오 스트리밍(5,760 tok/s). 유료 티어 전용(Batch 미지원).',
      ctaPrimary: '초당 비용 계산',
      ctaSecondary: '공식 문서',
    },
    es: {
      badge: 'Por Segundo · Mundo',
      ratePrimary: '~$0.1008',
      rateSecondary: '~$6.05/min · 720p24',
      summary: 'Streaming interactivo 720p/24fps + audio 48kHz (5,760 tok/s). Solo Paid Tier; sin Batch.',
      ctaPrimary: 'Calcular $/seg',
      ctaSecondary: 'Docs Oficiales',
    },
  },
  'gpt-live-1.1': {
    en: {
      badge: '$/min · Audio Stream',
      ratePrimary: '$0.05',
      rateSecondary: '$0.02/min Standby (-60%)',
      summary: 'Real-time voice & audio sessions (/v1/live/sessions, 2h max). Standby cuts idle bills by 60%.',
      ctaPrimary: 'Simulate Standby',
      ctaSecondary: 'Official API',
    },
    'zh-CN': {
      badge: '按分钟计费 · 待机省60%',
      ratePrimary: '$0.05',
      rateSecondary: '待机低至 $0.02/分钟',
      summary: '实时语音流会话（最长 2 小时，按秒计费），开启 WebRTC Standby 静默待机直降 60% 费用。',
      ctaPrimary: '模拟待机省钱',
      ctaSecondary: '官方文档',
    },
    'zh-TW': {
      badge: '按分鐘計費 · 待機省60%',
      ratePrimary: '$0.05',
      rateSecondary: '待機低至 $0.02/分鐘',
      summary: '即時語音串流會話（最長 2 小時，按秒計費），啟用 WebRTC Standby 靜默待機直降 60% 費用。',
      ctaPrimary: '模擬待機省費',
      ctaSecondary: '官方文件',
    },
    ja: {
      badge: '分単位課金 · 待機60%OFF',
      ratePrimary: '$0.05',
      rateSecondary: '待機時 $0.02/分 (WebRTC)',
      summary: 'リアルタイム音声セッション（最大2時間・秒単位精算）。WebRTC Standby で無音待機コスト60%削減。',
      ctaPrimary: '待機コスト試算',
      ctaSecondary: '公式仕様',
    },
    ko: {
      badge: '분당 과금 · 대기 60%↓',
      ratePrimary: '$0.05',
      rateSecondary: '대기 시 $0.02/분 (WebRTC)',
      summary: '실시간 음성 스트림 세션(최대 2시간, 초 단위 청구). WebRTC Standby로 유휴 비용 60% 절감.',
      ctaPrimary: '대기 절감 계산',
      ctaSecondary: '공식 문서',
    },
    es: {
      badge: 'Por Minuto · -60% Espera',
      ratePrimary: '$0.05',
      rateSecondary: '$0.02/min WebRTC Standby',
      summary: 'Sesiones de voz en vivo (máx. 2h, cobro por segundo). WebRTC Standby reduce un 60% el costo inactivo.',
      ctaPrimary: 'Simular Espera',
      ctaSecondary: 'Docs Oficiales',
    },
  },
};

export default function ModelsClient() {
  const { locale, t, getLocalizedPath } = useI18n();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('All');
  const [selectedProviderDropdown, setSelectedProviderDropdown] = useState<string>('');
  const [activeCapabilities, setActiveCapabilities] = useState<DirectoryCapabilityFilterKey[]>([]);
  const [displayCount, setDisplayCount] = useState<number>(36);

  const modelCount = MODELS_DATA.length;
  const localizedTitle = formatModelCount(t.models.title, modelCount);
  const localizedDesc = formatModelCount(t.models.desc, modelCount);
  const localizedBadge = formatModelCount(t.common.modelsCount, modelCount);
  const canonicalUrl = buildLocalizedCanonical('/models/', locale);

  // Extract all unique provider orgs across token + non-token models
  const allProviders = useMemo(() => {
    const orgs = Array.from(new Set(ALL_DIRECTORY_MODELS.map((m) => m.providerOrg)));
    return orgs.sort((a, b) => a.localeCompare(b));
  }, []);

  // Base filtered set (search + provider) used both for final filtering and dynamic pill counts
  const baseFiltered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ALL_DIRECTORY_MODELS.filter((m) => {
      const matchesSearch =
        !q ||
        m.modelName.toLowerCase().includes(q) ||
        m.modelId.toLowerCase().includes(q) ||
        m.providerOrg.toLowerCase().includes(q) ||
        (m.notes && m.notes.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (selectedProviderDropdown) {
        return m.providerOrg === selectedProviderDropdown;
      }

      if (activeTab === 'All') return true;
      if (activeTab === 'Frontier 2026') return Boolean(m.isFrontier);
      return m.providerOrg === activeTab;
    });
  }, [search, activeTab, selectedProviderDropdown]);

  // Dynamic capability pill definitions + live filter().length counts
  const capabilityPills = useMemo(() => {
    const defs: {
      key: DirectoryCapabilityFilterKey;
      icon: typeof Radio;
      activeClasses: string;
      badgeActiveClasses: string;
    }[] = [
      {
        key: 'realtime-world',
        icon: Radio,
        activeClasses:
          'border-purple-500/60 bg-purple-500/10 text-purple-700 dark:border-purple-500/70 dark:bg-purple-500/15 dark:text-purple-200 shadow-sm dark:shadow-[0_0_12px_rgba(168,85,247,0.2)]',
        badgeActiveClasses: 'bg-purple-600 text-white dark:bg-purple-500/35 dark:text-purple-100',
      },
      {
        key: '1m-context',
        icon: Layers,
        activeClasses:
          'border-indigo-600/60 bg-indigo-50 text-indigo-700 dark:border-indigo-500/70 dark:bg-indigo-500/15 dark:text-indigo-200 shadow-sm dark:shadow-[0_0_12px_rgba(99,102,241,0.2)]',
        badgeActiveClasses: 'bg-indigo-600 text-white dark:bg-indigo-500/35 dark:text-indigo-100',
      },
      {
        key: 'reasoning',
        icon: Brain,
        activeClasses:
          'border-cyan-600/60 bg-cyan-50 text-cyan-800 dark:border-cyan-500/70 dark:bg-cyan-500/15 dark:text-cyan-200 shadow-sm dark:shadow-[0_0_12px_rgba(6,182,212,0.2)]',
        badgeActiveClasses: 'bg-cyan-600 text-white dark:bg-cyan-500/35 dark:text-cyan-100',
      },
      {
        key: 'off-peak',
        icon: Percent,
        activeClasses:
          'border-emerald-600/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/70 dark:bg-emerald-500/15 dark:text-emerald-200 shadow-sm dark:shadow-[0_0_12px_rgba(16,185,129,0.2)]',
        badgeActiveClasses: 'bg-emerald-600 text-white dark:bg-emerald-500/35 dark:text-emerald-100',
      },
    ];

    return defs.map((d) => ({
      ...d,
      label: CAPABILITY_PILL_COPY[d.key].labels[locale],
      tooltip: CAPABILITY_PILL_COPY[d.key].tooltips[locale],
      count: baseFiltered.filter((m) => matchesDirectoryCapabilityFilter(m, d.key)).length,
    }));
  }, [baseFiltered, locale]);

  const filtered = useMemo(() => {
    if (activeCapabilities.length === 0) return baseFiltered;
    return baseFiltered.filter((m) =>
      activeCapabilities.every((capKey) => matchesDirectoryCapabilityFilter(m, capKey))
    );
  }, [baseFiltered, activeCapabilities]);

  const displayedModels = filtered.slice(0, displayCount);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedProviderDropdown('');
    setDisplayCount(36);
  };

  const handleDropdownChange = (provider: string) => {
    setSelectedProviderDropdown(provider);
    if (provider) {
      setActiveTab('');
    } else {
      setActiveTab('All');
    }
    setDisplayCount(36);
  };

  const toggleCapability = (key: DirectoryCapabilityFilterKey) => {
    setActiveCapabilities((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
    setDisplayCount(36);
  };

  const renderNonTokenCard = (m: NonTokenModelRule) => {
    const isSecondUnit = m.billingUnit === 'per_second';
    const copy =
      m.modelId === 'genie-4'
        ? NON_TOKEN_COPY['genie-4'][locale]
        : NON_TOKEN_COPY['gpt-live-1.1'][locale];
    const calcPath = getLocalizedPath(m.targetCalculatorPath);

    return (
      <div
        key={m.modelId}
        className={`group relative overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/50 p-5 backdrop-blur-md flex flex-col justify-between transition-all duration-200 shadow-sm dark:shadow-lg hover:shadow-xl ${
          isSecondUnit
            ? 'hover:border-purple-400/70 dark:hover:border-purple-500/50'
            : 'hover:border-cyan-400/70 dark:hover:border-cyan-500/50'
        }`}
      >
        {/* Top Semantic Accent Line */}
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${
            isSecondUnit ? 'via-purple-500/60' : 'via-cyan-500/60'
          }`}
        />

        <div>
          {/* Top row */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                {m.modelName}
              </h3>
              <span className="font-mono text-xs text-zinc-500">{m.modelId}</span>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {m.providerOrg}
              </span>
              <span
                className={`rounded-md border px-1.5 py-0.5 text-[10px] font-mono font-bold whitespace-nowrap ${
                  isSecondUnit
                    ? 'border-purple-500/30 bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                    : 'border-cyan-500/30 bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300'
                }`}
              >
                {copy.badge}
              </span>
            </div>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2 mb-4">
            {copy.summary}
          </p>

          {/* Non-Token Rate Matrix */}
          {isSecondUnit ? (
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800/80 font-mono tabular-nums text-xs mb-4">
              <div>
                <span className="text-[10px] font-sans text-zinc-500 block uppercase">Live 720p Stream</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-bold text-sm">{copy.ratePrimary}</span>
                <span className="text-[10px] text-zinc-500">/sec</span>
                <span className="block text-[10px] text-zinc-500 mt-0.5">{copy.rateSecondary}</span>
              </div>
              <div>
                <span className="text-[10px] font-sans text-zinc-500 block uppercase">Interaction Rate</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-bold text-sm">$17.50</span>
                <span className="text-[10px] text-zinc-500">/M vid</span>
                <span className="block text-[10px] text-zinc-500 mt-0.5">$1.50/M text/img in</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-zinc-200/80 dark:border-zinc-800/60 flex items-center justify-between text-[11px] font-sans">
                <span className="text-zinc-500 dark:text-zinc-400">Tier Constraint:</span>
                <span className="text-amber-700 dark:text-amber-400 font-semibold">Paid Tier Only · Streaming</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800/80 font-mono tabular-nums text-xs mb-4">
              <div>
                <span className="text-[10px] font-sans text-zinc-500 block uppercase">Active Voice</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-bold text-sm">{copy.ratePrimary}</span>
                <span className="text-[10px] text-zinc-500">/min</span>
                <span className="block text-[10px] text-zinc-500 mt-0.5">$3.00/hr · Billed/sec</span>
              </div>
              <div>
                <span className="text-[10px] font-sans text-zinc-500 block uppercase">Standby Mode</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">$0.02</span>
                <span className="text-[10px] text-zinc-500">/min</span>
                <span className="ml-1 rounded bg-emerald-500/15 px-1 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                  -60%
                </span>
                <span className="block text-[10px] text-zinc-500 mt-0.5">{copy.rateSecondary}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-zinc-200/80 dark:border-zinc-800/60 flex items-center justify-between text-[11px] font-sans">
                <span className="text-zinc-500 dark:text-zinc-400">Idle Trigger:</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>5–60s Auto-Standby ($1.20/hr)</span>
                </span>
              </div>
            </div>
          )}

          {/* Specs & Capability Chips */}
          <div className="space-y-2 mb-4">
            <div className="flex flex-wrap gap-1.5">
              {(isSecondUnit
                ? ['720p · 24fps', '48kHz Stereo', 'Gemini v1beta']
                : ['WebRTC Standby', 'Voice Audio', '2h Session Cap']
              ).map((chip) => (
                <span
                  key={chip}
                  className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/80 text-[10px] font-mono text-zinc-700 dark:text-zinc-300"
                >
                  {chip}
                </span>
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
              <span>{isSecondUnit ? 'Max Stream:' : 'Endpoint:'}</span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200">
                {isSecondUnit ? 'Real-time Interactive' : '/v1/live/sessions'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
          <Link
            href={calcPath}
            className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 inline-flex items-center gap-1"
          >
            <span>Stream Guide</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>

          <div className="flex items-center gap-1.5">
            <TrackedAffiliateLink
              href={m.officialDocUrl}
              modelId={m.modelId}
              pageType="models_directory"
              locale={locale}
              placement="models_grid_card_official"
              includeRef={false}
              rel="noopener noreferrer"
              className="px-2 py-1.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 rounded-lg transition-colors inline-flex items-center gap-1 whitespace-nowrap"
            >
              <span>{copy.ctaSecondary}</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </TrackedAffiliateLink>
            <Link
              href={calcPath}
              className="px-2.5 py-1.5 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-500/20 transition-all inline-flex items-center gap-1 whitespace-nowrap active:scale-[0.98]"
            >
              <span>{copy.ctaPrimary}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <SchemaOrg
        name={localizedTitle}
        description={localizedDesc}
        url={canonicalUrl}
        inLanguage={locale}
      />

      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-700 dark:text-indigo-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>
            {localizedBadge} (+{NON_TOKEN_MODELS.length} Stream) • {t.common.verified}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          {localizedTitle}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
          {localizedDesc}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/60 backdrop-blur-md shadow-sm dark:shadow-none space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <Filter className="h-4 w-4 text-zinc-500 mr-1 hidden sm:inline" />
            {QUICK_PROVIDERS.map((p) => {
              const isActive = activeTab === p && !selectedProviderDropdown;
              const isFrontier = p === 'Frontier 2026';
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleTabChange(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all flex items-center gap-1 ${
                    isActive
                      ? isFrontier
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm font-semibold'
                        : 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'bg-zinc-100/80 dark:bg-zinc-950/60 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/60 border border-zinc-200/90 dark:border-zinc-800/80'
                  }`}
                >
                  {isFrontier && <Sparkles className="h-3 w-3" />}
                  <span>{p === 'All' ? t.models.allProviders : p}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder={t.models.searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setDisplayCount(36);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80 text-zinc-900 dark:text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Capability & Billing Quick Filter Pills */}
        <div className="pt-3 border-t border-zinc-200/70 dark:border-zinc-800/60 flex flex-col sm:flex-row sm:items-center gap-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 shrink-0">
            Mode:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap pb-0.5 flex-1">
            {capabilityPills.map((pill) => {
              const isActive = activeCapabilities.includes(pill.key);
              const Icon = isActive ? Check : pill.icon;
              return (
                <button
                  key={pill.key}
                  type="button"
                  title={pill.tooltip}
                  aria-pressed={isActive}
                  onClick={() => toggleCapability(pill.key)}
                  className={`shrink-0 min-h-[40px] sm:min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-all duration-150 active:scale-[0.98] ${
                    isActive
                      ? pill.activeClasses
                      : pill.count === 0
                        ? 'opacity-45 cursor-not-allowed border-zinc-200/90 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/60 text-zinc-500'
                        : 'border-zinc-200/90 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/60 text-zinc-700 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? '' : 'opacity-70'}`} />
                  <span>{pill.label}</span>
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-mono tabular-nums font-semibold leading-none ${
                      isActive
                        ? pill.badgeActiveClasses
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {pill.count}
                  </span>
                </button>
              );
            })}

            {activeCapabilities.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveCapabilities([]);
                  setDisplayCount(36);
                }}
                className="shrink-0 min-h-[40px] sm:min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="h-3 w-3" />
                <span>{CLEAR_FILTERS_LABEL[locale]}</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary Provider Selector & Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-zinc-200/70 dark:border-zinc-800/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-600 dark:text-zinc-400">{t.models.filterByProvider}:</span>
            <select
              value={selectedProviderDropdown}
              onChange={(e) => handleDropdownChange(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- {t.models.allProviders} ({allProviders.length}) --</option>
              {allProviders.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
            {selectedProviderDropdown && (
              <button
                type="button"
                onClick={() => handleDropdownChange('')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {t.common.cancel}
              </button>
            )}
          </div>

          <div className="text-zinc-600 dark:text-zinc-400 font-mono text-[11px]">
            Showing <strong className="text-zinc-900 dark:text-zinc-100">{displayedModels.length}</strong> of{' '}
            <strong className="text-zinc-900 dark:text-zinc-100">{filtered.length}</strong> {t.models.totalModels}
          </div>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedModels.map((item) => {
          if (isNonTokenModel(item)) {
            return renderNonTokenCard(item);
          }

          const m = item;
          const unitOverride = DISPLAY_UNIT_OVERRIDE[m.modelId];

          return (
            <div
              key={m.modelId}
              className="group relative rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/50 p-5 backdrop-blur-md flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700/80 hover:bg-white dark:hover:bg-zinc-900/80 transition-all duration-200 shadow-sm dark:shadow-lg"
            >
              <div>
                {/* Top row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                        {m.modelName}
                      </h3>
                    </div>
                    <span className="font-mono text-xs text-zinc-500">
                      {m.modelId}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="rounded-md bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {m.providerOrg}
                    </span>
                    {m.isFrontier && (
                      <span className="rounded-md bg-indigo-500/15 dark:bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" />
                        <span>2026 Frontier</span>
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2 mb-4">
                  {m.notes || 'High performance LLM endpoint optimized for inference and agentic tool workflows.'}
                </p>

                {/* Pricing Matrix Pill */}
                {unitOverride ? (
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800/80 font-mono text-xs mb-4">
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-sans">{unitOverride.primaryLabel}</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-bold">
                        {unitOverride.rateValue}
                        <span className="text-[10px] text-zinc-500 font-normal">{unitOverride.unitSuffix}</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-sans">{unitOverride.secondaryLabel}</span>
                      <span className="text-zinc-800 dark:text-zinc-200 font-semibold">
                        {unitOverride.secondaryValue}
                      </span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-zinc-200/80 dark:border-zinc-800/60 flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500 dark:text-zinc-400 font-sans">Billing Unit:</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-sans font-semibold">
                        {unitOverride.footerText}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800/80 font-mono text-xs mb-4">
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-sans">Input / {t.common.perMillion}</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-bold">
                        {formatPerMillionPrice(m.inputPerM)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-sans">Output / {t.common.perMillion}</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-bold">
                        {formatPerMillionPrice(m.outputPerM)}
                      </span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-zinc-200/80 dark:border-zinc-800/60 flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500 dark:text-zinc-400 font-sans">Prompt Cache:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {formatPerMillionPrice(m.cachedInputPerM)}/M (-{m.cacheDiscountPercent}% off)
                      </span>
                    </div>
                  </div>
                )}

                {/* Specs & Benchmarks */}
                <div className="space-y-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 font-sans mb-4">
                  <div className="flex justify-between">
                    <span>Context Window:</span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-200">{(m.contextWindow / 1000).toLocaleString()}k tokens</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Intelligence / Arena:</span>
                    {m.benchmarks?.intelligenceIndex != null ? (
                      <span
                        title="Artificial Analysis Intelligence Index"
                        className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold"
                      >
                        AA {m.benchmarks.intelligenceIndex.toFixed(1)}
                      </span>
                    ) : m.benchmarks?.arenaElo != null ? (
                      <span
                        title="Design / Chatbot Arena ELO"
                        className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold"
                      >
                        Elo {m.benchmarks.arenaElo}
                      </span>
                    ) : m.benchmarks?.codingIndex != null ? (
                      <span
                        title={m.benchmarks.codingIndex <= 100 ? "Coding Benchmark (%)" : "Coding Arena ELO"}
                        className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold"
                      >
                        {m.benchmarks.codingIndex <= 100
                          ? `Code ${m.benchmarks.codingIndex}%`
                          : `Code ${m.benchmarks.codingIndex}`}
                      </span>
                    ) : (
                      <span
                        title="Pending Artificial Analysis / Arena evaluation"
                        className="font-mono text-zinc-500"
                      >
                        —
                      </span>
                    )}
                  </div>
                  {m.benchmarks?.avgThroughputTokS != null && (
                    <div className="flex justify-between">
                      <span>Throughput:</span>
                      <span className="font-mono text-zinc-800 dark:text-zinc-200">
                        {m.benchmarks.isEstimatedPerformance
                          ? `~${m.benchmarks.avgThroughputTokS} tok/s (Est.)`
                          : `${m.benchmarks.avgThroughputTokS} tok/s`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                <Link
                  href={getLocalizedPath(`/models/${m.modelId}/`)}
                  className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-1"
                >
                  <span>{t.simulator.leaderboard.viewDetails}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>

                <div className="flex items-center gap-2">
                  <Link
                    href={getLocalizedPath(`/calculator/${m.modelId}/`)}
                    className="px-2 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  >
                    {t.nav.calculators}
                  </Link>
                  {m.affiliateUrl && (
                    <TrackedAffiliateLink
                      href={m.affiliateUrl}
                      modelId={m.modelId}
                      pageType="models_directory"
                      locale={locale}
                      placement="models_grid_card_api"
                      provider="openrouter"
                      includeRef={true}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-indigo-500/35 dark:border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white hover:border-indigo-600 transition-colors inline-flex items-center gap-1"
                    >
                      <span>API</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </TrackedAffiliateLink>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination / Load More */}
      {filtered.length > displayCount && (
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setDisplayCount((prev) => Math.min(prev + 36, filtered.length))}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
          >
            <span>Load 36 More Models</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDisplayCount(filtered.length)}
            className="px-4 py-2.5 rounded-xl bg-zinc-200/80 dark:bg-zinc-800 hover:bg-zinc-300/80 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-300 font-medium text-xs transition-colors"
          >
            {t.common.viewAll} ({filtered.length})
          </button>
        </div>
      )}
    </div>
  );
}
