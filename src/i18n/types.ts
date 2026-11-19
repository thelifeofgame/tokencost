export type Locale = 'en' | 'zh-CN' | 'zh-TW' | 'ja' | 'ko' | 'es';

export interface LocaleConfig {
  code: Locale;
  name: string;
  nativeName: string;
  flag: string;
  shortLabel: string;
  dateFormat: string;
  numberFormatLocale: string;
}

export interface TranslationDictionary {
  common: {
    brand: string;
    tagline: string;
    versionBadge: string;
    tryRouterApi: string;
    github: string;
    modelsCount: string;
    verified: string;
    searchPlaceholder: string;
    loading: string;
    perMillion: string;
    per1kRequests: string;
    monthly: string;
    cancel: string;
    confirm: string;
    copy: string;
    copied: string;
    share: string;
    shareSuccess: string;
    viewAll: string;
    back: string;
    vs: string;
    save: string;
  };
  nav: {
    simulator: string;
    models: string;
    compare: string;
    harness: string;
    calculators: string;
    guides: string;
    developers: string;
    contact: string;
    language: string;
  };
  simulator: {
    heroBadge: string;
    heroTitle: string;
    heroDesc: string;
    quickCompareGptClaude: string;
    quickCompareDeepseekLlama: string;
    radar: {
      badge: string;
      title: string;
      sync: string;
      desc: string;
      viewDetails: string;
      officialAnnouncement: string;
      tabs: {
        all: string;
        new_model: string;
        price_cut: string;
        caching_update: string;
      };
    };
    presetsTitle: string;
    presets: {
      generalTitle: string;
      generalDesc: string;
      ragTitle: string;
      ragDesc: string;
      agentTitle: string;
      agentDesc: string;
      supportTitle: string;
      supportDesc: string;
      batchTitle: string;
      batchDesc: string;
    };
    controls: {
      monthlyRequests: string;
      inputTokens: string;
      outputTokens: string;
      cacheHitRate: string;
      batchOffload: string;
      longContext: string;
      longContextDesc: string;
      estimateTokensBtn: string;
    };
    chart: {
      title: string;
      subtitle: string;
      netCost: string;
      cacheSavings: string;
      batchSavings: string;
      baseCost: string;
    };
    router: {
      title: string;
      subtitle: string;
      recommended: string;
      savingsBadge: string;
      baselineModel: string;
      blendedCost: string;
      exportConfig: string;
      shareSimulation: string;
      copyPrompt: string;
      routingStrategy: string;
      trafficSplit: string;
    };
    leaderboard: {
      title: string;
      subtitle: string;
      filterProvider: string;
      filterTier: string;
      colRank: string;
      colModel: string;
      colProvider: string;
      colEval: string;
      colLatency: string;
      colInput: string;
      colOutput: string;
      colNetCost: string;
      colSavings: string;
      colActions: string;
      viewDetails: string;
      connectApi: string;
    };
  };
  compare: {
    hubBadge: string;
    hubTitle: string;
    hubDesc: string;
    selectModelA: string;
    selectModelB: string;
    compareBtn: string;
    topMatrixTitle: string;
    topMatrixDesc: string;
    directPricingTitle: string;
    diffModule1Title: string;
    diffModule1Desc: string;
    diffModule2Title: string;
    diffModule2Desc: string;
    diffModule3Title: string;
    diffModule3Desc: string;
    scenariosTitle: string;
    scenariosDesc: string;
    faqsTitle: string;
    faqsDesc: string;
    connectApi: string;
    inspectSpecs: string;
    viewSideBySide: string;
    interactiveEngine: string;
    cheaperBy: string;
    savesPerMonth: string;
  };
  models: {
    title: string;
    desc: string;
    totalModels: string;
    searchPlaceholder: string;
    filterByProvider: string;
    allProviders: string;
    sortBy: string;
    sortLowestPrice: string;
    sortHighestScore: string;
    sortLowestLatency: string;
  };
  calculator: {
    title: string;
    desc: string;
    badge: string;
    baseInput: string;
    cacheHitRead: string;
    launchCalculator: string;
  };
  developers: {
    title: string;
    desc: string;
    badge: string;
    copyCode: string;
    sdkTabs: {
      litellm: string;
      vercelAi: string;
      python: string;
    };
  };
  footer: {
    about: string;
    costEngines: string;
    popularComparisons: string;
    guides: string;
    contact: string;
    contactDesc: string;
    emailUs: string;
    emailDesc: string;
    copyright: string;
    craftedWith: string;
    noFluff: string;
  };
}
