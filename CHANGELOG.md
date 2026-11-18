# Changelog

本文件记录 TokenCosts AI 站点（tokencostsai.com）中的**结构性改动**，供其他团队接手时阅读。
日常内容/数据更新不在本文件范围内。

---

## 2026-11-14

### 摘要

| 项目 | 改动前 | 改动后 |
|---|---|---|
| 托管方式 | `python3 -m http.server 3000` 裸进程 | Caddy `file_server` 直出 `/srv/tokencostsai` |
| 可索引对比页（英文） | 332 | 3,096（1,547 个唯一组合） |
| 模型页死链 | 854 条 | 0 |
| sitemap 内对比页 | 12 | 1,547 |
| sitemap 总 URL | ~800 | 2,321 |
| 站点体积 | 606 MB | 3.2 GB |
| 构建耗时 | 3 分 16 秒 | 约 13 分钟 |

三块改动互相关联，按顺序说明。

---

### 一、静态托管迁移：python http.server → Caddy file_server

**问题**：`python3 -m http.server` 只是临时进程 —— 无开机自启、无 systemd、HTTP/1.0 每请求新建连接、无压缩、无缓存头、只记录 `127.0.0.1`。

**改动**：

- 发布目录改为 `/srv/tokencostsai`（**唯一部署目标**，不要再指向构建工作区的 `out/`）
- Caddy 站点配置 `/etc/caddy/acli.d/sites/tokencostsai.caddy` 改为：

```caddyfile
root * /srv/tokencostsai
encode zstd gzip
file_server
```

并加上缓存头、`/_next/static/*` 一年 immutable、JSON 访问日志 `/var/log/caddy/tokencostsai.log`（50 MB 轮转）。

**效果**（实测）：

| 路径 | 改动前 | 改动后 |
|---|---|---|
| 首页 | 31,488 B | 7,786 B（-75%） |
| `/models/` | 179,129 B | 15,901 B（-91%） |

响应头出现 `server: Caddy`、`content-encoding: zstd`、`cache-control`、`etag`。

**注意**：Caddyfile 设为 `admin off`，`caddy reload` 会失败（127.0.0.1:2019 拒连）。改配置后必须 `systemctl restart caddy`。

---

### 二、长尾对比页兜底（原方案 C）

**问题**：站点是 `output: 'export'` 纯静态导出，每个 URL 必须是构建产物。但：

- 对比选择器的下拉框列出**全部 367 个模型**
- `generateStaticParams` 只为一份硬编码的 tier-1 名单生成页面

结果：367 个模型两两组合共 **67,161 种**，实际只生成 332 页，**命中率 0.49%**，用户随便选两个模型 99.5% 概率 404。模型详情页的「Head-to-Head Comparisons」用同一套拼 URL 逻辑，902 条链接里 **854 条是死链**。

**改动**：

1. 新增按需渲染页 `/compare/view/?slug=<modelA>-vs-<modelB>`，客户端计算并渲染，`robots: noindex, nofollow`。
2. 新增自定义 404 页 `src/app/not-found.tsx`，挂载 `Compare404Redirect` 组件：访问 `/compare/<slug>/` 这类未预生成地址时，在浏览器端跳到 `/compare/view/?slug=…`。
3. 新增 `hasComparePage(slug)` 与 `compareHref(aId, bId)`，**全站唯一的对比链接生成入口**。

**关键设计：404 仍然返回 404 状态码，不做 302 重定向。**

- 对搜索引擎：那是正确的「页面不存在」信号，避免几万个长尾 URL 变成可抓取的软 404。
- 对真人：页面瞬间跳到渲染页，体验正常。

---

### 三、Tier-1 扩量 + sitemap 修复（原方案 B）

#### 3.1 模型名单 18 → 56

