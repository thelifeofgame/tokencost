import { Locale } from '@/i18n/types';
import { ModelPricingRule } from '@/types/pricing';
import { formatPerMillionPrice } from '@/lib/utils';

export const BREADCRUMB_LABELS: Record<
  Locale,
  { home: string; models: string; calculators: string; compare: string; harnesses: string }
> = {
  en: { home: 'Home', models: 'Models', calculators: 'Calculators', compare: 'Compare', harnesses: 'Harnesses' },
  'zh-CN': { home: '首页', models: '模型库', calculators: '缓存计算器', compare: '模型对比', harnesses: '编程 Agent' },
  'zh-TW': { home: '首頁', models: '模型庫', calculators: '快取計算器', compare: '模型對比', harnesses: '程式設計 Agent' },
  ja: { home: 'ホーム', models: 'モデル一覧', calculators: '計算ツール', compare: 'モデル比較', harnesses: 'コーディングAgent' },
  ko: { home: '홈', models: '모델 디렉터리', calculators: '계산기', compare: '모델 비교', harnesses: '코딩 에이전트' },
  es: { home: 'Inicio', models: 'Modelos', calculators: 'Calculadoras', compare: 'Comparar', harnesses: 'Agentes' },
};

export function formatContextLabel(contextWindow: number): string {
  if (contextWindow >= 1_000_000) {
    const m = contextWindow / 1_000_000;
    return m >= 1.9 ? `${Math.round(m)}M` : '1M';
  }
  return `${Math.round(contextWindow / 1000).toLocaleString()}k`;
}

