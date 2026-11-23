'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { trackEvent } from '@/lib/analytics';
import {
  ThemeMode,
  THEME_CHANGE_EVENT,
  applyTheme,
  readCurrentTheme,
} from '@/lib/theme';

interface ThemeToggleProps {
  placement?: 'navbar_desktop' | 'navbar_mobile';
  size?: 'desktop' | 'mobile';
  className?: string;
}

export function useSyncedTheme(): ThemeMode {
  const [theme, setTheme] = useState<ThemeMode>('dark');

  useEffect(() => {
    setTheme(readCurrentTheme());
    const handleSync = (e: Event) => {
      const detail = (e as CustomEvent<ThemeMode>).detail;
      setTheme(detail || readCurrentTheme());
    };
    window.addEventListener(THEME_CHANGE_EVENT, handleSync);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, handleSync);
  }, []);

  return theme;
}

export default function ThemeToggle({
  placement = 'navbar_desktop',
  size = 'desktop',
  className = '',
}: ThemeToggleProps) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const theme = useSyncedTheme();

  const handleToggle = () => {
    const themeFrom = readCurrentTheme();
    const themeTo: ThemeMode = themeFrom === 'dark' ? 'light' : 'dark';
    applyTheme(themeTo);

    trackEvent('theme_toggle', {
      theme_from: themeFrom,
      theme_to: themeTo,
      page_path: pathname || (typeof window !== 'undefined' ? window.location.pathname : '/'),
      locale,
      placement,
    });
  };

  const label = theme === 'dark' ? t.nav.switchToLight : t.nav.switchToDark;
  const sizeClass = size === 'mobile' ? 'h-9 w-9' : 'h-8 w-8';

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={label}
      title={label}
      aria-pressed={theme === 'light'}
      className={`group relative inline-flex ${sizeClass} items-center justify-center rounded-lg border border-zinc-200/90 dark:border-zinc-800/90 bg-white/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100 shadow-sm transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950 ${className}`}
    >
      <Sun className="hidden dark:block h-4 w-4 text-amber-300 transition-transform duration-200 group-hover:rotate-45" />
      <Moon className="block dark:hidden h-4 w-4 text-zinc-700 transition-transform duration-200 group-hover:-rotate-12 group-hover:text-indigo-600" />
      <span className="sr-only">{label}</span>
    </button>
  );
}
