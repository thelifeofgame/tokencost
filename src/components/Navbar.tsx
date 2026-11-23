'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, Sparkles, Menu, X, ExternalLink, Sun, Moon } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { trackEvent } from '@/lib/analytics';
import { ThemeMode, applyTheme, readCurrentTheme } from '@/lib/theme';
import { useLiveVisits24h } from '@/hooks/useLiveVisits24h';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle, { useSyncedTheme } from './ThemeToggle';
import LiveVisitsBadge from './LiveVisitsBadge';

const OPENROUTER_NAVBAR_URL =
  'https://openrouter.ai/?ref=tokencostsai_com&utm_source=tokencostsai_com&utm_medium=navbar_cta';

const GITHUB_REPO_URL = 'https://github.com/thelifeofgame/tokencost';

function GitHubIcon({ className = 'h-3.5 w-3.5 fill-current' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, locale, getLocalizedPath } = useI18n();
  const theme = useSyncedTheme();
  const { count: visitsCount, status: visitsStatus } = useLiveVisits24h(pathname);

  const showLiveDivider =
    visitsStatus === 'loading' ||
    (visitsStatus !== 'error' && visitsCount !== null && visitsCount > 0);

  const navLinks = [
    { href: '/', label: t.nav.simulator },
    { href: '/models', label: t.nav.models },
    { href: '/compare', label: t.nav.compare },
    { href: '/harness', label: t.nav.harness, isNew: true },
    { href: '/calculator', label: t.nav.calculators },
    { href: '/pricing', label: t.nav.guides },
    { href: '/developers', label: t.nav.developers },
    { href: '/contact', label: t.nav.contact },
  ];

  const handleOpenRouterClick = () => {
    trackEvent('affiliate_click', {
      partner: 'openrouter',
      placement: 'navbar_cta',
      outbound_url: OPENROUTER_NAVBAR_URL,
    });
  };

  const handleMobileDrawerThemeSelect = (nextTheme: ThemeMode) => {
    const current = readCurrentTheme();
    if (current === nextTheme) return;
    applyTheme(nextTheme);
    trackEvent('theme_toggle', {
      theme_from: current,
      theme_to: nextTheme,
      page_path: pathname || (typeof window !== 'undefined' ? window.location.pathname : '/'),
      locale,
      placement: 'navbar_mobile',
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-950/80 backdrop-blur-md transition-colors duration-150">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-2 px-4 sm:px-6 lg:px-5 xl:px-6 min-[1440px]:px-8">
        {/* Brand + Desktop Nav */}
        <div className="flex items-center gap-2 xl:gap-4 min-[1440px]:gap-6 min-w-0 flex-1">
          <Link
            href={getLocalizedPath('/')}
            className="flex items-center gap-1.5 sm:gap-2.5 group min-w-0 shrink-0"
          >
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[13px] sm:text-sm xl:text-base tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                  TokenCosts AI
                </span>
                <span className="hidden sm:inline-flex lg:hidden xl:inline-flex rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shrink-0">
                  {t.common.versionBadge}
                </span>
              </div>
              <span className="hidden min-[1440px]:block max-w-[165px] text-[10px] text-zinc-600 dark:text-zinc-500 tracking-tight truncate">
                {t.common.tagline}
              </span>
            </div>
          </Link>

          {/* Desktop Nav (lg: 1024px+) */}
          <nav className="hidden lg:flex items-center gap-0.5 min-[1440px]:gap-1 ml-1 min-w-0 flex-1 overflow-x-auto scrollbar-none">
            {navLinks.map((link) => {
              const localizedHref = getLocalizedPath(link.href);
              const isActive =
                pathname === link.href ||
                pathname === localizedHref ||
                (link.href !== '/' && pathname.includes(link.href));
              return (
                <Link
                  key={link.href}
                  href={localizedHref}
                  className={`px-1.5 min-[1440px]:px-2.5 2xl:px-3 py-1.5 text-[11px] xl:text-xs font-medium rounded-lg transition-colors inline-flex items-center whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.isNew && (
                    <span className="ml-1.5 hidden 2xl:inline-flex rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                      NEW
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Live Visits, Theme Toggle, Language Switcher, GitHub & CTA */}
        <div className="hidden lg:flex items-center gap-1.5 xl:gap-2 shrink-0">
          <LiveVisitsBadge
            count={visitsCount}
            status={visitsStatus}
            variant="navbar_desktop"
          />
          {showLiveDivider && (
            <span
              aria-hidden="true"
              className="h-4 w-px bg-zinc-200/90 dark:bg-zinc-800/90 mx-0.5"
            />
          )}

          <ThemeToggle placement="navbar_desktop" size="desktop" />
          <LanguageSwitcher adaptiveDesktop={true} />

          {/* GitHub Star Link */}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.common.github}
            title={t.common.github}
            className="hidden xl:flex items-center justify-center gap-1.5 h-8 w-8 2xl:w-auto 2xl:px-3 text-xs font-medium text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 bg-zinc-100/80 dark:bg-zinc-900/60 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/80 rounded-lg border border-zinc-200/90 dark:border-zinc-800/80 transition-colors"
          >
            <GitHubIcon className="h-3.5 w-3.5 fill-current shrink-0" />
            <span className="hidden 2xl:inline">{t.common.github}</span>
          </a>

          {/* Router API CTA */}
          <a
            href={OPENROUTER_NAVBAR_URL}
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
            onClick={handleOpenRouterClick}
            className="flex items-center gap-1.5 px-2.5 xl:px-3.5 py-1.5 text-[11px] xl:text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-500/20 transition-all active:scale-[0.98]"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-200 shrink-0" />
            <span className="whitespace-nowrap">{t.common.tryRouterApi}</span>
            <ExternalLink className="hidden xl:inline-block h-3 w-3 text-indigo-200 shrink-0" />
          </a>
        </div>

        {/* Mobile & Tablet menu controls (< 1024px, 360px-safe budget) */}
        <div className="lg:hidden flex items-center gap-1 sm:gap-1.5 shrink-0">
          <LiveVisitsBadge
            count={visitsCount}
            status={visitsStatus}
            variant="navbar_mobile"
          />
          <ThemeToggle placement="navbar_mobile" size="mobile" />
          <LanguageSwitcher compact={true} />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors after:content-[''] after:absolute after:-inset-1.5 sm:after:inset-0"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Nav Dropdown (< 1024px) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-lg dark:shadow-none px-4 py-3 space-y-3">
          {/* Top 24h Live Visits Telemetry Banner */}
          <LiveVisitsBadge
            count={visitsCount}
            status={visitsStatus}
            variant="mobile_drawer"
          />

          <div className="space-y-1">
            {navLinks.map((link) => {
              const localizedHref = getLocalizedPath(link.href);
              const isActive =
                pathname === link.href ||
                pathname === localizedHref ||
                (link.href !== '/' && pathname.includes(link.href));
              return (
                <Link
                  key={link.href}
                  href={localizedHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-900'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.isNew && (
                    <span className="rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                      NEW
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Mobile Drawer Appearance Control */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <div className="px-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              Appearance
            </div>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => handleMobileDrawerThemeSelect('dark')}
                aria-label={t.nav.switchToDark}
                aria-pressed={theme === 'dark'}
                className="min-h-[40px] flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-all text-zinc-600 hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 dark:shadow-sm"
              >
                <Moon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => handleMobileDrawerThemeSelect('light')}
                aria-label={t.nav.switchToLight}
                aria-pressed={theme === 'light'}
                className="min-h-[40px] flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-all bg-white text-zinc-900 shadow-sm dark:bg-transparent dark:text-zinc-400 dark:hover:text-zinc-200 dark:shadow-none"
              >
                <Sun className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>Light</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <LanguageSwitcher isMobile={true} />
          </div>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100/80 dark:bg-zinc-900/80 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 rounded-lg border border-zinc-200/90 dark:border-zinc-800/80 transition-colors shrink-0"
            >
              <GitHubIcon className="h-3.5 w-3.5 fill-current" />
              <span>{t.common.github}</span>
            </a>
            <a
              href={OPENROUTER_NAVBAR_URL}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              onClick={handleOpenRouterClick}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t.common.tryRouterApi}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
