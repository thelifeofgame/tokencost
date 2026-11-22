import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCHEMA_PATH = path.join(ROOT, 'src', 'data', 'model_pricing_schema.json');
const BADGES_DIR = path.join(ROOT, 'public', 'badges');

const THEMES = ['dark', 'light', 'indigo'];
const METRICS = ['input', 'inout', 'cache'];

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function estimateTextWidth(text, fontSize, isMono = false, letterSpacing = 0) {
  let width = 0;
  for (const ch of text) {
    if (isMono) {
      width += fontSize * 0.645;
    } else if ('ijlI1.,·: '.includes(ch)) {
      width += fontSize * 0.34;
    } else if ('mwMWGOQD@%'.includes(ch)) {
      width += fontSize * 0.80;
    } else if (ch >= 'A' && ch <= 'Z') {
      width += fontSize * 0.68;
    } else {
      width += fontSize * 0.56;
    }
  }
  if (letterSpacing > 0 && text.length > 1) {
    width += (text.length - 1) * letterSpacing;
  }
  return Math.ceil(width);
}

function formatBadgeRate(val) {
  if (val === 0) return '$0';
  if (val < 0.1) return `$${Number(val.toFixed(4))}`;
  const rounded4 = Number(val.toFixed(4));
  const str = String(rounded4);
  const dotIdx = str.indexOf('.');
  if (dotIdx !== -1 && str.length - dotIdx - 1 > 2) {
    return `$${str}`;
  }
  return `$${val.toFixed(2)}`;
}

function getShortModelLabel(model) {
  const colonIdx = model.modelName.indexOf(': ');
  const clean = colonIdx !== -1 ? model.modelName.slice(colonIdx + 2) : model.modelName;
  return clean.length > 26 ? `${clean.slice(0, 24)}…` : clean;
}

function getBadgeMetricText(model, metric) {
  if (metric === 'inout') {
    return `${formatBadgeRate(model.inputPerM)} · ${formatBadgeRate(model.outputPerM)}/1M`;
  }
  if (metric === 'cache') {
    if (model.cacheDiscountPercent > 0) {
      return `-${Math.round(model.cacheDiscountPercent)}% Cache (${formatBadgeRate(model.cachedInputPerM)}/1M)`;
    }
    return `${formatBadgeRate(model.inputPerM)}/1M`;
  }
  return `${formatBadgeRate(model.inputPerM)}/1M`;
}

function renderBadgeSvg(model, theme, metric, isHarnessPreset = false) {
  const brandLabel = theme === 'indigo' ? 'TOKENCOSTS AI' : 'TokenCosts AI';
  const leftLabelWidth = estimateTextWidth(
    brandLabel,
    theme === 'indigo' ? 10.5 : 11,
    false,
    theme === 'indigo' ? 0.4 : 0
  );
  const leftWidth = (theme === 'indigo' ? 23 : 22) + leftLabelWidth + 10;

  const rightEntity = isHarnessPreset
    ? theme === 'indigo'
      ? 'AGENT BENCHMARK'
      : 'Agent Benchmark'
    : theme === 'indigo'
      ? getShortModelLabel(model).toUpperCase()
      : getShortModelLabel(model);

  const rightValue = isHarnessPreset
    ? '1.2x–3.5x Audited'
    : getBadgeMetricText(model, metric);

  const separator = theme === 'indigo' ? ' · ' : ' ';
  const combinedRight = `${rightEntity}${separator}${rightValue}`;
  const rightTextWidth = estimateTextWidth(combinedRight, 10.5, true);
  const rightPadLeft = theme === 'indigo' ? 10 : 9;
  const rightWidth = rightPadLeft + rightTextWidth + 12;

  const totalWidth = leftWidth + rightWidth;
  const height = theme === 'indigo' ? 26 : 22;

  const safeTitle = escapeXml(
    isHarnessPreset
      ? 'TokenCosts AI: Coding Agent Token Multiplier 1.2x-3.5x Audited'
      : `TokenCosts AI: ${getShortModelLabel(model)} ${formatBadgeRate(model.inputPerM)} / ${formatBadgeRate(model.outputPerM)} per 1M`
  );
  const safeBrand = escapeXml(brandLabel);
  const safeEntity = escapeXml(rightEntity + separator);
  const safeValue = escapeXml(rightValue);
  const safeId = escapeXml(`${isHarnessPreset ? 'harness-benchmark' : model.modelId}-${metric}`);

  if (theme === 'dark') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}" role="img" aria-label="${safeTitle}">
  <title>${safeTitle}</title>
  <defs>
    <clipPath id="clip-dark-${safeId}">
      <rect width="${totalWidth}" height="${height}" rx="4"/>
    </clipPath>
  </defs>
  <g clip-path="url(#clip-dark-${safeId})">
    <rect x="0" y="0" width="${leftWidth}" height="${height}" fill="#09090B"/>
    <rect x="${leftWidth}" y="0" width="${rightWidth}" height="${height}" fill="#18181B"/>
    <rect x="${leftWidth - 0.5}" y="0" width="1" height="${height}" fill="#27272A"/>
    <path d="M13.5 5.5L8.5 11.5H12.5L11.5 16.5L16.5 10.5H12.5L13.5 5.5Z" fill="#818CF8"/>
  </g>
  <rect x="0.5" y="0.5" width="${totalWidth - 1}" height="${height - 1}" rx="3.5" fill="none" stroke="#27272A" stroke-width="1"/>
  <g font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" text-rendering="geometricPrecision">
    <text x="22" y="14.5" fill="#FAFAFA">${safeBrand}</text>
  </g>
  <g font-family="'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10.5" font-weight="500" text-rendering="geometricPrecision">
    <text x="${leftWidth + rightPadLeft}" y="14.5" fill="#A1A1AA">${safeEntity}<tspan fill="#34D399" font-weight="700">${safeValue}</tspan></text>
  </g>
