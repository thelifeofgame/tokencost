import { Locale, SUPPORTED_LOCALES, DEFAULT_LOCALE, isValidLocale } from '@/i18n';

export const BASE_URL = 'https://tokencostsai.com';

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