`src/lib/models-data.ts` 的 `TIER1_MODELS` 从 18 个扩到 56 个，覆盖 OpenAI(11)、Anthropic(8)、Google(7)、DeepSeek(5)、Qwen(3)、Meta/Groq(4)、xAI(2)、Zhipu(3)、Mistral(2)、Moonshot(2)，以及 NVIDIA / Cohere / Amazon / Perplexity / MiniMax / 字节 / 腾讯 / 微软 各 1 个旗舰。

选型依据：访问日志里被真实请求却 404 的对比 URL 频次 + 厂商覆盖度，并避开同一模型的多个快照（如 `gpt-5.6-terra` 与 `gpt-5.6-terra-pro` 价格完全相同）。

**构建期校验**：名单里出现数据中不存在的 modelId 会直接抛出错误，防止静默生成死页。

```
TIER1_MODELS 含数据中不存在的模型: <id>
```

#### 3.2 sitemap 只收录了 12 个对比页

原来 `sitemap.ts` 只映射 `P0_COMPARE_PAIRS`，**已有的 332 个静态对比页一个都没进 sitemap**，只能靠内链被发现。

现在按 `canonicalSlug` 去重收录全部组合（正反双向 canonical 指向同一地址，只收一次）：

| 类型 | 条数 |
|---|---|
| 对比页 | 1,547 |
| 模型页 | 367 |
| 计算器页 | 367 |
| 定价主题 | 4 |
| 核心页 × 6 语言 | 36 |
| **合计** | **2,321** |

#### 3.3 模型页内链重构

原来 `MODELS_DATA.filter(...).slice(0, 4)` —— 永远链列表最前面的 4 个模型，新页面全部成为孤儿页。

现在：

- 取 tier-1 名单内其他模型，按**输入价格接近度**排序
- 前 8 个渲染成卡片，其余渲染成紧凑 chips（`/models/gpt-4o/` 现在链 58 个对比页）

#### 3.4 减少抓取预算浪费

扩量后发现：311 个非 tier-1 模型页各挂 55 条指向 noindex 兜底页的内链，**全站 16,630 条**，是新增可索引页面的 5 倍，会拖慢新页收录。

现在非 tier-1 模型页只保留 4 条，并加 `rel="nofollow"`：

```
16,630 条 → 1,188 条
```

---

### 改动文件

新增：

| 文件 | 作用 |
|---|---|
| `src/app/compare/view/page.tsx` | 按需渲染对比页，`noindex` |
| `src/components/CompareFallbackClient.tsx` | 客户端按 slug 计算并渲染对比 |
| `src/app/not-found.tsx` | 自定义 404 页 |
| `src/components/Compare404Redirect.tsx` | 404 页上的长尾对比跳转 |
| `publish.sh` | 一键发布：build → rsync → 修权限 |

修改：

| 文件 | 改动 |
|---|---|
| `src/lib/models-data.ts` | `TIER1_MODELS`（56 个）、`compareHref()`、`hasComparePage()`，矩阵生成改用 `TIER1_MODELS` |
| `src/app/models/[id]/page.tsx` | 兄弟模型选择逻辑、卡片 + chips、兜底链接 nofollow |
| `src/app/compare/CompareClient.tsx` | 选择器改用 `compareHref()` |
| `src/app/sitemap.ts` | 收录全部预生成对比页，canonical 去重 |
| `/etc/caddy/acli.d/sites/tokencostsai.caddy` | 改为 `file_server` + 压缩 + 缓存 + 日志 |

---

### 写代码时必须遵守的约定

**1. 不要在页面里手写对比页地址。**

```ts
// ❌ 不要
href={`/compare/${a}-vs-${b}/`}

// ✅ 要
import { compareHref } from '@/lib/models-data';
href={compareHref(a, b)}
```

`compareHref()` 会判断该组合是否有预生成页，自动在 `/compare/<slug>/`（可索引）和 `/compare/view/?slug=…`（noindex 兜底）之间选择，并处理 `deepseek-r1` ↔ `o1` 的特殊别名。三处手写逻辑的漂移正是 854 条死链的成因。

