import { Locale } from '@/i18n/types';
import { PRICING_TOPICS } from './models-data';

export interface TopicSeoMeta {
  title: string;
  description: string;
  h1: string;
}

export interface TopicFaqItem {
  question: string;
  answer: string;
}

export const TOPIC_SEO_MAP: Record<string, Partial<Record<Locale, TopicSeoMeta>>> = {
  'realtime-voice-world-model-api-costs': {
    en: {
      title: 'Genie 4 & GPT-Live-1.1 API Costs: Voice & World Model Pricing | TokenCosts AI',
      description:
        'Audit real-time multimodal API unit economics: Google Genie 4 at $0.10/sec ($6.05/min, 5,760 tok/s) vs OpenAI GPT-Live-1.1 WebRTC Standby cutting idle voice costs 60% to $0.02/min.',
      h1: 'Real-Time Voice & World Model API Costs: Genie 4 ($0.10/s) vs GPT-Live-1.1 Standby',
    },
    'zh-CN': {
      title: 'Genie 4 世界模型与 GPT-Live-1.1 实时语音 API 成本拆解 | TokenCosts AI',
      description:
        '深度测算流式多模态 API 账单：Google Genie 4 720p24fps 每秒 $0.10（约 $6.05/分钟），OpenAI GPT-Live-1.1 WebRTC 待机模式直降 60% 至 $0.02/分钟。',
      h1: '实时语音与世界模型 API 成本指南：Genie 4 与 GPT-Live-1.1 待机降本实测',
    },
    'zh-TW': {
      title: 'Genie 4 世界模型與 GPT-Live-1.1 即時語音 API 成本解析 | TokenCosts AI',
      description:
        '深度測算串流多模態 API 帳單：Google Genie 4 720p24fps 每秒 $0.10（約 $6.05/分鐘），OpenAI GPT-Live-1.1 WebRTC 待機模式直降 60% 至 $0.02/分鐘。',
      h1: '即時語音與世界模型 API 成本指南：Genie 4 與 GPT-Live-1.1 待機省費實測',
    },
    ja: {
      title: 'Genie 4 & GPT-Live-1.1 リアルタイムAPI料金解析：音声・世界モデル | TokenCosts AI',
      description:
        'Google Genie 4（720p24fps 約$0.10/秒・$6.05/分）のフレーム単位コストと、OpenAI GPT-Live-1.1 WebRTC Standby（待機コスト60%削減・$0.02/分）の設計手法を解説。',
      h1: 'リアルタイム音声・世界モデル API 料金比較：Genie 4 と GPT-Live-1.1',
    },
    ko: {
      title: 'Genie 4 & GPT-Live-1.1 실시간 음성·월드 모델 API 비용 가이드 | TokenCosts AI',
      description:
        'Google Genie 4(초당 $0.10, 분당 $6.05)의 프레임 토큰 과금과 OpenAI GPT-Live-1.1 WebRTC Standby(유휴 비용 60% 절감, 분당 $0.02) 아키텍처를 분석합니다.',
      h1: '실시간 음성 및 월드 모델 API 비용 분석: Genie 4 vs GPT-Live-1.1',
    },
    es: {
      title: 'Costos API de Genie 4 y GPT-Live-1.1: Voz y Modelos de Mundo | TokenCosts AI',
      description:
        'Analiza el costo real por segundo de Google Genie 4 ($0.10/s, $6.05/min) frente al modo WebRTC Standby de OpenAI GPT-Live-1.1 que reduce un 60% la factura de voz ($0.02/min).',
      h1: 'Costos API en Tiempo Real: Google Genie 4 vs OpenAI GPT-Live-1.1 Standby',
    },
  },
  'gemini-4-carbon-dec-1-migration-guide': {
    en: {
      title: 'Gemini 4 Carbon Dec 1 Price Hike (2x) & Azure o3 Migration Guide | TokenCosts AI',
      description:
        'Gemini 4 Carbon & Argon double from $2/$10 to $4/$20 after Nov 30, while Azure o3/o4-mini retired Nov 19. Audit drop-in $2/$10 replacements: Claude Sonnet 5.5, GPT-6.2 Sol & DeepSeek-R1.',
      h1: 'Gemini 4 Carbon Dec 1 Price Hike & Azure o3/o4-mini Migration Playbook',
    },
    'zh-CN': {
      title: 'Gemini 4 Carbon 12/1 翻倍涨价与 Azure o3 停服迁移指南 | TokenCosts AI',
      description:
        'Gemini 4 Carbon/Argon $2/$10 优惠将于 11/30 到期翻倍至 $4/$20，且 Azure o3/o4-mini 已于 11/19 停服。对比同价平替 Claude Sonnet 5.5、GPT-6.2 Sol 与 DeepSeek-R1。',
      h1: '倒计时窗口：Gemini 4 Carbon 12/1 涨价翻倍与 Azure o3 停服迁移指南',
    },
    'zh-TW': {
      title: 'Gemini 4 Carbon 12/1 翻倍漲價與 Azure o3 停服遷移指南 | TokenCosts AI',
      description:
        'Gemini 4 Carbon/Argon $2/$10 優惠將於 11/30 到期翻倍至 $4/$20，且 Azure o3/o4-mini 已於 11/19 停服。對比同價平替 Claude Sonnet 5.5、GPT-6.2 Sol 與 DeepSeek-R1。',
      h1: '倒數視窗：Gemini 4 Carbon 12/1 漲價翻倍與 Azure o3 停服遷移指南',
    },
    ja: {
      title: 'Gemini 4 Carbon 12/1 価格倍増＆Azure o3 終了移行ガイド | TokenCosts AI',
      description:
        '11/30で終了する Gemini 4 Carbon/Argon の $2/$10 特価（12/1に$4/$20へ倍増）と Azure o3/o4-mini 終了への移行先（Claude Sonnet 5.5・GPT-6.2 Sol・DeepSeek-R1）を徹底比較。',
      h1: 'Gemini 4 Carbon 12月1日値上げ＆Azure o3 終了対策マイグレーションガイド',
    },
    ko: {
      title: 'Gemini 4 Carbon 12/1 요금 2배 인상 및 Azure o3 종료 마이그레이션 | TokenCosts AI',
      description:
        '11월 30일 종료되는 Gemini 4 Carbon/Argon $2/$10 할인가(12/1 $4/$20 인상)와 Azure o3/o4-mini 종료에 대비해 Claude Sonnet 5.5, GPT-6.2 Sol, DeepSeek-R1 대체 전략을 확인하세요.',
      h1: 'Gemini 4 Carbon 12월 1일 가격 2배 인상 및 Azure o3 종료 마이그레이션 가이드',
    },
    es: {
      title: 'Subida de Gemini 4 Carbon (1 dic) y Migración de Azure o3 | TokenCosts AI',
      description:
        'Gemini 4 Carbon/Argon duplican tarifa de $2/$10 a $4/$20 tras el 30 nov y Azure o3/o4-mini se retiraron el 19 nov. Compara alternativas a $2/$10: Claude Sonnet 5.5, GPT-6.2 Sol y DeepSeek-R1.',
      h1: 'Guía de Migración: Subida de Gemini 4 Carbon (1 dic) y Retiro de Azure o3',
    },
  },
};

