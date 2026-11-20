import { Locale, LocaleConfig, TranslationDictionary } from './types';
import { en } from './locales/en';
import { zhCN } from './locales/zh-CN';
import { zhTW } from './locales/zh-TW';
import { ja } from './locales/ja';
import { ko } from './locales/ko';
import { es } from './locales/es';

export * from './types';

export const DEFAULT_LOCALE: Locale = 'en';

export const SUPPORTED_LOCALES: LocaleConfig[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    shortLabel: 'EN',
    dateFormat: 'en-US',
    numberFormatLocale: 'en-US',
  },
  {
    code: 'zh-CN',
    name: 'Simplified Chinese',
    nativeName: '简体中文',
    flag: '🇨🇳',
    shortLabel: '简中',
    dateFormat: 'zh-CN',
    numberFormatLocale: 'zh-CN',
  },
  {
    code: 'zh-TW',
    name: 'Traditional Chinese',
    nativeName: '繁體中文',
    flag: '🇹🇼',
    shortLabel: '繁中',
    dateFormat: 'zh-TW',
    numberFormatLocale: 'zh-TW',
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    shortLabel: '日',
    dateFormat: 'ja-JP',
    numberFormatLocale: 'ja-JP',
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    shortLabel: '한',
    dateFormat: 'ko-KR',
    numberFormatLocale: 'ko-KR',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    shortLabel: 'ES',
    dateFormat: 'es-ES',
    numberFormatLocale: 'es-ES',
  },
];

export const translations: Record<Locale, TranslationDictionary> = {
  en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  ja,
  ko,
  es,
};

export function getTranslation(locale: Locale): TranslationDictionary {
  return translations[locale] || translations[DEFAULT_LOCALE];
}

export function formatModelCount(template: string, count: number): string {
  return template.replace(/\{count\}/g, String(count));
}

export function isValidLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.some((l) => l.code === locale);
}

/**
 * Extracts the locale from a given pathname or URL, e.g.:
 * 'https://tokencostsai.com/zh-CN/compare/' => { locale: 'zh-CN', pathnameWithoutLocale: '/compare/' }
 * '/zh-CN/compare/' => { locale: 'zh-CN', pathnameWithoutLocale: '/compare/' }
 * '/compare/' => { locale: 'en', pathnameWithoutLocale: '/compare/' }
 */
export function extractLocaleFromPath(pathname: string): {
  locale: Locale;
  pathnameWithoutLocale: string;
} {
  const pathOnly = pathname.replace(/^https?:\/\/[^/]+/, '') || '/';
  const segments = pathOnly.split('/').filter(Boolean);
  if (segments.length > 0 && isValidLocale(segments[0])) {
    const locale = segments[0];
    const rest = segments.slice(1).join('/');
    const pathnameWithoutLocale = rest ? `/${rest}/` : '/';
    return { locale, pathnameWithoutLocale };
  }
  return {
    locale: DEFAULT_LOCALE,
    pathnameWithoutLocale: pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`,
  };
}

/**
 * Builds a localized path:
 * e.g. path='/compare/deepseek-r1-vs-openai-o1/', locale='zh-CN' => '/zh-CN/compare/deepseek-r1-vs-openai-o1/'
 * e.g. path='/compare/', locale='en' => '/compare/' (default locale has no prefix)
 */
export function getLocalizedPath(path: string, locale: Locale): string {
  const { pathnameWithoutLocale } = extractLocaleFromPath(path);
  const cleanPath = pathnameWithoutLocale.replace(/^\/+/, '');
  if (locale === DEFAULT_LOCALE) {
    return cleanPath ? `/${cleanPath}` : '/';
  }
  return cleanPath ? `/${locale}/${cleanPath}` : `/${locale}/`;
}

/**
 * Generates canonical and alternate hreflang URLs for SEO.
 */
export function generateHreflangTags(canonicalPath: string) {
  const baseUrl = 'https://tokencostsai.com';
  const { pathnameWithoutLocale } = extractLocaleFromPath(canonicalPath);
  const cleanPath = pathnameWithoutLocale.replace(/^\/+|\/+$/g, '');
  const suffix = cleanPath ? `${cleanPath}/` : '';

  const alternates: { hrefLang: string; href: string }[] = [];

  // Default fallback (x-default points to default en)
  alternates.push({
    hrefLang: 'x-default',
    href: `${baseUrl}/${suffix}`,
  });

  // All 6 locales
  for (const loc of SUPPORTED_LOCALES) {
    if (loc.code === DEFAULT_LOCALE) {
      alternates.push({
        hrefLang: loc.code,
        href: `${baseUrl}/${suffix}`,
      });
    } else {
      alternates.push({
        hrefLang: loc.code,
        href: `${baseUrl}/${loc.code}/${suffix}`,
      });
    }
  }

  return alternates;
}
