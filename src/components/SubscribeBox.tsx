'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Script from 'next/script';
import { BellRing } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { trackEvent } from '@/lib/analytics';
import { getAlertsApiOrigin } from '@/lib/alert-api';

type Turnstile = {
  render(container: HTMLElement, options: {
    sitekey: string; action: string; callback(token: string): void;
    'expired-callback'(): void; 'error-callback'(): void; size: 'flexible';
  }): string;
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
  const [selected, setSelected] = useState(() => models.map(model => model.id));
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
      callback: (value) => { setToken(value); setChallengeError(false); },
      'expired-callback': () => setToken(''),
      'error-callback': () => { setToken(''); setChallengeError(true); },
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

  return (
    <section className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-zinc-900 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-zinc-100">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <BellRing className="h-4 w-4" aria-hidden="true" /> {labels.title}
      </h2>
      <p className="text-xs text-zinc-600 dark:text-zinc-300">{labels.description}</p>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-600">
          {labels.open}
        </button>
      ) : status === 'sent' ? (
        <p role="status" className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{labels.sent}</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm">
            <span className="block pb-1 font-medium">{labels.email}</span>
            <input name="email" required type="email" autoComplete="email" maxLength={254}
              className="w-full max-w-sm rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" />
          </label>
          {models.length > 0 && (
            <fieldset className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
              <legend className="mb-2 font-medium">{labels.follow}</legend>
              {models.map(model => (
                <label key={model.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={selected.includes(model.id)} onChange={event => {
                    setSelected(previous => event.target.checked ? [...previous, model.id] : previous.filter(id => id !== model.id));
                  }} />
                  {model.name}
                </label>
              ))}
            </fieldset>
          )}
          {siteKey && <><Script id="alerts-turnstile" src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            onReady={() => setScriptReady(true)} onError={() => setChallengeError(true)} /><div ref={widget} /></>}
          {(!siteKey && !apiOrigin || challengeError) && <p role="alert" className="text-xs">{labels.unavailable}</p>}
          <button type="submit" disabled={status === 'sending' || (siteKey ? !token : !apiOrigin)}
            className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-50">
            {status === 'sending' ? labels.sending : labels.submit}
          </button>
          {(status === 'error' || status === 'limited') && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
            {status === 'limited' ? labels.limited : labels.error}
          </p>}
        </form>
      )}
    </section>
  );
}
