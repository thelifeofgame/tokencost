export function getAnalyticsBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('tokencostsai.com')) {
    return '/api/analytics';
  }
  return 'https://tokencostsai.com/api/analytics';
}

export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  if (Math.abs(value) < 1000) return Math.round(value).toLocaleString('en-US');
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: value >= 100_000 ? 1 : 1,
  }).format(value);
}

export function formatExactInt(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return Math.round(value).toLocaleString('en-US');
}

export function formatPct(value: number, decimals = 1): string {
  if (!Number.isFinite(value) || value < 0) return '0.0%';
  return `${value.toFixed(decimals)}%`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let val = bytes;
  let idx = 0;
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024;
    idx += 1;
  }
  return `${val >= 100 ? val.toFixed(0) : val >= 10 ? val.toFixed(1) : val.toFixed(2)} ${units[idx]}`;
}

export function countryCodeToFlag(code: string): string {
  const upper = (code || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper) || upper === 'XX') return '🌐';
  const A = 0x1f1e6;
  return String.fromCodePoint(
    A + (upper.charCodeAt(0) - 65),
    A + (upper.charCodeAt(1) - 65)
  );
}

export function formatTimeHms(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}
