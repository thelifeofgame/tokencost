'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  Locale,
  LocaleConfig,
  TranslationDictionary,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  translations,
  getTranslation,
  extractLocaleFromPath,
  getLocalizedPath as buildLocalizedPath,
} from './index';
import { getHtmlLang } from '@/lib/seo-alternates';
import { trackEvent } from '@/lib/analytics';

interface I18nContextValue {
  locale: Locale;
  t: TranslationDictionary;
  locales: LocaleConfig[];
  currentLocaleConfig: LocaleConfig;
  setLocale: (newLocale: Locale) => void;
  getLocalizedPath: (path: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const pathname = usePathname() || '/';

  // Initialize from path or prop
  const pathLocale = useMemo(() => {
    return extractLocaleFromPath(pathname).locale;
  }, [pathname]);

  const [locale, setLocaleState] = useState<Locale>(initialLocale || pathLocale || DEFAULT_LOCALE);

  // Sync state if URL path changes (e.g. direct navigation)
  useEffect(() => {
    const { locale: currentPathLocale } = extractLocaleFromPath(pathname);
    if (currentPathLocale && currentPathLocale !== locale) {
      setLocaleState(currentPathLocale);
    }
  }, [pathname, locale]);

  // Client-side locale detection on first mount if at root
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set document lang attribute using BCP 47 tag
    document.documentElement.lang = getHtmlLang(locale);

    // If at root and no explicit initialLocale was passed, check saved preferences
    const { locale: fromPath } = extractLocaleFromPath(window.location.pathname);
    if (fromPath === DEFAULT_LOCALE && window.location.pathname === '/') {
      const saved = localStorage.getItem('tokencost_locale') as Locale | null;
      if (saved && SUPPORTED_LOCALES.some((l) => l.code === saved) && saved !== DEFAULT_LOCALE) {
        setLocaleState(saved);
        document.documentElement.lang = getHtmlLang(saved);
      } else if (!saved && navigator.language) {
        // Detect from browser Accept-Language
        const navLang = navigator.language.toLowerCase();
        let matched: Locale | null = null;
        if (navLang.startsWith('zh-tw') || navLang.startsWith('zh-hk')) matched = 'zh-TW';
        else if (navLang.startsWith('zh')) matched = 'zh-CN';
        else if (navLang.startsWith('ja')) matched = 'ja';
        else if (navLang.startsWith('ko')) matched = 'ko';
        else if (navLang.startsWith('es')) matched = 'es';

        if (matched) {
          setLocaleState(matched);
          document.documentElement.lang = getHtmlLang(matched);
        }
      }
    }
  }, [locale]);

  const setLocale = useCallback(
    (newLocale: Locale) => {
      if (newLocale === locale) return;
      const subscriptionPage = /^(?:\/zh-CN)?\/ai-subscriptions(?:\/|$)/.test(pathname);
      if (subscriptionPage && newLocale !== 'en' && newLocale !== 'zh-CN') return;
      const { pathnameWithoutLocale } = extractLocaleFromPath(pathname);
      const priceDetailPage = /^\/(?:models|compare|calculator)\/(?!view\/?$)[^/]+\/?$/.test(pathnameWithoutLocale);

      const oldLocale = locale;
      setLocaleState(newLocale);

      if (typeof window !== 'undefined') {
        // 1. Persist in localStorage and Cookie
        localStorage.setItem('tokencost_locale', newLocale);
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
        document.documentElement.lang = getHtmlLang(newLocale);

        // 2. Track commercial event (dataLayer)
        trackEvent('language_change', {
          from_locale: oldLocale,
          to_locale: newLocale,
          current_path: window.location.pathname,
        });

        // 3. Seamless Hot-Switching of URL without losing state
        const currentSearch = window.location.search || '';
        const currentHash = window.location.hash || '';
        const newPath = buildLocalizedPath(window.location.pathname, newLocale);
        const fullNewTarget = `${newPath}${currentSearch}${currentHash}`;

        // These pages render their translated pricing copy as static HTML.
        if (subscriptionPage || priceDetailPage) {
          window.location.assign(fullNewTarget);
          return;
        }
        window.history.pushState(null, '', fullNewTarget);
      }
    },
    [locale, pathname]
  );

  const getLocalizedPath = useCallback(
    (path: string) => {
      return buildLocalizedPath(path, locale);
    },
    [locale]
  );

  const t = useMemo(() => getTranslation(locale), [locale]);

  const currentLocaleConfig = useMemo(() => {
    return SUPPORTED_LOCALES.find((l) => l.code === locale) || SUPPORTED_LOCALES[0];
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      t,
      locales: SUPPORTED_LOCALES,
      currentLocaleConfig,
      setLocale,
      getLocalizedPath,
    }),
    [locale, t, currentLocaleConfig, setLocale, getLocalizedPath]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback if rendered outside provider
    const t = translations[DEFAULT_LOCALE];
    return {
      locale: DEFAULT_LOCALE,
      t,
      locales: SUPPORTED_LOCALES,
      currentLocaleConfig: SUPPORTED_LOCALES[0],
      setLocale: () => {},
      getLocalizedPath: (p: string) => p,
    };
  }
  return context;
}