export const TOPIC_FAQS_MAP: Record<string, TopicFaqItem[]> = {
  'realtime-voice-world-model-api-costs': [
    {
      question: 'How is Google Genie 4 API pricing calculated per second and per minute?',
      answer:
        'Google Genie 4 (models/genie-4 on the Gemini v1beta Interactions API) bills text/reference image input at $1.50/1M tokens, text output at $9.00/1M tokens, and synchronized 720p/24fps video + 48kHz stereo audio at $17.50/1M tokens. Because each 720p frame consumes 240 tokens (24 fps × 240 = 5,760 tokens/sec), live streaming video output costs roughly $0.10 per second (~$6.05 per minute) on Paid Tier—Free, Batch, Flex, and Priority tiers are not supported.',
    },
    {
      question: 'How much does OpenAI GPT-Live-1.1 WebRTC Standby mode save on voice agents?',
      answer:
        'Active sessions on gpt-live-1.1 (/v1/live/sessions, up to 2 hours per session) cost $0.05/min ($3.00/hr). Enabling WebRTC Standby with a 5–60 second inactivity timeout drops idle connection billing by 60% to $0.02/min ($1.20/hr), billed per second across both gpt-live-1 and gpt-live-1.1.',
    },
    {
      question: 'When should teams cascade to text/tool routers instead of keeping Genie 4 or GPT-Live active?',
      answer:
        'Offload background RAG retrieval, state summarization, and classification to sub-cent text models like deepseek-v4.1-flash ($0.0507/$0.2028 per 1M on OpenRouter, $0.001/M cached, with built-in web search/fetch tool fees removed) or gpt-oss-120b ($0.09/$0.36 per 1M), keeping real-time voice or world-model streams reserved strictly for active user interaction windows.',
    },
    {
      question: 'Can Prompt Caching or Batch 50% discounts offset Genie 4 streaming bills?',
      answer:
        'Genie 4 explicitly excludes Batch, Flex, and Free tiers, meaning per-frame video output cannot be discounted by 50% Batch queues. Teams lower overall unit economics by caching static scene prompts/system rules on text orchestration models (gemini-4-neon at $0.15/1M cached) and enforcing strict per-session duration caps.',
    },
  ],
  'gemini-4-carbon-dec-1-migration-guide': [
    {
      question: 'When does the Gemini 4 Carbon and Argon promotional rate expire, and what is the new price?',
      answer:
        'The introductory $2.00/1M input and $10.00/1M output promotional pricing for gemini-4-carbon and gemini-4-argon expires on November 30, 2026. Starting December 1, 2026, rates double by 100% to $4.00/1M input and $20.00/1M output—making unmigrated workloads twice as expensive overnight.',
    },
    {
      question: "Which models match Gemini 4 Carbon's $2/$10 price tier without a Dec 1 price jump?",
      answer:
        'Both Claude Sonnet 5.5 ($2.00/$10.00, 1M context, 95% cache read at $0.10/1M) and GPT-6.2 Sol ($2.00/$10.00, 1.05M context, 95% cache read at $0.10/1M) sit at the exact same $2/$10 baseline. Even Gemini 4 Neon ($3.00/$15.00, 61.4 AI Index, 145 t/s) will cost 25% less than post-Dec 1 Gemini 4 Carbon ($4/$20).',
    },
    {
      question: 'What should teams migrate to after the November 19 Azure OpenAI o3 and o4-mini retirement?',
      answer:
        "Engineering teams moving off retired Azure o3 and o4-mini endpoints can route reasoning workloads to GPT-6.2 Sol ($2.00/$10.00, 1.05M context) for ecosystem parity, or cut reasoning costs by 50.1% with DeepSeek-R1 ($0.55/$2.19 per 1M vs o3-mini's $1.10/$4.40), while high-volume subtasks can drop to deepseek-v4.1-flash ($0.0507/$0.2028 on OpenRouter, $0.001/M cached).",
    },
    {
      question: 'How can LiteLLM or OpenRouter automate a zero-downtime migration before December 1?',
      answer:
        'Point your SDK base_url to an OpenAI-compatible router (LiteLLM Proxy or OpenRouter) and define a weighted fallback rule that shifts gemini-4-carbon aliases to claude-sonnet-5.5 or gpt-6.2-sol before 2026-12-01T00:00:00Z, preserving prompt-prefix stability for 95% cache hit rates.',
    },
  ],
};