export function getLocalizedModelMeta(
  model: ModelPricingRule,
  locale: Locale
): { title: string; description: string; keywords: string[] } {
  const inRate = formatPerMillionPrice(model.inputPerM);
  const outRate = formatPerMillionPrice(model.outputPerM);
  const cachedRate = formatPerMillionPrice(model.cachedInputPerM);
  const cachePct = Math.round(model.cacheDiscountPercent);
  const contextK = formatContextLabel(model.contextWindow);
  const hasCache = cachePct > 0;
  const name = model.modelName;
  const org = model.providerOrg;
  const id = model.modelId;

  switch (locale) {
    case 'zh-CN':
      return {
        title: `${name} API 价格与提示词缓存费率 (2026) | TokenCosts AI`,
        description: hasCache
          ? `${name}（${org}）最新官方及路由费率：输入 ${inRate}/百万 tokens，输出 ${outRate}/百万，缓存读取 ${cachedRate}/百万（省 ${cachePct}%），支持 ${contextK} 上下文与实测吞吐。`
          : `${name}（${org}）最新官方及路由费率：输入 ${inRate}/百万 tokens，输出 ${outRate}/百万，按需标准计费（暂不支持提示词缓存折扣），支持 ${contextK} 上下文与实测吞吐。`,
        keywords: [
          `${name} API价格`,
          `${name} 收费标准`,
          `${name} 缓存折扣`,
          `${org} API费用`,
          `${id} 定价`,
        ],
      };
    case 'zh-TW':
      return {
        title: `${name} API 價格與快取費率明細 (2026) | TokenCosts AI`,
        description: hasCache
          ? `${name}（${org}）最新官方與聚合路由費率：輸入 ${inRate}/百萬 tokens，輸出 ${outRate}/百萬，快取讀取 ${cachedRate}/百萬（省 ${cachePct}%），支援 ${contextK} 上下文與延遲評測。`
          : `${name}（${org}）最新官方與聚合路由費率：輸入 ${inRate}/百萬 tokens，輸出 ${outRate}/百萬，按需標準計費（暫不支援快取折扣），支援 ${contextK} 上下文與延遲評測。`,
        keywords: [
          `${name} API價格`,
          `${name} 收費標準`,
          `${name} 快取折扣`,
          `${org} API費用`,
          `${id} 定價`,
        ],
      };
    case 'ja':
      return {
        title: `${name} API料金・Prompt Caching割引率 (2026) | TokenCosts AI`,
        description: hasCache
          ? `${name}（${org}）の最新API単価：入力 ${inRate}/1M tokens、出力 ${outRate}/1M、キャッシュ読取 ${cachedRate}/1M（${cachePct}%OFF）。コンテキスト長 ${contextK}・実測スループット対応。`
          : `${name}（${org}）の最新API単価：入力 ${inRate}/1M tokens、出力 ${outRate}/1M、標準従量課金（Prompt Caching非対応）。コンテキスト長 ${contextK}・実測スループット対応。`,
        keywords: [
          `${name} API 料金`,
          `${name} トークン単価`,
          `${name} キャッシュ割引`,
          `${org} API価格`,
          `${id} 料金`,
        ],
      };
    case 'ko':
      return {
        title: `${name} API 가격 및 프롬프트 캐싱 요율 (2026) | TokenCosts AI`,
        description: hasCache
          ? `${name}(${org}) 최신 API 단가: 입력 ${inRate}/1M, 출력 ${outRate}/1M, 캐시 읽기 ${cachedRate}/1M(-${cachePct}%). ${contextK} 컨텍스트 윈도우 및 처리 속도 스펙 제공.`
          : `${name}(${org}) 최신 API 단가: 입력 ${inRate}/1M, 출력 ${outRate}/1M, 표준 종량제 과금(캐시 할인 미지원). ${contextK} 컨텍스트 윈도우 및 처리 속도 스펙 제공.`,
        keywords: [
          `${name} API 가격`,
          `${name} 토큰 비용`,
          `${name} 캐시 할인`,
          `${org} API 요금`,
          `${id} 가격`,
        ],
      };
    case 'es':
      return {
        title: `Precios API de ${name} y Caché (2026) | TokenCosts AI`,
        description: hasCache
          ? `Tarifas oficiales de ${name} (${org}): ${inRate}/1M entrada, ${outRate}/1M salida y ${cachedRate}/1M en caché (-${cachePct}%). Ventana de ${contextK} y latencia en vivo.`
          : `Tarifas oficiales de ${name} (${org}): ${inRate}/1M entrada, ${outRate}/1M salida, facturación estándar sin descuento de caché. Ventana de ${contextK} y latencia en vivo.`,
        keywords: [
          `precio API ${name}`,
          `costo tokens ${name}`,
          `caché ${name}`,
          `tarifas ${org}`,
          `${id} precios`,
        ],
      };
    default:
      return {
        title: `${name} API Pricing & Cache Rates (2026) | TokenCosts AI`,
        description: hasCache
          ? `Official ${name} (${org}) API pricing: ${inRate}/1M input, ${outRate}/1M output, ${cachedRate}/1M cached (-${cachePct}%). ${contextK} context window & live latency specs.`
          : `Official ${name} (${org}) API pricing: ${inRate}/1M input, ${outRate}/1M output. Standard on-demand billing (no prompt caching discount). ${contextK} context window & live latency specs.`,
        keywords: [
          `${name} API pricing`,
          `${name} token cost`,
          `${name} prompt caching`,
          `${org} API rates`,
          `${id} pricing 2026`,
        ],
      };
  }
}

