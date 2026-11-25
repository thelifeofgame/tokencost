# P1 · 降价提醒与每周周报

`scripts/generate-prices-current.mjs` 在同步数据后导出完整模型价格和已记录截止时间的官方优惠。现有 Worker 小时任务将版本化价格快照、变化和发件队列写入 D1。首次采集建立基线。一个版本内同一订阅者只收到一封降价提醒。周一 01:00 UTC（北京时间 09:00）生成周报，空周跳过。邮件模板提供 en、zh-CN；繁中使用简中邮件，日、韩、西语使用英文邮件。表单提供 en、zh-CN，其余语言复用 en。

`SubscribeBox` 覆盖首页、页脚、模型页与对比页。重复请求使用相同响应，已确认的订阅者通过新邮件确认关注范围变更。邮箱只保存在订阅表，IP 限流使用按日轮换哈希。退订删除关注和队列，小时任务在 29 天后删除邮箱。确认事件由 D1 状态变更触发，仅将匿名日计数写入统计。邮件支持 RFC 8058 一键退订，通知队列使用 Resend 幂等键。价格变动公开接口缓存五分钟。

## 验证

- `node --test tests/alerts.test.mjs` 覆盖价格比较、合并提醒、周报区间、链接参数和退订邮件头。
- 云端本地 `wrangler dev --local --test-scheduled` 与本地 D1 验证初始快照、双重确认、一次变更的两个价格字段、单封合并提醒、重复快照、周报和退订。邮件使用 dry-run。浏览器验证简中模型页默认勾选、本地请求和提交反馈，并保存四种视口与主题组合的截图。
- `npm run build`、`npx tsc --noEmit`、`npm run lint`。正式 Turnstile 和 Resend 发送需用环境所有者的配置验证。

## 在另一台服务器上线时

1. 在 Resend 验证 `tokencostsai.com` 发件域 SPF/DKIM。发件人为 `notify@tokencostsai.com`。
2. 为两个站点主机配置 Turnstile。静态构建时设置公开的 `NEXT_PUBLIC_TURNSTILE_SITE_KEY`。Worker 通过 `wrangler secret put` 设置 `RESEND_API_KEY`、`TURNSTILE_SECRET`、`ALERTS_TOKEN_SECRET`。签名密钥应是独立的高熵随机值，轮换会让旧退订链接失效。
3. 从 `workers/visits-24h/` 备份 D1，执行 `wrangler d1 migrations apply tokencost-visits-db --remote`。发布静态站点后确认 `/prices-current.json` 可读，再由部署者运行 `wrangler deploy`。前端上线前应已配置 Turnstile 公开站点密钥。生产环境使用正常邮件模式，dry-run 变量只用于本地。
4. Search Console 和 Bing DNS 验证属于 P4。云端验证未使用生产密钥、真实邮箱或生产 D1。