const GENERIC_LOCALE_SUFFIX: Record<Locale, string> = {
  en: '',
  'zh-CN': ' | 企业级 AI 成本深度解析',
  'zh-TW': ' | 企業級 AI 成本深度解析',
  ja: ' | AI API コスト最適化ガイド',
  ko: ' | AI API 비용 최적화 가이드',
  es: ' | Guía de Optimización FinOps',
};

export function getTopicSeoMeta(slug: string, locale: Locale = 'en'): TopicSeoMeta {
  const custom = TOPIC_SEO_MAP[slug]?.[locale] || TOPIC_SEO_MAP[slug]?.en;
  if (custom) {
    return custom;
  }
  const topic = PRICING_TOPICS.find((t) => t.slug === slug);
  const baseTitle = topic?.title || slug;
  const baseDesc =
    topic?.description ||
    'Comprehensive LLM API cost analysis, prompt caching discounts, and smart routing recommendations.';
  const suffix = GENERIC_LOCALE_SUFFIX[locale] || '';
  return {
    title: `${baseTitle}${suffix} | TokenCosts AI`,
    description: baseDesc,
    h1: baseTitle,
  };
}

export function getTopicFaqs(slug: string): TopicFaqItem[] {
  return TOPIC_FAQS_MAP[slug] || [];
}

export function getAuditCardCopy(locale: Locale, topicSlug: string) {
  const isZh = locale === 'zh-CN';
  const isZhTw = locale === 'zh-TW';
  const contactQuery =
    topicSlug === 'realtime-voice-world-model-api-costs'
      ? '/contact/?topic=realtime-voice-audit'
      : topicSlug === 'gemini-4-carbon-dec-1-migration-guide'
      ? '/contact/?topic=gemini-carbon-migration'
      : '/contact/?subject=Pre-Dec-1-FinOps-Audit';

  if (isZh) {
    return {
      title: '12 月 1 日涨价前需要企业级大模型迁移与缓存省钱审计？',
      description:
        '正在大规模使用 Gemini 4 Carbon、受 Azure o3/o4-mini 停服影响，或面临实时语音/世界模型流式账单压力？立即预约 TokenCosts AI 架构成本审计，或直接发邮件至 www.smeng@gmail.com 联系我们的工程团队。',
      primaryCta: '预约 12/1 迁移与降本审计',
      secondaryCta: '打开全站模拟器',
      emailLabel: '直发邮件至 www.smeng@gmail.com',
      contactHref: contactQuery,
    };
  }
  if (isZhTw) {
    return {
      title: '12 月 1 日漲價前需要企業級大模型遷移與快取省錢審計？',
      description:
        '正在大規模使用 Gemini 4 Carbon、受 Azure o3/o4-mini 停服影響，或面臨即時語音/世界模型串流帳單壓力？立即預約 TokenCosts AI 架構成本審計，或直接發郵件至 www.smeng@gmail.com 聯繫工程團隊。',
      primaryCta: '預約 12/1 遷移與降本審計',
      secondaryCta: '開啟全站模擬器',
      emailLabel: '直發郵件至 www.smeng@gmail.com',
      contactHref: contactQuery,
    };
  }
  return {
    title: 'Need a Pre-Dec 1 LLM Migration & Caching Architecture Audit?',
    description:
      'Running high-volume Gemini 4 Carbon, retired Azure o3/o4-mini, or real-time voice/world-model pipelines? Book a 48-hour FinOps cost audit with TokenCosts AI Engineering—or email our team directly at www.smeng@gmail.com.',
    primaryCta: 'Request FinOps Migration Audit',
    secondaryCta: 'Open Full Simulator',
    emailLabel: 'Email www.smeng@gmail.com',
    contactHref: contactQuery,
  };
}
