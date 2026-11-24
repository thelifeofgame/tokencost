export type BadgeTheme = 'dark' | 'light' | 'indigo';
export type BadgeMetricMode = 'input' | 'inout' | 'cache';

export interface BadgeModelInput {
  modelId: string;
  modelName: string;
  inputPerM: number;
  outputPerM: number;
  cachedInputPerM: number;
  cacheDiscountPercent: number;
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function estimateTextWidth(
  text: string,
  fontSize: number,
  isMono = false,
  letterSpacing = 0
): number {
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

export function formatBadgeRate(val: number): string {
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

export function getShortModelLabel(model: BadgeModelInput): string {
  // Strip noisy org prefix if present (e.g. "Google: Gemini 4 Neon" -> "Gemini 4 Neon")
  const colonIdx = model.modelName.indexOf(': ');
  const clean = colonIdx !== -1 ? model.modelName.slice(colonIdx + 2) : model.modelName;
  return clean.length > 26 ? `${clean.slice(0, 24)}…` : clean;
}

export function getBadgeMetricText(model: BadgeModelInput, metric: BadgeMetricMode): string {
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

export function getBadgeFileName(modelId: string, metric: BadgeMetricMode): string {
  if (metric === 'input') return `${modelId}.svg`;
  return `${modelId}-${metric}.svg`;
}

export function getBadgePublicUrl(
  theme: BadgeTheme,
  modelId: string,
  metric: BadgeMetricMode,
  isHarnessPreset = false
): string {
  if (isHarnessPreset) {
    return `https://tokencostsai.com/badges/${theme}/harness-benchmark.svg`;
  }
  return `https://tokencostsai.com/badges/${theme}/${getBadgeFileName(modelId, metric)}`;
}

export function getBadgeRelativePath(
  theme: BadgeTheme,
  modelId: string,
  metric: BadgeMetricMode,
  isHarnessPreset = false
): string {
  if (isHarnessPreset) {
    return `/badges/${theme}/harness-benchmark.svg`;
  }
  return `/badges/${theme}/${getBadgeFileName(modelId, metric)}`;
}

export function getBadgeTargetUrl(modelId: string, isHarnessPreset = false): string {
  if (isHarnessPreset) {
    return 'https://tokencostsai.com/harness/?utm_source=github_badge&utm_medium=readme&utm_campaign=harness_benchmark';
  }
  return `https://tokencostsai.com/models/${encodeURIComponent(modelId)}/?utm_source=github_badge&utm_medium=readme&utm_campaign=${encodeURIComponent(modelId)}`;
}

export function getBadgeAltText(model: BadgeModelInput, isHarnessPreset = false): string {
  if (isHarnessPreset) {
    return 'Coding Agent Token Multiplier (1.2x-3.8x) & BYOK Cost Benchmark | Audited by TokenCosts AI';
  }
  const displayName = getShortModelLabel(model);
  const inStr = formatBadgeRate(model.inputPerM);
  const outStr = formatBadgeRate(model.outputPerM);
  const cacheStr =
    model.cacheDiscountPercent > 0 ? `, ${Math.round(model.cacheDiscountPercent)}% Cache` : '';
  return `API Cost - ${displayName} (${inStr}/${outStr} per 1M${cacheStr}) | Audited by TokenCosts AI`;
}

export function renderBadgeSvg(
  model: BadgeModelInput,
  theme: BadgeTheme,
  metric: BadgeMetricMode,
  isHarnessPreset = false
): string {
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
    ? '1.2x–3.8x Audited'
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
      ? 'TokenCosts AI: Coding Agent Token Multiplier 1.2x-3.8x Audited'
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

  // indigo theme (26px)
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
