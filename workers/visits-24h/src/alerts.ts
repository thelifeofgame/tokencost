import type { D1Database } from './index';
import { buildDigest, comparePrices, isReduction, mergeAlerts } from './alerts-logic';
import type { Digest, PriceChange, PriceFeed } from './alerts-logic';
import { renderEmail } from './alert-email';
import type { MailLocale } from './alert-email';

export interface AlertsEnv {
  DB: D1Database;
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET?: string;
  ALERTS_TOKEN_SECRET?: string;
  ALERTS_DRY_RUN?: string;
  ALERTS_TEST_ORIGIN?: string;
  ALERTS_TEST_API?: string;
}

const ORIGIN = 'https://tokencostsai.com';
const DAY = 86_400;
const hours = (seconds: number) => Math.floor(seconds / 3600);
const nowSeconds = () => Math.floor(Date.now() / 1000);
const bytesToHex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), value => value.toString(16).padStart(2, '0')).join('');
const sha256 = async (value: string) => bytesToHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
const randomToken = () => crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
const idPattern = /^[a-z0-9][a-z0-9._:-]{0,127}$/i;
const tokenPattern = /^[a-f0-9]{64}$/;
const loopback = /^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/;
const locales = new Set(['en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'es']);
const mailLocale = (locale: string): MailLocale => locale === 'zh-CN' || locale === 'zh-TW' ? 'zh-CN' : 'en';

function siteOrigin(env: AlertsEnv) {
  return env.ALERTS_DRY_RUN === '1' && loopback.test(env.ALERTS_TEST_ORIGIN ?? '') ? env.ALERTS_TEST_ORIGIN! : ORIGIN;
}

function apiOrigin(env: AlertsEnv) {
  return env.ALERTS_DRY_RUN === '1' && loopback.test(env.ALERTS_TEST_API ?? '') ? env.ALERTS_TEST_API! : ORIGIN;
}

interface Subscriber {
  id: string;
  email: string;
  locale: string;
  models: string;
  unsubscribe_nonce: string;
}

async function unsubscribeToken(subscriber: Subscriber, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${subscriber.id}:${subscriber.unsubscribe_nonce}`));
  return `${subscriber.id}.${bytesToHex(signature)}`;
}

function equalToken(expected: string, received: string) {
  if (expected.length !== received.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ received.charCodeAt(i);
  return diff === 0;
}

async function sendMail(
  env: AlertsEnv,
  subscriber: Subscriber,
  message: Parameters<typeof renderEmail>[3],
  idempotencyKey: string,
) {
  const token = await unsubscribeToken(subscriber, env.ALERTS_TOKEN_SECRET!);
  const unsubscribeUrl = `${apiOrigin(env)}/api/unsubscribe?token=${token}`;
  const rendered = renderEmail(mailLocale(subscriber.locale), siteOrigin(env), unsubscribeUrl, message);
  if (env.ALERTS_DRY_RUN === '1') {
    console.info('[alerts dry-run]', message.kind, rendered.subject,
      message.kind === 'confirm' && siteOrigin(env) !== ORIGIN ? { confirmUrl: message.confirmUrl, unsubscribeUrl } : '');
    return;
  }
  if (!env.RESEND_API_KEY) throw new Error('Missing Resend binding');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ from: 'TokenCosts AI <notify@tokencostsai.com>', to: [subscriber.email], ...rendered }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Resend HTTP ${response.status}`);
}

async function verifyTurnstile(env: AlertsEnv, token: string) {
  if (env.ALERTS_DRY_RUN === '1' && siteOrigin(env) !== ORIGIN) return true;
  if (!env.TURNSTILE_SECRET || !token) return false;
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) return false;
  const result = await response.json() as { success?: boolean; hostname?: string; action?: string };
  return result.success === true && ['tokencostsai.com', 'www.tokencostsai.com'].includes(result.hostname ?? '')
    && result.action === 'subscribe';
}

function response(body: unknown, status: number, headers: Record<string, string>, cache = 'no-store') {
  return Response.json(body, { status, headers: { ...headers, 'Cache-Control': cache } });
}

