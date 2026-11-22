import { Locale, SUPPORTED_LOCALES, DEFAULT_LOCALE, isValidLocale } from '@/i18n';
import { LIVE_MODEL_COUNT } from '@/lib/live-copy-helpers';

export const BASE_URL = 'https://tokencostsai.com';
export const DEFAULT_OG_IMAGE_URL = `${BASE_URL}/og-image.png`;

export const OG_LOCALE_MAP: Record<Locale, string> = {
  en: 'en_US',
  'zh-CN': 'zh_CN',
  'zh-TW': 'zh_TW',
  ja: 'ja_JP',
  ko: 'ko_KR',
  es: 'es_ES',
};

export function getOgLocale(locale: Locale = DEFAULT_LOCALE): string {
  return OG_LOCALE_MAP[locale] || 'en_US';
}

export const DEFAULT_OG_IMAGES = [
  {
    url: DEFAULT_OG_IMAGE_URL,
    width: 1200,
    height: 630,
    alt: `TokenCosts AI (tokencostsai.com) — ${LIVE_MODEL_COUNT}+ LLM API Pricing, Cache & Smart Router`,
  },
];

export function resolveLocale(locale?: string): Locale {
  if (locale && isValidLocale(locale)) {
    return locale;
  }
  return DEFAULT_LOCALE;
}

/**
 * Normalizes a path without locale prefix so it always ends with `/`
 * (matching `trailingSlash: true` in next.config.mjs).
 */
export function buildLocalizedCanonical(
  pathWithoutLocale: string,
  locale: Locale = DEFAULT_LOCALE
): string {
  const clean = pathWithoutLocale.replace(/^\/+|\/+$/g, '');
  const suffix = clean ? `${clean}/` : '';
  return locale === DEFAULT_LOCALE
    ? `${BASE_URL}/${suffix}`
    : `${BASE_URL}/${locale}/${suffix}`;
}

/**
 * Builds Next.js Metadata `alternates` with self-referencing canonical
 * and complete 7-entry hreflang map (6 locales + x-default).
 */
export function buildAlternates(
  pathWithoutLocale: string,
  currentLocale: Locale = DEFAULT_LOCALE
): {
  canonical: string;
  languages: Record<string, string>;
} {
  const languages: Record<string, string> = {
    'x-default': buildLocalizedCanonical(pathWithoutLocale, DEFAULT_LOCALE),
  };

  for (const loc of SUPPORTED_LOCALES) {
    languages[loc.code] = buildLocalizedCanonical(pathWithoutLocale, loc.code);
  }

  return {
    canonical: buildLocalizedCanonical(pathWithoutLocale, currentLocale),
    languages,
  };
}
