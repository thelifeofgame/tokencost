export type ThemeMode = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'tokencosts-theme';
export const THEME_CHANGE_EVENT = 'tokencosts-theme-change';

/**
 * Synchronous inline <head> script to apply the persisted or system-preferred
 * theme before first paint (Zero-FOUC, Dark-First fallback).
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k='${THEME_STORAGE_KEY}';var s=window.localStorage.getItem(k);var l=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches;var t=(s==='light'||s==='dark')?s:(l?'light':'dark');var r=document.documentElement;if(t==='dark'){r.classList.add('dark');}else{r.classList.remove('dark');}r.dataset.theme=t;r.style.colorScheme=t;}catch(e){}})();`;

export function readCurrentTheme(): ThemeMode {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function applyTheme(nextTheme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (nextTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  root.dataset.theme = nextTheme;
  root.style.colorScheme = nextTheme;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch {
    // Ignore storage quota / privacy mode errors
  }

  try {
    window.dispatchEvent(new CustomEvent<ThemeMode>(THEME_CHANGE_EVENT, { detail: nextTheme }));
  } catch {
    // Ignore CustomEvent failure
  }
}