export function getLocalizedCalculatorMeta(
  model: ModelPricingRule,
  locale: Locale
): { title: string; description: string; keywords: string[] } {
  const inRate = formatPerMillionPrice(model.inputPerM);
  const cachedRate = formatPerMillionPrice(model.cachedInputPerM);
  const cachePct = Math.round(model.cacheDiscountPercent);
  const name = model.modelName;
  const id = model.modelId;

  switch (locale) {
    case 'zh-CN':
      return {
        title: `${name} Prompt Caching 成本计算器与 ROI 模拟 | TokenCosts AI`,
        description: `在线测算 ${name} 月度 API 账单：一键模拟 -${cachePct}% 缓存读取折扣（${cachedRate}/1M vs 基准 ${inRate}/1M）、写入附加费回本阈值与 Batch 50% 离线降本。`,
        keywords: [
          `${name} 成本计算器`,
          `${name} 缓存省钱测算`,
          `${name} API 账单模拟`,
          `${id} 计算器`,
          '大模型 Token 费用计算',
        ],
      };
    case 'zh-TW':
      return {
        title: `${name} Prompt Caching 成本計算器與 ROI 模擬 | TokenCosts AI`,
        description: `線上試算 ${name} 月度 API 帳單：即時模擬 -${cachePct}% 快取讀取折扣（${cachedRate}/1M vs 基準 ${inRate}/1M）、寫入附加費回本點與 Batch 50% 離線省費。`,
        keywords: [
          `${name} 成本計算器`,
          `${name} 快取省費試算`,
          `${name} API 帳單模擬`,
          `${id} 計算器`,
          '大模型 Token 費用計算',
        ],
      };
    case 'ja':
      return {
        title: `${name} Prompt Caching 料金シミュレーター＆ROI計算 | TokenCosts AI`,
        description: `${name} の月額 API コストを即座に試算：-${cachePct}% キャッシュ読取割引（${cachedRate}/1M vs 通常 ${inRate}/1M）、書込手数料の損益分岐点、Batch 50%割引に対応。`,
        keywords: [
          `${name} 料金計算`,
          `${name} コストシミュレーター`,
          `${name} キャッシュROI`,
          `${id} 見積もり`,
          'LLM API 計算機',
        ],
      };
    case 'ko':
      return {
        title: `${name} 프롬프트 캐싱 비용 계산기 및 ROI 시뮬레이터 | TokenCosts AI`,
        description: `${name} 월간 API 요금 정밀 시뮬레이션: -${cachePct}% 캐시 읽기 할인(${cachedRate}/1M vs 기본 ${inRate}/1M), 쓰기 할증 손익분기점 및 Batch 50% 절감 계산.`,
        keywords: [
          `${name} 비용 계산기`,
          `${name} 캐싱 ROI`,
          `${name} API 요금 계산`,
          `${id} 시뮬레이터`,
          'LLM 토큰 계산기',
        ],
      };
    case 'es':
      return {
        title: `Calculadora de Costos y Caché para ${name} | TokenCosts AI`,
        description: `Simula tu factura mensual con ${name}: calcula -${cachePct}% de ahorro en caché (${cachedRate}/1M vs ${inRate}/1M), punto de equilibrio y descuento Batch del 50%.`,
        keywords: [
          `calculadora ${name}`,
          `simulador costos ${name}`,
          `ahorro caché ${name}`,
          `${id} calculadora`,
          'costos API LLM',
        ],
      };
    default:
      return {
        title: `${name} Prompt Caching Calculator & ROI Simulator | TokenCosts AI`,
        description: `Calculate monthly API bills for ${name}: simulate -${cachePct}% cache read savings (${cachedRate}/1M vs ${inRate}/1M base), write surcharge break-even, and 50% Batch offload.`,
        keywords: [
          `${name} cost calculator`,
          `${name} prompt caching calculator`,
          `${name} API bill estimator`,
          `${id} ROI`,
          'LLM token calculator',
        ],
      };
  }
}