</svg>`;
  }

  if (theme === 'light') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}" role="img" aria-label="${safeTitle}">
  <title>${safeTitle}</title>
  <defs>
    <clipPath id="clip-light-${safeId}">
      <rect width="${totalWidth}" height="${height}" rx="4"/>
    </clipPath>
  </defs>
  <g clip-path="url(#clip-light-${safeId})">
    <rect x="0" y="0" width="${leftWidth}" height="${height}" fill="#F4F4F5"/>
    <rect x="${leftWidth}" y="0" width="${rightWidth}" height="${height}" fill="#FFFFFF"/>
    <rect x="${leftWidth - 0.5}" y="0" width="1" height="${height}" fill="#E4E4E7"/>
    <path d="M13.5 5.5L8.5 11.5H12.5L11.5 16.5L16.5 10.5H12.5L13.5 5.5Z" fill="#4F46E5"/>
  </g>
  <rect x="0.5" y="0.5" width="${totalWidth - 1}" height="${height - 1}" rx="3.5" fill="none" stroke="#E4E4E7" stroke-width="1"/>
  <g font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" text-rendering="geometricPrecision">
    <text x="22" y="14.5" fill="#18181B">${safeBrand}</text>
  </g>
  <g font-family="'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10.5" font-weight="500" text-rendering="geometricPrecision">
    <text x="${leftWidth + rightPadLeft}" y="14.5" fill="#52525B">${safeEntity}<tspan fill="#059669" font-weight="700">${safeValue}</tspan></text>
  </g>
</svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}" role="img" aria-label="${safeTitle}">
  <title>${safeTitle}</title>
  <defs>
    <linearGradient id="indigo-grad-${safeId}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#4F46E5"/>
      <stop offset="100%" stop-color="#6366F1"/>
    </linearGradient>
    <clipPath id="clip-indigo-${safeId}">
      <rect width="${totalWidth}" height="${height}" rx="6"/>
    </clipPath>
  </defs>
  <g clip-path="url(#clip-indigo-${safeId})">
    <rect x="0" y="0" width="${leftWidth}" height="${height}" fill="#18181B"/>
    <rect x="${leftWidth}" y="0" width="${rightWidth}" height="${height}" fill="url(#indigo-grad-${safeId})"/>
    <rect x="0" y="0" width="${totalWidth}" height="1" fill="#FFFFFF" fill-opacity="0.14"/>
    <path d="M14.5 7.5L9.5 13.5H13.5L12.5 18.5L17.5 12.5H13.5L14.5 7.5Z" fill="#A5B4FC"/>
  </g>
  <rect x="0.5" y="0.5" width="${totalWidth - 1}" height="${height - 1}" rx="5.5" fill="none" stroke="#6366F1" stroke-opacity="0.45" stroke-width="1"/>
  <g font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="700" letter-spacing="0.4" text-rendering="geometricPrecision">
    <text x="23" y="16.8" fill="#FAFAFA">${safeBrand}</text>
  </g>
  <g font-family="'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10.5" font-weight="600" text-rendering="geometricPrecision">
    <text x="${leftWidth + rightPadLeft}" y="16.8" fill="#EEF2FF">${safeEntity}<tspan fill="#FFFFFF" font-weight="700">${safeValue}</tspan></text>
  </g>
</svg>`;
}

function main() {
  const raw = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  const models = raw.models || [];

  // Remove stale SVG files before regenerating so removed models don't linger
  let count = 0;
  for (const theme of THEMES) {
    const themeDir = path.join(BADGES_DIR, theme);
    fs.mkdirSync(themeDir, { recursive: true });
    for (const existing of fs.readdirSync(themeDir)) {
      if (existing.endsWith('.svg')) {
        fs.unlinkSync(path.join(themeDir, existing));
      }
    }

    // Generate per-model badges (3 metrics)
    for (const model of models) {
      // Guard against path traversal in modelId
      const safeModelId = model.modelId.replace(/[^a-zA-Z0-9._:-]/g, '_');
      for (const metric of METRICS) {
        const filename = metric === 'input' ? `${safeModelId}.svg` : `${safeModelId}-${metric}.svg`;
        const svg = renderBadgeSvg(model, theme, metric, false);
        fs.writeFileSync(path.join(themeDir, filename), svg, 'utf8');
        count++;
      }
    }

    // Generate Harness Benchmark badge
    const harnessSvg = renderBadgeSvg(
      { modelId: 'harness-benchmark', modelName: 'Agent Benchmark', inputPerM: 0, outputPerM: 0, cachedInputPerM: 0, cacheDiscountPercent: 0 },
      theme,
      'input',
      true
    );
    fs.writeFileSync(path.join(themeDir, 'harness-benchmark.svg'), harnessSvg, 'utf8');
    count++;
  }

  console.log(`Generated ${count} static SVG badges across ${models.length} models (+ harness benchmark) into public/badges/`);
}

main();
