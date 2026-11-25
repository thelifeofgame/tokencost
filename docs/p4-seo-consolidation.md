# P4 · SEO 收敛

可索引价格详情仅包含英文和已本地化的简体中文。其余语言详情继续有静态 HTML，统一使用 `noindex, follow`，不再进入 sitemap 或成为价格详情页的 hreflang 目标。对比详情还必须符合白名单并使用 canonical 路径。原反向、别名和未入选路径照常生成。带冒号的目录变体保留原路径但不参与索引。修复导出时被 Next.js 转义的模型 ID 查找，以便这些旧路径渲染规格和计算器。

`src/data/compare_index_allowlist.json` 的初始名单由 `trending_comparisons.json` 和 30 个 Tier-1 模型两两组合构成。热门度是近期精选对比中出现的次数，同频用站内 `FEATURED_PRIORITY_ORDER` 和 Tier-1 顺序决定。它是当前数据可复现的站内代理指标，线上展示量由 Search Console CSV 补充。脚本按 canonical 聚合近 90 日导出的对比 URL 并追加达到阈值的条目。sitemap 只收录实际生成的 canonical URL。

`src/data/compare_verdicts.json` 选择前 30 组，先采用精选对比顺序，再按两款模型排名之和排序。结论由现有页面场景估算、上下文窗口和双方具有的同类 AA 评测字段生成。缺失的评测不参与。简中详情使用本地化模板与价格事实，模型官方名称及技术缩写保留原样。详情页价格日期优先使用模型记录中的核实日期，当前目录没有单条日期的模型沿用价格数据快照日期。静态 sitemap 有来源日期时使用数据日期，缺乏日期的常规页面省略 `lastModified`。

## 验证与维护

- `npm run build`、`npx tsc --noEmit`、`npm run lint` 和已有单测。
- 使用 `node scripts/verify-seo-export.mjs <旧 out/> <新 out/>` 比较全部 HTML 路径与可索引页面数，检查价格详情和 sitemap 的 hreflang 都指向可索引页面。
- 用带千分位的合成 CSV 验证导入阈值、站点过滤和重复运行。桌面、移动端各配浅色、深色截图，验证简中模型页、对比结论及计算器。
- 正式站点部署后，在 Search Console 和 Bing Webmaster Tools 添加域名验证 DNS 记录，再提交 sitemap。更新白名单时从 Search Console「网页」导出最近 90 天，执行 `node scripts/update-compare-allowlist.mjs Pages.csv 100`，然后审阅差异并重新构建。
- 此阶段无需新密钥或 D1 迁移。其他语言的价格详情仍待完整本地化，搜索引擎何时更新索引由各搜索引擎决定。