export function getLocalizedCompareMeta(
  modelA: ModelPricingRule,
  modelB: ModelPricingRule,
  canonicalSlug: string,
  locale: Locale
): { title: string; description: string; keywords: string[] } {
  const nameA = modelA.modelName;
  const nameB = modelB.modelName;
  const inA = formatPerMillionPrice(modelA.inputPerM);
  const outA = formatPerMillionPrice(modelA.outputPerM);
  const inB = formatPerMillionPrice(modelB.inputPerM);
  const outB = formatPerMillionPrice(modelB.outputPerM);

  switch (locale) {
    case 'zh-CN':
      return {
        title: `${nameA} vs ${nameB} API 价格与推理成本全面对比 | TokenCosts AI`,
        description: `深度对比 ${nameA}（${inA}/${outA} 每百万）与 ${nameB}（${inB}/${outB} 每百万）真实账单：涵盖提示词缓存 ROI、Batch 半价、长上下文阶梯与 Coding Agent 实测倍率。`,
        keywords: [
          `${nameA} vs ${nameB}`,
          `${nameA} 对比 ${nameB} 价格`,
          `${nameA} 和 ${nameB} 哪个便宜`,
          canonicalSlug,
          '大模型 API 性价比对比',
        ],
      };
    case 'zh-TW':
      return {
        title: `${nameA} vs ${nameB} API 價格與推論成本全面對比 | TokenCosts AI`,
        description: `深度對比 ${nameA}（${inA}/${outA} 每百萬）與 ${nameB}（${inB}/${outB} 每百萬）真實帳單：涵蓋快取 ROI、Batch 半價、長上下文階梯與 Coding Agent 實測倍率。`,
        keywords: [
          `${nameA} vs ${nameB}`,
          `${nameA} 對比 ${nameB} 價格`,
          `${nameA} 與 ${nameB} 費用比較`,
          canonicalSlug,
          '大模型 API 成本對比',
        ],
      };
    case 'ja':
      return {
        title: `${nameA} vs ${nameB} API料金・コスパ徹底比較 | TokenCosts AI`,
        description: `${nameA}（${inA}/${outA}）と ${nameB}（${inB}/${outB}）の 1M tokens 単価を比較。Prompt Caching 投資対効果、Batch 50%割引、長文課金と Coding Agent コスト倍率を検証。`,
        keywords: [
          `${nameA} vs ${nameB}`,
          `${nameA} ${nameB} 料金比較`,
          `${nameA} コスパ比較`,
          canonicalSlug,
          'LLM API 価格比較',
        ],
      };
    case 'ko':
      return {
        title: `${nameA} vs ${nameB} API 가격 및 실비용 비교 분석 | TokenCosts AI`,
        description: `${nameA}(${inA}/${outA}) vs ${nameB}(${inB}/${outB}) 1M 토큰 단가 비교. 프롬프트 캐싱 ROI, Batch 50% 할인, 긴 컨텍스트 요금 및 코딩 에이전트 비용 배율을 확인하세요.`,
        keywords: [
          `${nameA} vs ${nameB}`,
          `${nameA} ${nameB} 가격 비교`,
          `${nameA} ${nameB} 비용 차이`,
          canonicalSlug,
          'LLM API 비교',
        ],
      };
    case 'es':
      return {
        title: `${nameA} vs ${nameB}: Comparativa de Precios API | TokenCosts AI`,
        description: `Compara ${nameA} (${inA}/${outA} por 1M) frente a ${nameB} (${inB}/${outB} por 1M). Analiza ROI de caché, descuento Batch 50%, contexto largo y costos en Coding Agents.`,
        keywords: [
          `${nameA} vs ${nameB}`,
          `comparar ${nameA} y ${nameB}`,
          `precios ${nameA} vs ${nameB}`,
          canonicalSlug,
          'comparativa API LLM',
        ],
      };
    default:
      return {
        title: `${nameA} vs ${nameB} API Pricing & Cost Comparison | TokenCosts AI`,
        description: `Compare ${nameA} (${inA}/${outA} per 1M) vs ${nameB} (${inB}/${outB} per 1M). Audit prompt caching ROI, 50% Batch discounts, context escalation & Coding Agent costs.`,
        keywords: [
          `${nameA} vs ${nameB}`,
          `${nameA} vs ${nameB} pricing`,
          `${nameA} vs ${nameB} cost`,
          canonicalSlug,
          'LLM API comparison 2026',
        ],
      };
  }
}
