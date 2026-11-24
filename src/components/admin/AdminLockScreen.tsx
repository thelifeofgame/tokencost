'use client';

import React, { useState } from 'react';
import { Lock, Zap, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { getAnalyticsBaseUrl } from './formatters';

interface AdminLockScreenProps {
  onSuccess: (token?: string) => void;
  initialNotice?: string | null;
}

export default function AdminLockScreen({
  onSuccess,
  initialNotice = null,
}: AdminLockScreenProps) {
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialNotice);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || submitting) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${getAnalyticsBaseUrl()}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      if (res.status === 429) {
        const errData = (await res.json().catch(() => ({}))) as { retryAfter?: number };
        const secs = errData.retryAfter || 60;
        setErrorMsg(`尝试过于频繁，请 ${secs} 秒后再试`);
        return;
      }

      if (res.status === 401) {
        setErrorMsg('密码错误，请检查后重试');
        return;
      }

      if (!res.ok) {
        setErrorMsg(`认证服务暂不可用 (HTTP ${res.status})`);
        return;
      }

      const data = (await res.json()) as { ok?: boolean; authenticated?: boolean; token?: string };
      if (!data.authenticated && !data.ok) {
        setErrorMsg('登录验证失败，请重试');
        return;
      }

      setPassword('');
      onSuccess(data.token);
    } catch {
      setErrorMsg('网络请求失败，请检查网络连接后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <div className="pointer-events-none fixed inset-0 bg-radial-gradient" aria-hidden="true" />

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-sm rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/75 p-6 sm:p-7 backdrop-blur-xl shadow-xl shadow-zinc-950/[0.06] dark:shadow-2xl dark:shadow-black/60">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

        <div className="flex flex-col items-center text-center">
          <div className="relative w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Lock className="w-5 h-5" />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-md bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Zap className="w-2.5 h-2.5" />
            </span>
          </div>

          <h1 className="mt-4 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            TokenCosts Analytics
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            全站数据监控与商业转化台 · Private Console
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="relative">
            <label htmlFor="admin-password" className="sr-only">
              访问密码
            </label>
            <input
              id="admin-password"
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              autoFocus
              autoComplete="current-password"
              placeholder="输入访问密码..."
              className={`w-full h-11 pl-3.5 pr-11 rounded-xl text-sm font-mono bg-zinc-100/70 dark:bg-zinc-950/70 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 border transition-colors focus:outline-none focus:ring-2 ${
                errorMsg
                  ? 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 focus:ring-indigo-500/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? '隐藏密码' : '显示密码'}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="mt-3 flex items-center gap-2 rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-300"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !password.trim()}
            className="mt-4 w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-sm font-medium text-white shadow-sm shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" />
                <span>验证中...</span>
              </>
            ) : (
              <>
                <span>进入监控后台</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] font-mono text-zinc-400 dark:text-zinc-500 leading-relaxed">
          Protected by Cloudflare Worker · HttpOnly Session
        </p>
      </div>
    </div>
  );
}
