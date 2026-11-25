import type { Locale } from '@/i18n/types';
import type { FAQItem } from '@/components/seo/SchemaOrg';

const DEALS_FAQS_BY_LOCALE: Record<Locale, FAQItem[]> = {
  en: [
    {
      question: 'Are the Black Friday AI deals and API credits on this page real as of November 25, 2026?',
      answer:
        'Yes. Every listing is manually audited daily against primary vendor pricing pages and changelogs, with the latest check completed on 2026-11-25 (T-2 before Black Friday on Nov 27). Vendors without an official promotion—such as OpenAI, Anthropic, Cursor, DeepSeek, and Mistral AI—are explicitly marked "No Official BF Promo" rather than listing unverified coupon codes or third-party resellers.',
    },
    {
      question: 'What should developers switch to now that Mistral Vibe Pro removed its $25.50 monthly API credit?',
      answer:
        'Since Mistral Vibe Pro dropped its bundled $25.50 API credit and the Free tier removed free Codestral API access, developers needing low-cost coding or agent APIs can migrate to pay-as-you-go ultra-low-floor models such as Upstage Solar Mini 4.5 ($0.01/$0.04 per 1M tokens, 524K context), DeepSeek V4.1 Flash ($0.14/$0.42 via OpenRouter with 97% cache discount), or Z.ai GLM-5.3-Flash ($0.12/$0.38 with 83.3% cache and 80.8% batch discounts).',
    },
    {
      question: 'What deadlines expire on November 30, 2026 (T-5), and how should teams migrate?',
      answer:
        'Two major cutoffs hit on November 30: Google Gemini 4 Carbon and Argon end their $2/$10 per 1M intro pricing and double to $4/$20 on December 1 (while gemini-2.5-pro and gemini-2.5-flash auto-route to 3.8-flash and 3.5-flash-lite), and OpenAI retires /v1/prompts, Evals API, and Agent Builder alongside GPT-5.6 Sol intro discounts. Teams should evaluate Claude Sonnet 5.5 ($2/$10), GPT-6.2 Sol ($2/$10), or cached open-weight endpoints using our comparison matrix before November 30.',
    },
    {
      question: 'How do OpenRouter discounted routes compare to direct vendor API billing?',
      answer:
        'OpenRouter charges 0% token markup on provider rates, offers $25,000/month in fee-free BYOK routing, and surfaces live provider-sponsored discounts (for example, DeepSeek V4.1 Flash at $0.14/$0.42 vs. $0.30/$1.20 direct peak, and Upstage Solar Mini 4.5 at $0.01/$0.04). Direct vendor accounts still make sense when you have committed enterprise spend, zero-data-retention contracts, or vendor-specific Batch SLAs.',
    },
    {
      question: 'How can I audit my monthly LLM API bill to avoid hidden renewal or tier hikes?',
      answer:
        'Combine this Deals & Billing Watch with our per-model calculators at /calculator/ to test your exact request volume, Prompt Caching hit ratio (up to 90%–97% read savings), 24-hour Batch API offload, and long-context step-up tiers. Always verify post-promo renewal rates and check whether subscription plans share weekly quotas across products.',
    },
  ],
  'zh-CN': [
    {
      question: '截至 2026 年 11 月 25 日，页面上的 AI 黑五优惠与官方算力额度真实性如何核验？',
      answer:
        '全部条目均由人工每日对照厂商一级官方定价页与更新日志逐项核验，最新核验时间为 2026-11-25（距 11 月 27 日黑五仅剩 T-2 天）。对于未推出官方黑五活动的厂商（如 OpenAI、Anthropic、Cursor、DeepSeek、Mistral AI），页面会如实标注“未查到官方黑五优惠”，严禁收录第三方代充、发卡网或未经核实的优惠码。',
    },
    {
      question: 'Mistral Vibe Pro 取消每月附赠的 $25.50 API 额度后，有哪些高性价比替代方案？',
      answer:
        '由于 Mistral Vibe Pro 已取消附赠 $25.50 API 额度且 Free 套餐移除了免费 Codestral 调用，个人开发者与出海团队可切换至按量计费的超低门槛模型：例如 Upstage Solar Mini 4.5（$0.01/$0.04 每百万 Token，524K 上下文与 90% 缓存折扣）、DeepSeek V4.1 Flash（OpenRouter 路由 $0.14/$0.42，97% 缓存仅 $0.0042/M）或智谱 GLM-5.3-Flash（$0.12/$0.38，支持 83.3% 缓存与 80.8% Batch 折扣）。',
    },
    {
      question: '11 月 30 日（T-5）即将到期的关键政策有哪些？研发团队应如何迁移？',
      answer:
        '11 月 30 日共有两项高影响截止节点：其一，Google Gemini 4 Carbon / Argon 的 $2/$10 优惠价到期，12 月 1 日起翻倍至 $4/$20（同时 gemini-2.5-pro/flash 将自动路由至 3.8-flash / 3.5-flash-lite 计费）；其二，OpenAI GPT-5.6 Sol 优惠到期，且 /v1/prompts、Evals API 与 Agent Builder 同步停服迁移。建议在 11/30 前使用本站对比矩阵评估迁移至 Claude Sonnet 5.5（$2/$10）、GPT-6.2 Sol（$2/$10）或高缓存开源节点。',
    },
    {
      question: '通过 OpenRouter 聚合路由调用折扣模型与官方直连 API 有什么区别？',
      answer:
        'OpenRouter 对模型单价保持 0% 加价（0% token markup），提供每月 $25,000 额度内免平台费的 BYOK 自带密钥路由，并实时同步厂商折扣节点（如 DeepSeek V4.1 Flash 在 OpenRouter 路由价为 $0.14/$0.42，低于官方直连峰期 $0.30/$1.20）。若团队已有厂商年度承诺消费额（Commit）、专属零留存合规协议（ZDR）或官方 Batch 专属配额，则更适合官方直连。',
    },
    {
      question: '如何系统审计自己的 API 月度账单，避免被隐性续费或阶梯涨价坑到？',
      answer:
        '建议将本页的“近期账单变化”预警与本站 /calculator/ 单模型计算器联动使用，按实际请求量代入 Prompt 缓存命中率（可省 80%–97%）、24 小时 Batch 异步批处理分流比例与长上下文阶梯阈值进行压力测算，并重点核对促销结束后的标准续费价与多产品共享周额度池规则。',
    },
  ],
  'zh-TW': [
    {
      question: '截至 2026 年 11 月 25 日，本頁的 AI 黑五優惠與官方算力額度如何保證真實且即時？',
      answer:
        '所有資料皆每日人工比對廠商一級官方定價頁與官方更新日誌，最新核對日期為 2026-11-25（距 11 月 27 日黑色星期五僅剩 T-2 天）。未推出官方促銷的廠商（如 OpenAI、Anthropic、Cursor、DeepSeek、Mistral AI）皆誠實標註「未查到官方黑五優惠」，絕不收錄第三方代儲或來路不明的優惠碼。',
    },
    {
      question: 'Mistral Vibe Pro 取消每月附贈的 $25.50 API 額度後，推薦改用哪些替代方案？',
      answer:
        '在 Mistral Vibe Pro 移除 $25.50 API 附贈額度且免費層停用 Codestral API 後，開發者可轉向按量計費的超低成本模型：包含 Upstage Solar Mini 4.5（$0.01/$0.04 每百萬 Tokens，524K 上下文與 90% 快取折扣）、DeepSeek V4.1 Flash（OpenRouter 路由 $0.14/$0.42，97% 快取讀低至 $0.0042/M）或 GLM-5.3-Flash（$0.12/$0.38，83.3% 快取與 80.8% Batch 折扣）。',
    },
    {
      question: '11 月 30 日（T-5）有哪些重大計費與停服期限？應如何提前遷移？',
      answer:
        '11 月 30 日有兩項重要截止日：首先，Google Gemini 4 Carbon 與 Argon 的 $2/$10 優惠價到期，12 月 1 日起將翻倍至 $4/$20（且 gemini-2.5-pro/flash 將於 12/1 自動路由至 3.8-flash / 3.5-flash-lite）；其次，OpenAI GPT-5.6 Sol 優惠到期，/v1/prompts、Evals API 與 Agent Builder 亦於同日停服。建議於 11/30 前透過對比頁評估切換至 Claude Sonnet 5.5（$2/$10）或 GPT-6.2 Sol（$2/$10）。',
    },
    {
      question: 'OpenRouter 的免費／折扣路由與廠商官網直連 API 該如何選擇？',
      answer:
        'OpenRouter 對代幣費率採 0% 加價（0% token markup），提供每月 $25,000 額度內免平台費的 BYOK 路由，並能直接接取各廠商讓利節點（如 Solar Mini 4.5 $0.01/$0.04 與 DeepSeek V4.1 Flash $0.14/$0.42）。若團隊已簽署官方企業合約、需要零資料留存（ZDR）或大量使用官方專屬 Batch SLA，則建議保留官網直連。',
    },
    {
      question: '開發者該如何審計每月 API 帳單，避免落入促銷後漲價或階梯計費陷阱？',
      answer:
        '建議配合本頁帳單規則追蹤與 /calculator/ 互動試算器，輸入實際月請求量、Prompt 快取命中率、Batch 非同步分流比例及長上下文階梯條件進行模擬，並在訂閱前確認優惠期後的標準續費價與週額度上限。',
    },
  ],
  ja: [
    {
      question: '2026年11月25日時点で掲載されている AI ブラックフライデー割引やクレジット情報は本当ですか？',
      answer:
        'はい。すべての項目は毎日ベンダーの一次公式料金ページおよび変更履歴と照合しており、最終確認日は 2026-11-25（11月27日のブラックフライデーまで T-2）です。OpenAI・Anthropic・Cursor・DeepSeek・Mistral AI のように公式キャンペーンがない企業は「公式BFセール未確認」と明記し、非公式リセラーや未検証クーポンは掲載しません。',
    },
    {
      question: 'Mistral Vibe Pro が月額 $25.50 の API クレジットを廃止した後、どの代替モデルへ移行すべきですか？',
      answer:
        'Mistral Vibe Pro の付帯クレジット（$25.50）廃止および Free プランからの Codestral API 除外を受け、低コストの従量課金モデルへの移行が有効です。Upstage Solar Mini 4.5（1Mあたり $0.01/$0.04、524K 文脈、キャッシュ 90% OFF）、OpenRouter 経由の DeepSeek V4.1 Flash（$0.14/$0.42、キャッシュ 97% OFF）、Z.ai GLM-5.3-Flash（$0.12/$0.38、Batch 80.8% OFF）が有力候補です。',
    },
    {
      question: '11月30日（T-5）に迫っている値上げ・サービス終了と推奨される移行策は何ですか？',
      answer:
        '11月30日に 2 つの重要期限が到来します。1 つ目は Google Gemini 4 Carbon / Argon の導入特価（$2/$10）終了で、12月1日に $4/$20 へ倍増します（同時に gemini-2.5-pro/flash は 3.8-flash / 3.5-flash-lite へ自動ルーティングされます）。2 つ目は OpenAI GPT-5.6 Sol 特典終了および /v1/prompts・Evals API・Agent Builder の提供終了です。期限前に Claude Sonnet 5.5（$2/$10）や GPT-6.2 Sol（$2/$10）との比較検証をおすすめします。',
    },
    {
      question: 'OpenRouter の割引ルートとベンダー公式 API 直結はどのように使い分けるべきですか？',
      answer:
        'OpenRouter はトークン単価上乗せ 0% で、月 $25,000 まで手数料無料の BYOK やベンダー協賛割引（DeepSeek V4.1 Flash $0.14/$0.42、Solar Mini 4.5 $0.01/$0.04 等）を単一キーで利用できます。一方、企業向けコミット割引やゼロデータ保持（ZDR）契約、公式直結の Batch 専用枠が必要な場合はベンダー直契約が適しています。',
    },
    {
      question: '更新価格や階層型課金による予想外の高額請求を防ぐための API 請求監査の方法は？',
      answer:
        '本ページの料金改定アラートと /calculator/ の各モデル別シミュレーターを併用し、月間リクエスト数・Prompt キャッシュヒット率・Batch API オフロード比率・長文コンテキスト階層を実データで試算してください。あわせてキャンペーン終了後の通常更新価格も事前確認することが重要です。',
    },
  ],
  ko: [
    {
      question: '2026년 11월 25일 기준 본 페이지의 AI 블랙프라이데이 프로모션과 API 크레딧 정보는 어떻게 검증되나요?',
      answer:
        "모든 항목은 매일 각 사의 1차 공식 요금 페이지와 공식 변경 로그를 직접 대조해 검증하며, 최신 확인일은 2026-11-25(11월 27일 블랙프라이데이 D-2)입니다. OpenAI, Anthropic, Cursor, DeepSeek, Mistral AI처럼 공식 프로모션이 없는 곳은 '공식 BF 할인 미확인'으로 투명하게 표기하며, 비공식 리셀러나 미검증 쿠폰은 절대 수록하지 않습니다.",
    },
    {
      question: 'Mistral Vibe Pro의 월 $25.50 API 크레딧 폐지 이후 어떤 대안 모델이 유리한가요?',
      answer:
        'Mistral Vibe Pro의 번들 크레딧($25.50) 폐지와 Free 티어의 무료 Codestral API 종료 이후에는 초저가 종량제 모델로 전환하는 것이 효율적입니다. Upstage Solar Mini 4.5(1M당 $0.01/$0.04, 524K 컨텍스트, 캐시 90% 할인), OpenRouter 경유 DeepSeek V4.1 Flash($0.14/$0.42, 캐시 97% 할인) 또는 GLM-5.3-Flash($0.12/$0.38, Batch 80.8% 할인)를 추천합니다.',
    },
    {
      question: '11월 30일(T-5)에 종료되는 주요 요금제·API와 권장 마이그레이션 전략은 무엇인가요?',
      answer:
        '11월 30일 두 가지 대형 변경이 임박했습니다. Google Gemini 4 Carbon과 Argon의 $2/$10 프로모션이 끝나고 12월 1일 $4/$20로 2배 인상되며(gemini-2.5-pro/flash는 3.8-flash / 3.5-flash-lite로 자동 라우팅), OpenAI는 GPT-5.6 Sol 특가 종료와 함께 /v1/prompts, Evals API, Agent Builder를 중단합니다. 11/30 전에 Claude Sonnet 5.5($2/$10)나 GPT-6.2 Sol($2/$10)로의 전환 비용을 비교해 보세요.',
    },
    {
      question: 'OpenRouter 할인 라우팅과 공식 벤더 API 직접 연동 중 무엇을 선택해야 하나요?',
      answer:
        'OpenRouter는 토큰 마크업 0% 정책과 월 $25,000까지 수수료 없는 BYOK를 지원하며, 공급사 후원 할인(DeepSeek V4.1 Flash $0.14/$0.42 등)을 단일 키로 자동 라우팅해 줍니다. 반면 약정 할인, 데이터 미보관(ZDR) 엔터프라이즈 계약, 공식 Batch SLA가 필요하다면 공식 API 직연동이 적합합니다.',
    },
    {
      question: '프로모션 종료 후 요금 폭탄을 피하려면 API 청구서를 어떻게 점검해야 하나요?',
      answer:
        '본 페이지의 요금 인상 알림과 /calculator/ 모델별 계산기를 함께 활용해 실제 요청량, 프롬프트 캐시 적중률(최대 90%–97% 절감), 24시간 Batch 오프로드 비율 및 긴 컨텍스트 단계별 요금을 시뮬레이션하고, 프로모션 이후 정상 갱신 단가를 반드시 확인하세요.',
    },
  ],
  es: [
    {
      question: '¿Son reales las ofertas de Black Friday y créditos de API verificados al 25 de noviembre de 2026?',
      answer:
        'Sí. Auditamos diariamente cada proveedor directamente en su dominio principal y registro oficial de cambios, con última verificación el 2026-11-25 (T-2 para el Black Friday del 27 de nov). Cuando proveedores como OpenAI, Anthropic, Cursor, DeepSeek o Mistral AI no tienen oferta oficial, lo indicamos claramente como «Sin oferta BF oficial», sin revendedores ni códigos falsos.',
    },
    {
      question: '¿Qué alternativas convienen ahora que Mistral Vibe Pro eliminó su crédito API mensual de $25.50?',
      answer:
        'Tras la retirada del crédito de $25.50 en Mistral Vibe Pro y el fin de la API gratuita de Codestral en el plan Free, puedes migrar a modelos de pago por uso de costo ultrabajo: Upstage Solar Mini 4.5 ($0.01/$0.04 por 1M, contexto 524K y 90% de descuento en caché), DeepSeek V4.1 Flash ($0.14/$0.42 en OpenRouter con 97% en caché) o GLM-5.3-Flash ($0.12/$0.38 con 83.3% en caché y 80.8% en Batch).',
    },
    {
      question: '¿Qué fechas límite vencen el 30 de noviembre de 2026 (T-5) y cómo migrar a tiempo?',
      answer:
        'El 30 de noviembre vencen dos cambios críticos: Google Gemini 4 Carbon y Argon terminan su tarifa inicial de $2/$10 y se duplican a $4/$20 el 1 de diciembre (además gemini-2.5-pro/flash pasarán a enrutamiento automático a 3.8-flash/3.5-flash-lite), y OpenAI retira /v1/prompts, Evals API y Agent Builder junto con la promo de GPT-5.6 Sol. Evalúa Claude Sonnet 5.5 ($2/$10) o GPT-6.2 Sol ($2/$10) antes del cierre.',
    },
    {
      question: '¿En qué se diferencia enrutar modelos con descuento vía OpenRouter frente a la API directa del proveedor?',
      answer:
        'OpenRouter aplica 0% de margen sobre los tokens, ofrece BYOK sin comisión hasta $25,000/mes y expone descuentos patrocinados por proveedores (como DeepSeek V4.1 Flash a $0.14/$0.42 o Solar Mini 4.5 a $0.01/$0.04). Las cuentas directas siguen siendo preferibles si cuentas con compromisos empresariales, acuerdos de retención cero (ZDR) o SLAs dedicados de Batch.',
    },
    {
      question: '¿Cómo auditar mi factura mensual de API para evitar subidas ocultas tras una promo?',
      answer:
        'Combina este monitor de cambios de facturación con nuestras calculadoras en /calculator/ para modelar tu volumen real, tasa de acierto de Prompt Caching, descarga a Batch API (24h) y tramos de contexto largo, verificando siempre la tarifa estándar de renovación antes de comprometer producción.',
    },
  ],
};

export function getDealsFaqs(locale: Locale): FAQItem[] {
  return DEALS_FAQS_BY_LOCALE[locale] || DEALS_FAQS_BY_LOCALE.en;
}
