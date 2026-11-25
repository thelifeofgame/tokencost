# P0 · 回访度量与基础修复

## 改动

| 范围 | 文件 | 目的 |
| --- | --- | --- |
| 第一方统计 | `src/lib/analytics.ts`、`src/components/AnalyticsTracker.tsx`、`workers/visits-24h/` | 用本地生成的随机 `tc_vid` 统计同一浏览器的跨会话回访。D1 每访客每日一条，公开收集端拒绝 `subscribe_confirmed`。 |
| 后台 | `src/app/admin/page.tsx`、`src/components/admin/AdminGrowth.tsx`、`src/types/analytics.ts` | 显示 1 日和 7 日回访率、订阅提交与确认以及各增长事件计数。 |
| 首页 | `src/app/page.tsx` | 在静态 HTML 中直接展示默认模拟结果，客户端接管后启用控件、解析分享参数并上报计算和分享事件。 |
| 优惠 | `src/components/deals/`、`src/data/official_deals.json`、`src/types/deals.ts`、`src/lib/deals-faq-data.ts` | 卡片和表格共用同一个结构化截止时间。HTML 包含绝对时间，客户端用当前 UTC 时间计算剩余天数。结构化日期移自现有已核验条目，沿用各条目的官方来源和核实日期。 |
| 质量指数与披露 | `src/components/ComparePage.tsx`、`src/app/models/ModelsClient.tsx`、`src/components/{CostChart,LeaderboardTable,TrackedAffiliateLink,Navbar,SponsorBanner,ConfigExporterModal,Footer}.tsx` | 缺失评测显示明确状态，模型价格对比继续基于已有价格数据。OpenRouter 推荐入口标明推荐关系，页脚披露潜在佣金。 |
| 本地化与路由类型 | `src/i18n/`、英文及本地化详情路由、`src/components/{ModelCalculatorPage,ModelDetailPage,ComparePage,PricingTopicPage}.tsx` | 新文案提供 en 和 zh-CN，zh-TW、ja、ko、es 复用英文。将共享视图和元数据方法移出路由模块，通过 Next.js 路由类型校验，保留原有 URL。 |

回访分母是最近 30 个已经完整度过第 7 天的 UTC 首访日队列。第 1 天与第 7 天分别按当天是否至少发生一次页面访问计算；队列为空时显示横线。浏览器清除存储、使用不同设备或禁用本地存储会影响观测。访客与每日访问按 90 天窗口清理，长期未回访的访客后续可能被计为新访客。

后台展示的订阅计数按事件日期聚合，目前是后续阶段要接通的漏斗基础。确认事件预留给 P1 服务端记录，高级设置和保存场景由 P2 接通，会员选择器和推荐点击由 P3 接通。P0 实际发出的新事件是 `simulator_run`、`scenario_share_copy` 和识别 `utm_source=digest` 的 `digest_click`。日维度事件卡片沿用现有分析时间范围的 UTC 日边界。漏斗的确认数与提交数可能来自不同批次，P1 应接通按提交队列计算的转化。

## 本地验证

- `npm run build` 后运行 `node scripts/verify-p0-export.mjs out`，检查六种语言首页的静态模拟器，以及英文和简体中文 Deals 的绝对时间。
- `npx tsc --noEmit` 和 `npm run lint`。详情页开发生成的路由类型也纳入检查。
- 使用本地 D1 和 `wrangler dev --local` 验证收集接口及需认证的后台。用两个成熟访客和一个未成熟访客验证 1 日回访率 100%、7 日回访率 50%。浏览器验证运行模拟、复制分享链接、邮件来源事件和本地访客 ID 持久化。桌面和移动端的浅色、深色截图随验收交付。

本地 Worker 命令在 `workers/visits-24h/` 下执行。用仅限本地的测试值设置 `ADMIN_PASSWORD` 和 `ADMIN_SESSION_SECRET`。

```bash
wrangler d1 execute tokencost-visits-db --local --file schema.sql
wrangler d1 migrations apply tokencost-visits-db --local
wrangler dev --local --var ANALYTICS_LOCAL_ORIGIN:http://127.0.0.1:3011
```

在仓库根目录启动开发站点后，可用浏览器网络面板确认事件送达本地 Worker。

```bash
NEXT_PUBLIC_LOCAL_ANALYTICS_COLLECT=http://127.0.0.1:8787/api/analytics/collect \
  npm run dev -- --hostname 127.0.0.1 --port 3011
```

## 生产操作待确认

1. 在授权后备份生产 D1，从 `workers/visits-24h/` 执行 `wrangler d1 migrations apply tokencost-visits-db --remote`。等待迁移成功再执行 `wrangler deploy`。
2. 在部署机检查外部数据管线提供的 `official_deals.json` 是否含 `providers[].promoDeadlines`。每一项为 `{ offer, endsAt }`，时间字段使用 ISO 日期或带 UTC 时区的时间戳。生产预构建会用管线数据覆盖仓库快照。旧数据仍可显示优惠原文，但缺少结构化字段的条目无法显示其动态倒计时。
3. 在部署机按现有流程执行 `bash deploy.sh`，检查首页、Deals 和后台。回滚可恢复上一版 Worker 与静态产物，新增的 D1 表可以保留。
4. Search Console 与 Bing 的 DNS 验证留给 SEO 阶段。邮件域名 SPF/DKIM、Turnstile key 及 Resend 和 Turnstile 的 `wrangler secret` 设置留给 P1。已确认默认使用 `notify@tokencostsai.com`，周报计划每周一北京时间 09:00，会员栏目首发 en 和 zh-CN。

静态导出的 Next.js Middleware 和 API Routes 仍由静态托管约束禁用。P0 API 继续由 Cloudflare Worker 提供。
