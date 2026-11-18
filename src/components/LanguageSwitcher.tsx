'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { Locale } from '@/i18n/types';
import { Globe, Check, ChevronDown } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  isMobile?: boolean;
}

export default function LanguageSwitcher({ className = '', isMobile = false }: LanguageSwitcherProps) {
  const { locale, locales, setLocale, currentLocaleConfig } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: Locale) => {
    setLocale(code);
    setIsOpen(false);
  };

  if (isMobile) {
    return (
      <div className="py-2 space-y-1">
        <div className="flex items-center gap-2 px-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          <Globe className="h-3.5 w-3.5 text-indigo-400" />
          <span>Language / 语言切换</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          {locales.map((item) => {
            const isSelected = item.code === locale;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelect(item.code)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 border border-zinc-800/80'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span>{item.flag}</span>
                  <span className="truncate">{item.nativeName}</span>
                </div>
                {isSelected && <Check className="h-3 w-3 text-indigo-400 shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-900/80 hover:bg-zinc-800 rounded-lg border border-zinc-800/90 hover:border-zinc-700 transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <Globe className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
        <span className="text-[13px]">{currentLocaleConfig.flag}</span>
        <span className="font-semibold">{currentLocaleConfig.shortLabel}</span>
        <ChevronDown className={`h-3 w-3 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-xl shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 p-1 divide-y divide-zinc-850 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
            Select Language
          </div>
          <div className="py-1 space-y-0.5">
            {locales.map((item) => {
              const isSelected = item.code === locale;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelect(item.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left ${
                    isSelected
                      ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/20'
                      : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900/90'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.flag}</span>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.nativeName}</span>
                      <span className="text-[10px] text-zinc-400">{item.name}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
