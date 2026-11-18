# TokenCosts AI (Tokencost) - Global LLM Pricing, Benchmarks & Smart Routing

[![TokenCosts AI](https://img.shields.io/badge/Status-Live%20in%20Production-emerald)](https://tokencostsai.com)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2%20App%20Router-black)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> The Ultimate AI Bill Simulator & Smart Model Router for Developers, SaaS Builders, and AI FinOps.

🌐 **Production Website**: [https://tokencostsai.com](https://tokencostsai.com)

---

## 🚀 Key Features

- **True-Cost Simulator**: Accurate calculation of base input/output rates, Prompt Caching hit/write amortization (OpenAI, Anthropic 5m cache, DeepSeek, Google Context Cache), Batch API 50% discounts, and long-context tiered pricing (>128k/272k).
- **Context-Aware Smart Router**: Automatically recommends Pareto-optimal multi-model routing combinations (e.g. Planning: DeepSeek-R1 + Execution: Claude 3.5 Sonnet / GPT-6.2 Sol + Extraction: Flash models) saving up to 70%~93%.
- **370+ Global Foundational Models**: Standardized catalog tracking rates, context windows, throughput (t/s), latency (TTFT), and Artificial Analysis benchmark indices.
- **Frontier Comparisons**: Pre-rendered SSG comparison matrix covering 1,400+ head-to-head pairs with letter-ordered canonical slugs and dynamic OpenGraph assets.
- **Global Multi-Language (i18n)**: Native sub-path support for 6 key languages (`en`, `zh-CN`, `zh-TW`, `ja`, `ko`, `es`) with preserved state across URL queries.
- **One-Click Config Export**: Instant code generation for LiteLLM `config.yaml`, Vercel AI SDK (TypeScript), and OpenAI SDK (Python).

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router, Static Site Generation `output: 'export'`)
- **Styling**: Tailwind CSS, Shadcn/UI
- **Icons**: Lucide React
- **Hosting / Edge**: High-speed Caddy reverse proxy & static file server behind Cloudflare CDN
- **Data Pipelines**: Automated Python data ingestion syncing live provider fees, Artificial Analysis intelligence scores, and OpenRouter rankings daily.

---

## 📦 Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm / yarn / pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/thelifeofgame/tokencost.git
cd tokencost

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the simulator locally.

### Production Build & Export

```bash
# Export static pages to out/ directory
npm run build
```

---

## 📄 License

This project is licensed under the MIT License.
