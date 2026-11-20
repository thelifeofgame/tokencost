'use client';

import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Send, Check, Copy, Sparkles, HelpCircle, ShieldCheck } from 'lucide-react';
import SchemaOrg from '@/components/seo/SchemaOrg';
import { useI18n } from '@/i18n/I18nProvider';

const TOPIC_SUBJECT_MAP: Record<string, string> = {
  'realtime-voice-audit': 'Enterprise FinOps Audit: Realtime Voice & Genie 4 Streaming Pipeline',
  'gemini-carbon-migration': 'Pre-Dec 1 FinOps Audit: Gemini 4 Carbon & Azure o3 Migration',
};

export default function ContactClient() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const topicParam = params.get('topic');
    const subjectParam = params.get('subject');
    if (subjectParam) {
      setSubject(subjectParam);
    } else if (topicParam && TOPIC_SUBJECT_MAP[topicParam]) {
      setSubject(TOPIC_SUBJECT_MAP[topicParam]);
    }
  }, []);

  const email = 'www.smeng@gmail.com';

  const copyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(
    subject || 'Feedback on TokenCosts AI'
  )}&body=${encodeURIComponent(message)}`;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <SchemaOrg
        name={t.nav.contact}
        description={t.footer.contactDesc}
        url="https://tokencostsai.com/contact/"
      />

      {/* Header */}
      <div className="space-y-3 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400">
          <Mail className="h-3.5 w-3.5" />
          <span>{t.nav.contact}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-100">
          {t.footer.contact}
        </h1>
        <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
          {t.footer.contactDesc}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Direct Email Card */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-md shadow-xl space-y-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Mail className="h-5 w-5" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-sm font-bold text-zinc-100">
                {t.footer.emailUs}
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {t.footer.emailDesc}
              </p>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-zinc-200 select-all truncate">
                  {email}
                </span>
                <button
                  onClick={copyEmail}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors flex-shrink-0"
                  title="Copy Email"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              <a
                href={`mailto:${email}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98]"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{t.footer.emailUs}</span>
              </a>
            </div>

            <div className="pt-2 border-t border-zinc-800/60 space-y-2 text-[11px] text-zinc-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/80" />
                <span>No spam · Direct engineering inbox</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400/80" />
                <span>Avg. response time: &lt; 24h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Email Launcher Form */}
        <div className="md:col-span-2">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-md shadow-xl space-y-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-400" />
              <h2 className="text-base font-bold text-zinc-100">
                Send a Message / Feedback
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Subject / Topic
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Model pricing error / Feature suggestion / Partnership"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Message Details
                </label>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your feedback, request or question here..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors resize-y"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Clicking send opens your default email client</span>
                </p>

                <a
                  href={mailtoLink}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98]"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Open Email &amp; Send</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
