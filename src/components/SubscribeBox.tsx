'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Script from 'next/script';
import { BellRing } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { trackEvent } from '@/lib/analytics';
import { getAlertsApiOrigin } from '@/lib/alert-api';

type Turnstile = {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      callback(token: string): void;
      'expired-callback'(): void;
      'error-callback'(): void;
      size: 'flexible';
    }
  ): string;
  reset(id: string): void;
  remove(id: string): void;
};
const readTurnstile = () => (window as Window & { turnstile?: Turnstile }).turnstile;
const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

interface Props {
  models?: Array<{ id: string; name: string }>;
  placement: 'home' | 'model' | 'compare' | 'footer';
}

export default function SubscribeBox({ models = [], placement }: Props) {
  const { t, locale } = useI18n();
  const labels = t.alerts;
  const [selected, setSelected] = useState(() => models.map((model) => model.id));
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error' | 'limited'>('idle');
  const [open, setOpen] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [challengeError, setChallengeError] = useState(false);
  const [token, setToken] = useState('');
  const widget = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string>();
  const apiOrigin = getAlertsApiOrigin();

  useEffect(() => {
    if (!open || !siteKey || !scriptReady || !widget.current) return;
    const turnstile = readTurnstile();
    if (!turnstile) return;
    const id = turnstile.render(widget.current, {
      sitekey: siteKey,
      action: 'subscribe',
      size: 'flexible',
      callback: (value) => {
        setToken(value);
        setChallengeError(false);
      },
      'expired-callback': () => setToken(''),
      'error-callback': () => {
        setToken('');
        setChallengeError(true);
      },
    });
    widgetId.current = id;
    return () => {
      turnstile.remove(id);
      widgetId.current = undefined;
    };
  }, [open, scriptReady]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending' || status === 'sent' || (siteKey && !token)) return;
    const fields = new FormData(event.currentTarget);
    setStatus('sending');
    try {
      const result = await fetch(`${apiOrigin}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: fields.get('email'),
          models: selected,
          locale,
          source: window.location.pathname,
          turnstileToken: token,
        }),
      });
      if (!result.ok) {
        setStatus(result.status === 429 ? 'limited' : 'error');
        return;
      }
      trackEvent('subscribe_submit', { placement });
      setStatus('sent');
    } catch {
      setStatus('error');
    } finally {
      setToken('');
      if (widgetId.current) readTurnstile()?.reset(widgetId.current);
    }
  }

  const isBannerCapable = (placement === 'home' || placement === 'footer') && !open && status !== 'sent';

  return (
    <section className="relative overflow-hidden h-full rounded-2xl border border-indigo-200/90 dark:border-indigo-500/25 bg-white/90 dark:bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md shadow-sm shadow-zinc-950/[0.04] dark:shadow-xl text-zinc-900 dark:text-zinc-100 flex flex-col justify-between gap-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 dark:via-indigo-400/35 to-transparent" />

      <div
        className={
          isBannerCapable
            ? 'flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 group-has-[[data-price-changes]]:lg:flex-col group-has-[[data-price-changes]]:lg:items-stretch'
            : 'space-y-3'
        }
      >
        <div className="space-y-1.5 min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            <BellRing className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" aria-hidden="true" />
            <span>{labels.title}</span>
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{labels.description}</p>
        </div>

        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="min-h-[44px] sm:min-h-[38px] inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all active:scale-[0.98] shrink-0 self-start lg:self-auto group-has-[[data-price-changes]]:lg:self-start"
          >
            {labels.open}
          </button>
        ) : status === 'sent' ? (
          <p role="status" className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            {labels.sent}
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3 pt-1">
            <label className="block text-xs sm:text-sm">
              <span className="block pb-1 font-medium text-zinc-700 dark:text-zinc-300">{labels.email}</span>
              <input
                name="email"
                required
                type="email"
                autoComplete="email"
                maxLength={254}
                className="w-full max-w-sm rounded-lg border border-zinc-300/90 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700/80 dark:bg-zinc-950/80 dark:text-zinc-100"
              />
            </label>
            {models.length > 0 && (
              <fieldset className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-700 dark:text-zinc-300">
                <legend className="mb-2 font-medium">{labels.follow}</legend>
                {models.map((model) => (
                  <label key={model.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(model.id)}
                      onChange={(event) => {
                        setSelected((previous) =>
                          event.target.checked
                            ? [...previous, model.id]
                            : previous.filter((id) => id !== model.id)
                        );
                      }}
                    />
                    {model.name}
                  </label>
                ))}
              </fieldset>
            )}
            {siteKey && (
              <>
                <Script
                  id="alerts-turnstile"
                  src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
                  onReady={() => setScriptReady(true)}
                  onError={() => setChallengeError(true)}
                />
                <div ref={widget} />
              </>
            )}
            {((!siteKey && !apiOrigin) || challengeError) && (
              <p role="alert" className="text-xs text-zinc-600 dark:text-zinc-400">
                {labels.unavailable}
              </p>
            )}
            <button
              type="submit"
              disabled={status === 'sending' || (siteKey ? !token : !apiOrigin)}
              className="min-h-[44px] sm:min-h-[38px] inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {status === 'sending' ? labels.sending : labels.submit}
            </button>
            {(status === 'error' || status === 'limited') && (
              <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
                {status === 'limited' ? labels.limited : labels.error}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