**2. 增删 `TIER1_MODELS` 会影响三个方面**：页面数（N×(N-1)）、磁盘占用、构建时长。56 个模型约 3.2 GB / 13 分钟。加模型前先确认磁盘余量。

**3. 不要直接改 `/srv/tokencostsai`**，`publish.sh` 用 `rsync --delete`，手改会被覆盖。

**4. 对比页在 6 个语言目录各生成一份**（`/zh-CN/compare/…` 等），canonical 全部指向英文版。这是站点原有结构。

---

### 发布流程

```bash
cd <项目根>
./publish.sh
```

即 `npm run build` → `rsync -a --delete out/ /srv/tokencostsai/` → 修权限。

**发布前检查**：

- 磁盘至少 4 GB 余量（构建产物 3.2 GB，`/srv` 再占 3.2 GB）
- 构建 13 分钟，不要中途打断

---

### 验证记录（2026-11-14，已上线）

```
sitemap 2,321 条 URL 逐条比对磁盘        缺失 0
全站模型页对比链接死链                    0
tier-1 模型页静态内链                 4,484 条
指向 noindex 兜底页的内链             1,188 条
线上 /compare/gemini-4-hydrogen-vs-gpt-4o/   200，robots: index, follow，canonical 自指
线上 /models/gpt-4o/                         200，61 条对比链接
线上 /compare/deepseek-v4.1-flash-1017-vs-gpt-6.1-sol/  404 → 浏览器跳兜底页并正常渲染
首页 / 对比枢纽 / 兜底页 / sitemap            200（本机与 Cloudflare 公网双路径验证）
```

构建：46,111 个文件 / 3.2 GB。

---

### 已知限制与待决策

1. **程序化内容风险**：每个对比页约 7,100–7,400 字，数字与 FAQ 按模型参数生成，组合间确实不同但结构同构。建议上线后观察 Search Console 的收录率两周：若明显低于 50%，应**收缩名单**而不是继续扩。
2. **全量矩阵不可行**：367 个模型全量是 134,322 页、约 20 GB，已否决。
3. **6 份语言副本占空间**：把对比页限制为只生成英文可省约 2.6 GB，但会改变 `/zh-CN/compare/…` 等现有 URL 的可用性，属独立决策，本次未动。
4. **真实访客 IP 仍拿不到**：请求经 Cloudflare，Caddy 日志里的 `client_ip` 是 CF 边缘 IP。要拿真实 IP 需在 acli 托管的**全局** Caddy 配置加 `trusted_proxies`，会影响同机其他站点，未做。

---

### 回滚

本次改动没有 git 仓库纳管，回滚需手工：

1. 对比页扩量：把 `TIER1_MODELS` 改回原 18 个（`deepseek-v4.1-flash`、`deepseek-r1`、`deepseek-v3`、`gpt-6.1-terra`、`gpt-6.1-sol`、`gpt-6-luna`、`gpt-4o`、`gpt-4o-mini`、`o1`、`o3-mini`、`claude-sonnet-5.5`、`claude-fable-5.2`、`claude-haiku-4.5`、`claude-3-5-sonnet`、`claude-3-5-haiku`、`gemini-2.5-pro`、`gemini-2.5-flash`、`llama-3.3-70b`），重新 `./publish.sh`。
2. 托管方式：旧配置备份在 `/home/ubuntu/tokencostsai.caddy.bak-20261114-165125`（内容只有 `reverse_proxy 127.0.0.1:3000`）。
   注意：该备份**只还原反向代理**，还必须 3000 端口上有服务在跑，否则站点直接 502。
   更实际的做法是保留现在的 `file_server` 配置，只把 `/srv/tokencostsai` 换成旧构建产物（`rsync -a --delete <旧out>/ /srv/tokencostsai/`）。