function cors(request: Request, env: AlertsEnv): Record<string, string> {
  const origin = request.headers.get('Origin');
  return {
    ...(origin && [ORIGIN, 'https://www.tokencostsai.com', siteOrigin(env)].includes(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

async function subscribe(request: Request, env: AlertsEnv, headers: Record<string, string>) {
  if (!env.ALERTS_TOKEN_SECRET || (!env.RESEND_API_KEY && env.ALERTS_DRY_RUN !== '1')) {
    return response({ ok: false }, 503, headers);
  }
  const raw = await request.text();
  if (raw.length > 8192) return response({ ok: false }, 413, headers);
  let payload: Record<string, unknown>;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid payload');
    payload = value as Record<string, unknown>;
  } catch {
    return response({ ok: false }, 400, headers);
  }
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const models: unknown[] = Array.isArray(payload.models) ? payload.models : [];
  if (email.length > 254 || !/^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$/.test(email)
      || models.length > 20 || models.some(model => typeof model !== 'string' || !idPattern.test(model))) {
    return response({ ok: false }, 400, headers);
  }

  const now = nowSeconds();
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  // Rotate the rate-limit key every UTC day to avoid retaining a stable IP identifier.
  const ipHash = await sha256(`${env.ALERTS_TOKEN_SECRET}:${Math.floor(now / DAY)}:${ip}`);
  const bucket = await env.DB.prepare(
    `INSERT INTO alert_rate_buckets (digest, hour) VALUES (?1, ?2)
     ON CONFLICT(digest, hour) DO UPDATE SET attempts = attempts + 1 WHERE attempts < 6
     RETURNING attempts`
  ).bind(ipHash, hours(now)).first();
  if (!bucket) return response({ ok: false }, 429, headers);
  const captcha = typeof payload.turnstileToken === 'string' ? payload.turnstileToken : '';
  try {
    if (!await verifyTurnstile(env, captcha)) return response({ ok: false }, 400, headers);
  } catch {
    return response({ ok: false }, 503, headers);
  }

  const locale = typeof payload.locale === 'string' && locales.has(payload.locale) ? payload.locale : 'en';
  const source = typeof payload.source === 'string' && /^\/[a-z0-9._/-]{0,159}$/i.test(payload.source) ? payload.source : '/';
  const token = randomToken();
  const row = await env.DB.prepare(
    `INSERT INTO alert_subscriptions (
      id, email, state, locale, pending_locale, pending_models, source, confirmation_hash, confirmation_expires, requested_at, unsubscribe_nonce
     ) VALUES (?1, ?2, 'pending', ?3, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
     ON CONFLICT(email) DO UPDATE SET
       pending_locale = excluded.pending_locale, pending_models = excluded.pending_models,
       source = excluded.source, confirmation_hash = excluded.confirmation_hash,
       confirmation_expires = excluded.confirmation_expires, requested_at = excluded.requested_at
     WHERE requested_at <= ?10
     RETURNING id, email, pending_locale AS locale, models, unsubscribe_nonce`
  ).bind(crypto.randomUUID(), email, locale, JSON.stringify(Array.from(new Set(models))), source, await sha256(token),
    now + 2 * DAY, now, crypto.randomUUID(), now - 15 * 60).first<Subscriber>();

  if (row) {
    try {
      await sendMail(env, row, { kind: 'confirm', confirmUrl: `${apiOrigin(env)}/api/subscribe/confirm?token=${token}` }, `confirm-${token}`);
    } catch {
      console.error('[alerts] confirmation email failed');
      await env.DB.prepare('UPDATE alert_subscriptions SET requested_at = 0 WHERE confirmation_hash = ?1')
        .bind(await sha256(token)).run();
    }
  }
  return response({ ok: true }, 202, headers);
}

function landing(env: AlertsEnv, route: string, locale: string, invalid = false) {
  const prefix = locale !== 'en' && locales.has(locale) ? `/${locale}` : '';
  return new Response(null, {
    status: 303,
    headers: {
      Location: `${siteOrigin(env)}${prefix}/${route}/${invalid ? '?status=invalid' : ''}`,
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex',
    },
  });
}

async function confirm(url: URL, env: AlertsEnv) {
  const token = url.searchParams.get('token') ?? '';
  if (!tokenPattern.test(token)) return landing(env, 'subscribed', 'en', true);
  const subscriber = await env.DB.prepare(
    `UPDATE alert_subscriptions
     SET state = 'confirmed', confirmed_at = ?1, unsubscribed_at = NULL,
         locale = pending_locale, models = pending_models, pending_locale = NULL, pending_models = NULL,
         confirmation_hash = NULL, confirmation_expires = NULL,
         unsubscribe_nonce = CASE WHEN state = 'unsubscribed' THEN ?3 ELSE unsubscribe_nonce END
     WHERE confirmation_hash = ?2 AND confirmation_expires >= ?1 RETURNING locale`
  ).bind(nowSeconds(), await sha256(token), crypto.randomUUID()).first<{ locale: string }>();
  return landing(env, 'subscribed', subscriber?.locale ?? 'en', !subscriber);
}

async function unsubscribe(request: Request, url: URL, env: AlertsEnv, headers: Record<string, string>) {
  if (request.method === 'POST') {
    const body = await request.text();
    if (body.length > 4096 || !body.includes('List-Unsubscribe')) return response({ ok: false }, 400, headers);
  }
  const token = url.searchParams.get('token') ?? '';
  const id = token.split('.')[0];
  if (!env.ALERTS_TOKEN_SECRET || !/^[a-f0-9-]{36}\.[a-f0-9]{64}$/.test(token)) {
    return request.method === 'POST' ? response({ ok: false }, 400, headers) : landing(env, 'unsubscribed', 'en', true);
  }
  const row = await env.DB.prepare('SELECT id, locale, email, models, unsubscribe_nonce FROM alert_subscriptions WHERE id = ?1').bind(id).first<Subscriber>();
  const valid = row && equalToken(await unsubscribeToken(row, env.ALERTS_TOKEN_SECRET), token);
  if (valid) {
    await env.DB.batch([
      env.DB.prepare(
        `UPDATE alert_subscriptions SET state = 'unsubscribed', unsubscribed_at = COALESCE(unsubscribed_at, ?1),
          models = '[]', pending_locale = NULL, pending_models = NULL, confirmation_hash = NULL, confirmation_expires = NULL
         WHERE id = ?2 AND unsubscribe_nonce = ?3`
      ).bind(nowSeconds(), id, row.unsubscribe_nonce),
      env.DB.prepare(`DELETE FROM alert_mail_queue WHERE subscription_id = ?1
        AND EXISTS (SELECT 1 FROM alert_subscriptions WHERE id = ?1 AND state = 'unsubscribed' AND unsubscribe_nonce = ?2)`)
        .bind(id, row.unsubscribe_nonce),
    ]);
  }
  if (request.method === 'POST') return response({ ok: Boolean(valid) }, valid ? 200 : 400, headers);
  return landing(env, 'unsubscribed', row?.locale ?? 'en', !valid);
}

const priceColumns = 'model_id AS modelId, model_name AS modelName, field, old_value AS oldValue, new_value AS newValue, change_percent AS percent, found_at AS foundAt';

export async function handleAlerts(request: Request, env: AlertsEnv, path: string): Promise<Response | null> {
  if (!['/api/price-changes', '/api/subscribe', '/api/subscribe/confirm', '/api/unsubscribe'].includes(path)) return null;
  const headers = cors(request, env);
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (path === '/api/subscribe' && request.method === 'POST') return subscribe(request, env, headers);
  if (path === '/api/subscribe/confirm' && request.method === 'GET') return confirm(url, env);
  if (path === '/api/unsubscribe' && ['GET', 'POST'].includes(request.method)) return unsubscribe(request, url, env, headers);
  if (path === '/api/price-changes' && request.method === 'GET') {
    const requestedDays = Number(url.searchParams.get('days') ?? '30');
    if (!Number.isInteger(requestedDays) || requestedDays < 1 || requestedDays > 90) return response({ ok: false }, 400, headers);
    const cutoff = new Date(Date.now() - requestedDays * DAY * 1000).toISOString();
    const changes = await env.DB.prepare(`SELECT ${priceColumns} FROM price_changes WHERE found_at >= ?1
      ORDER BY found_at DESC, model_id, field LIMIT 200`).bind(cutoff).all<PriceChange>();
    return response({ changes: changes.results ?? [] }, 200, headers, 'public, max-age=300, s-maxage=300');
  }
  return response({ ok: false }, 405, headers);
}

async function loadFeed(env: AlertsEnv): Promise<PriceFeed> {
  const response = await fetch(`${siteOrigin(env)}/prices-current.json`, {
    headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error('Price feed unavailable');
  const feed = await response.json() as PriceFeed;
  if (!Number.isFinite(Date.parse(feed.updatedAt)) || !Array.isArray(feed.models) || !feed.models.length
    || feed.models.length > 10_000 || !Array.isArray(feed.deals)
    || feed.models.some(model => !idPattern.test(model.id) || typeof model.name !== 'string' || typeof model.provider !== 'string'
      || [model.input, model.output, model.cached].some(rate => rate !== null && (!Number.isFinite(rate) || rate < 0)))
    || new Set(feed.models.map(model => model.id)).size !== feed.models.length) {
    throw new Error('Invalid price feed');
  }
  return { ...feed, updatedAt: new Date(feed.updatedAt).toISOString() };
}

export async function pollPrices(env: AlertsEnv, now: number) {
  const feed = await loadFeed(env);
  const previous = await env.DB.prepare('SELECT updated_at, document FROM price_snapshot WHERE id = 1')
    .first<{ updated_at: string; document: string }>();
  if (!previous) {
    await env.DB.prepare('INSERT OR IGNORE INTO price_snapshot (id, updated_at, document) VALUES (1, ?1, ?2)')
      .bind(feed.updatedAt, JSON.stringify(feed)).run();
    return;
  }

  if (feed.updatedAt < previous.updated_at) return;
  if (feed.updatedAt === previous.updated_at) {
    // Deals may change independently of the model price feed.
    const snapshot = JSON.parse(previous.document) as PriceFeed;
    if (JSON.stringify(snapshot.deals) !== JSON.stringify(feed.deals)) {
      await env.DB.prepare('UPDATE price_snapshot SET document = ?1 WHERE id = 1 AND updated_at = ?2')
        .bind(JSON.stringify({ ...snapshot, deals: feed.deals }), previous.updated_at).run();
    }
    return;
  }

  const snapshot = JSON.parse(previous.document) as PriceFeed;
  const changes = comparePrices(snapshot.models, feed.models, new Date(now).toISOString());
  const drops = changes.filter(isReduction);
  await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO price_changes (version, model_id, model_name, field, old_value, new_value, change_percent, found_at)
      SELECT ?1, value->>'modelId', value->>'modelName', value->>'field', value->>'oldValue', value->>'newValue',
        value->>'percent', value->>'foundAt' FROM json_each(?2)
      WHERE EXISTS (SELECT 1 FROM price_snapshot WHERE id = 1 AND updated_at = ?3)`)
      .bind(feed.updatedAt, JSON.stringify(changes), previous.updated_at),
    env.DB.prepare(`INSERT OR IGNORE INTO alert_mail_queue (subscription_id, kind, batch_key, document)
      SELECT s.id, 'alert', ?1, (
        SELECT json_group_array(json(d.value)) FROM json_each(?2) d
        WHERE d.value->>'modelId' IN (SELECT value FROM json_each(s.models))
      )
      FROM alert_subscriptions s WHERE s.state = 'confirmed'
        AND EXISTS (SELECT 1 FROM json_each(?2) d WHERE d.value->>'modelId' IN (SELECT value FROM json_each(s.models)))
        AND EXISTS (SELECT 1 FROM price_snapshot WHERE id = 1 AND updated_at = ?3)`)
      .bind(feed.updatedAt, JSON.stringify(drops), previous.updated_at),
    env.DB.prepare('UPDATE price_snapshot SET updated_at = ?1, document = ?2 WHERE id = 1 AND updated_at = ?3')
      .bind(feed.updatedAt, JSON.stringify(feed), previous.updated_at),
  ]);
}

export async function queueDigest(env: AlertsEnv, now: number) {
  const snapshot = await env.DB.prepare('SELECT document FROM price_snapshot WHERE id = 1').first<{ document: string }>();
  if (!snapshot) return;
  const changes = await env.DB.prepare(`SELECT ${priceColumns} FROM price_changes
    WHERE found_at >= ?1 AND found_at < ?2 ORDER BY found_at DESC`)
    .bind(new Date(now - 7 * DAY * 1000).toISOString(), new Date(now).toISOString()).all<PriceChange>();
  const digest = buildDigest(changes.results ?? [], (JSON.parse(snapshot.document) as PriceFeed).deals, now);
  if (!Object.values(digest).some(section => section.length)) return;
  await env.DB.prepare(`INSERT OR IGNORE INTO alert_mail_queue (subscription_id, kind, batch_key, document)
    SELECT id, 'digest', ?1, ?2 FROM alert_subscriptions WHERE state = 'confirmed'`)
    .bind(new Date(now).toISOString().slice(0, 10), JSON.stringify(digest)).run();
}

export async function deliverAlerts(env: AlertsEnv, now: number) {
  if (!env.ALERTS_TOKEN_SECRET || (!env.RESEND_API_KEY && env.ALERTS_DRY_RUN !== '1')) return;
  const candidates = await env.DB.prepare(`SELECT subscription_id, kind, batch_key FROM alert_mail_queue
    WHERE state = 'queued' AND next_attempt <= ?1 AND attempts < 5 ORDER BY next_attempt LIMIT 12`)
    .bind(now).all<{ subscription_id: string; kind: 'alert' | 'digest'; batch_key: string }>();
  for (const job of candidates.results ?? []) {
    const { subscription_id, kind, batch_key } = job;
    const claimed = await env.DB.prepare(`UPDATE alert_mail_queue SET attempts = attempts + 1, next_attempt = ?4
      WHERE subscription_id = ?1 AND kind = ?2 AND batch_key = ?3 AND state = 'queued'
        AND next_attempt <= ?5 AND attempts < 5
      RETURNING document, attempts`)
      .bind(subscription_id, kind, batch_key, now + 900, now).first<{ document: string; attempts: number }>();
    if (!claimed) continue;
    const subscriber = await env.DB.prepare(`SELECT id, email, locale, models, unsubscribe_nonce
      FROM alert_subscriptions WHERE id = ?1 AND state = 'confirmed'`).bind(subscription_id).first<Subscriber>();
    let state = 'sent';
    try {
      if (subscriber) {
        const key = await sha256(`${subscription_id}:${kind}:${batch_key}`);
        if (kind === 'alert') {
          const groups = mergeAlerts(JSON.parse(claimed.document) as PriceChange[], JSON.parse(subscriber.models) as string[]);
          if (groups.length) await sendMail(env, subscriber, { kind, groups }, key);
        } else {
          await sendMail(env, subscriber, { kind, digest: JSON.parse(claimed.document) as Digest }, key);
        }
      }
    } catch {
      console.error('[alerts] queued email failed', kind, claimed.attempts);
      state = claimed.attempts >= 5 ? 'failed' : 'queued';
    }
    await env.DB.prepare(`UPDATE alert_mail_queue SET state = ?4, document = CASE WHEN ?4 = 'sent' THEN '{}' ELSE document END
      WHERE subscription_id = ?1 AND kind = ?2 AND batch_key = ?3 AND attempts = ?5`)
      .bind(subscription_id, kind, batch_key, state, claimed.attempts).run();
  }
}

export async function cleanAlerts(env: AlertsEnv, now: number) {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM alert_rate_buckets WHERE hour < ?1').bind(hours(now) - 48),
    env.DB.prepare(`DELETE FROM alert_subscriptions WHERE
      (state = 'unsubscribed' AND unsubscribed_at <= ?1) OR
      (state = 'pending' AND confirmation_expires < ?2)`).bind(now - 29 * DAY, now),
    env.DB.prepare(`DELETE FROM alert_mail_queue WHERE
      (state IN ('sent', 'failed') OR attempts >= 5) AND next_attempt < ?1`).bind(now - 8 * DAY),
  ]);
}
