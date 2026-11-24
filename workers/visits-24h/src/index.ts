interface D1ResultRow {
  total?: number | string | null;
}

interface EdgeBucketRow {
  hour_ts: number | string;
  page_views: number | string;
  requests: number | string;
  cached_requests: number | string;
  threats: number | string;
  bytes: number | string;
  updated_at: number | string;
}

interface EdgeDailyRow {
  date_key: string;
  requests: number | string;
  page_views: number | string;
  uniques: number | string;
  cached_requests: number | string;
  threats: number | string;
  bytes: number | string;
  countries_json: string;
  status_json: string;
  updated_at: number | string;
}

interface EdgeFreshnessRow {
  max_updated_at: number | string | null;
  row_count: number | string | null;
}

interface AnalyticsHourlyRow {
  hour_ts: number | string;
  human_pv: number | string;
  unique_sessions: number | string;
  clicks: number | string;
  conversions: number | string;
  engaged_sessions: number | string;
}

interface AnalyticsDailyRow {
  date_key: string;
  human_pv: number | string;
  unique_sessions: number | string;
  clicks: number | string;
  conversions: number | string;
  engaged_sessions: number | string;
}

interface AnalyticsPageRow {
  path: string;
  page_group: string;
  impressions: number | string;
  human_pv: number | string;
  clicks: number | string;
  conversions: number | string;
}

interface AnalyticsDimRow {
  dim_key: string;
  total: number | string;
}

interface SessionStageRow {
  sid: string;
  max_stage: number | string;
}

interface BucketSessionCountRow {
  bucket_key: string | number;
  sessions: number | string;
}

interface RecentEventRow {
  id: string;
  ts: number | string;
  event: string;
  category: string;
  path: string;
  target: string | null;
  locale: string | null;
  device: string | null;
  country: string | null;
}

interface LoginAttemptRow {
  ip_hash: string;
  failures: number | string;
  window_start: number | string;
  locked_until: number | string;
}

interface D1QueryResult<T = Record<string, unknown>> {
  results?: T[];
  success: boolean;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1QueryResult<T>>;
  run(): Promise<D1QueryResult>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<D1QueryResult<T>[]>;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

interface ScheduledController {
  cron: string;
  scheduledTime: number;
  noRetry(): void;
}

interface GraphQLHourGroup {
  dimensions?: {
    datetime?: string;
  };
  sum?: {
    pageViews?: number;
    requests?: number;
    cachedRequests?: number;
    threats?: number;
    bytes?: number;
  };
}

interface GraphQLCountryEntry {
  clientCountryName?: string;
  requests?: number;
}

interface GraphQLStatusEntry {
  edgeResponseStatus?: number;
  requests?: number;
}

interface GraphQLDayGroup {
  dimensions?: {
    date?: string;
  };
  sum?: {
    requests?: number;
    pageViews?: number;
    cachedRequests?: number;
    threats?: number;
    bytes?: number;
    countryMap?: GraphQLCountryEntry[];
    responseStatusMap?: GraphQLStatusEntry[];
  };
  uniq?: {
    uniques?: number;
  };
}

interface GraphQLResponse {
  data?: {
    viewer?: {
      zones?: Array<{
        httpRequests1hGroups?: GraphQLHourGroup[];
        httpRequests1dGroups?: GraphQLDayGroup[];
      }>;
    };
  };
  errors?: Array<{ message?: string }>;
}

export interface Env {
  DB: D1Database;
  CF_API_TOKEN?: string;
  CF_ZONE_ID?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
}

interface DualVisitsMetrics {
  edgeVisits24h: number;
  humanVisits24h: number;
  edgeSyncAt: string | null;
}

type AnalyticsRange = '24h' | '7d' | '30d';
type EventCategory = 'page_view' | 'tool_interact' | 'high_intent' | 'conversion' | 'other';

const CACHE_KEY_URL = 'https://tokencostsai.com/api/visits-24h';
const EDGE_CACHE_TTL_SECONDS = 10;
const WINDOW_SECONDS = 86400;
const LEGACY_VISIT_RETENTION_SECONDS = 172800; // 48 hours for visit_buckets
const EDGE_HOURLY_RETENTION_SECONDS = 35 * 86400; // 35 days
const EDGE_DAILY_RETENTION_DAYS = 36;
const ANALYTICS_DAILY_RETENTION_DAYS = 90;
const EDGE_SYNC_STALE_SECONDS = 900; // 15 minutes
const EDGE_LOOKBACK_HOURS = 48;
const EDGE_LOOKBACK_DAYS = 31;
const DEFAULT_CF_ZONE_ID = '2ed5d603d02f067e1fafd1ed33f0021d';
const CF_GRAPHQL_ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';
const SESSION_COOKIE_NAME = 'tc_admin_session';
const SESSION_TTL_SECONDS = 86400; // 24 hours
const LOGIN_MAX_FAILURES = 5;
const LOGIN_WINDOW_SECONDS = 600;
const LOGIN_LOCK_SECONDS = 60;
const MANUAL_SYNC_COOLDOWN_SECONDS = 60;

const ALLOWED_LOCALES = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'es'] as const;

const TIER1_COUNTRY_CODES = new Set([
  'US',
  'GB',
  'DE',
  'CA',
  'FR',
  'AU',
  'NL',
  'CH',
  'SE',
  'NO',
  'DK',
  'FI',
  'IE',
  'NZ',
  'AT',
  'BE',
]);

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  CN: 'China',
  GB: 'United Kingdom',
  DE: 'Germany',
  JP: 'Japan',
  CA: 'Canada',
  FR: 'France',
  AU: 'Australia',
  SG: 'Singapore',
  KR: 'South Korea',
  IN: 'India',
  NL: 'Netherlands',
  TW: 'Taiwan',
  HK: 'Hong Kong',
  ES: 'Spain',
  IT: 'Italy',
  BR: 'Brazil',
  SE: 'Sweden',
  CH: 'Switzerland',
  IE: 'Ireland',
  PL: 'Poland',
  RU: 'Russia',
  ID: 'Indonesia',
  VN: 'Vietnam',
  TH: 'Thailand',
  MY: 'Malaysia',
  PH: 'Philippines',
  MX: 'Mexico',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  NZ: 'New Zealand',
  AT: 'Austria',
  BE: 'Belgium',
  IL: 'Israel',
  AE: 'United Arab Emirates',
  TR: 'Turkey',
  PT: 'Portugal',
  CZ: 'Czechia',
  UA: 'Ukraine',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
  XX: 'Unknown',
  T1: 'Tor Network',
};

const TOOL_INTERACT_EVENTS = new Set([
  'calculator_interact',
  'smart_router_interact',
  'pricing_simulator_interact',
  'harness_overhead_simulate',
  'deals_filter_change',
  'deals_view_switch',
]);

const HIGH_INTENT_EVENTS = new Set([
  'router_code_copy',
  'harness_config_copy',
  'badge_copy',
  'developers_sdk_copy',
  'pricing_migration_compare_click',
  'radar_featured_click',
]);

const CONVERSION_EVENTS = new Set([
  'affiliate_click',
  'official_deal_outbound',
  'pricing_audit_cta_click',
]);

const BOT_UA_REGEX =
  /(?:bot(?![a-z])|crawl|spider|slurp|mediapartners|bingpreview|facebookexternalhit|whatsapp|telegram|discord|twitterbot|linkedinbot|curl|wget|python|httpx|aiohttp|axios|node-fetch|undici|go-http-client|headless|playwright|puppeteer|selenium|phantomjs|lighthouse|pagespeed|gtmetrix|pingdom|monitor|uptime|statuscake|datadog|check_http|healthcheck|ahrefs|semrush|mj12|dotbot|yandex|baidu|sogou|bytespider|gptbot|claudebot|anthropic|ccbot|perplexity|applebot|petalbot)/i;

const VISITS_CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

let inflightEdgeSync: Promise<boolean> | null = null;

function isAutomatedRequest(request: Request): boolean {
  const ua = request.headers.get('user-agent')?.trim() ?? '';
  if (!ua || ua.length < 10) return true;
  return BOT_UA_REGEX.test(ua);
}

function getAnalyticsCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') || '';
  const isAllowedOrigin =
    origin === 'https://tokencostsai.com' ||
    origin === 'https://www.tokencostsai.com';
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'https://tokencostsai.com',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function jsonResponse(
  payload: unknown,
  status: number,
  cacheControl: string,
  extraHeaders: Record<string, string> = VISITS_CORS_HEADERS
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
      ...extraHeaders,
    },
  });
}

function getDefaultCache(): Cache {
  return (caches as unknown as { default: Cache }).default;
}

function toSafeInt(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 0;
}

function toDateKeyUtc(tsSec: number): string {
  return new Date(tsSec * 1000).toISOString().slice(0, 10);
}

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const ms = Date.parse(`${dateKey}T00:00:00Z`) + deltaDays * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array | null {
  try {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
    const binary = atob(padded);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      out[i] = binary.charCodeAt(i);
    }
    return out;
  } catch {
    return null;
  }
}

async function sha256Bytes(input: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(digest);
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = await sha256Bytes(input);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function constantTimeStringEqual(a: string, b: string): Promise<boolean> {
  const [hashA, hashB] = await Promise.all([sha256Bytes(a), sha256Bytes(b)]);
  let diff = 0;
  for (let i = 0; i < hashA.length; i += 1) {
    diff |= hashA[i] ^ hashB[i];
  }
  return diff === 0;
}

async function signHmacSha256(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return base64UrlEncode(new Uint8Array(sig));
}

async function createSessionToken(secret: string, nowSec: number): Promise<{ token: string; exp: number }> {
  const exp = nowSec + SESSION_TTL_SECONDS;
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const nonce = base64UrlEncode(nonceBytes);
  const payload = `${exp}.${nonce}`;
  const sig = await signHmacSha256(secret, payload);
  return { token: `${payload}.${sig}`, exp };
}

async function verifySessionToken(
  token: string | null | undefined,
  secret: string | undefined,
  nowSec: number
): Promise<{ valid: boolean; exp: number | null }> {
  if (!token || !secret) return { valid: false, exp: null };
  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false, exp: null };
  const [expStr, nonce, sig] = parts;
  if (!expStr || !nonce || !sig) return { valid: false, exp: null };
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp <= nowSec) return { valid: false, exp: null };

  const expectedSig = await signHmacSha256(secret, `${expStr}.${nonce}`);
  const decodedGot = base64UrlDecode(sig);
  const decodedExp = base64UrlDecode(expectedSig);
  if (!decodedGot || !decodedExp || decodedGot.length !== decodedExp.length) {
    return { valid: false, exp: null };
  }
  let diff = 0;
  for (let i = 0; i < decodedGot.length; i += 1) {
    diff |= decodedGot[i] ^ decodedExp[i];
  }
  return diff === 0 ? { valid: true, exp } : { valid: false, exp: null };
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = val;
  }
  return out;
}

function extractRequestSessionToken(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  const cookies = parseCookies(request.headers.get('cookie'));
  return cookies[SESSION_COOKIE_NAME] || null;
}

function buildSessionCookie(token: string, maxAge: number): string {
  return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

async function syncEdgeMetrics(env: Env): Promise<boolean> {
  const token = env.CF_API_TOKEN?.trim();
  if (!token) {
    console.error('Missing CF_API_TOKEN secret; skipping edge sync');
    return false;
  }

  const rawZoneId = env.CF_ZONE_ID?.trim() || DEFAULT_CF_ZONE_ID;
  if (!/^[a-f0-9]{32}$/i.test(rawZoneId)) {
    console.error('Invalid CF_ZONE_ID format; skipping edge sync');
    return false;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const lookbackStartSec = Math.floor((nowSec - EDGE_LOOKBACK_HOURS * 3600) / 3600) * 3600;
  const datetimeGeq = new Date(lookbackStartSec * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const dateGeq = shiftDateKey(toDateKeyUtc(nowSec), -EDGE_LOOKBACK_DAYS);

  const query = `{
    viewer {
      zones(filter: { zoneTag: "${rawZoneId}" }) {
        httpRequests1hGroups(
          limit: 60,
          orderBy: [datetime_ASC],
          filter: { datetime_geq: "${datetimeGeq}" }
        ) {
          dimensions {
            datetime
          }
          sum {
            pageViews
            requests
            cachedRequests
            threats
            bytes
          }
        }
        httpRequests1dGroups(
          limit: 40,
          orderBy: [date_ASC],
          filter: { date_geq: "${dateGeq}" }
        ) {
          dimensions {
            date
          }
          sum {
            requests
            pageViews
            cachedRequests
            threats
            bytes
            countryMap {
              clientCountryName
              requests
            }
            responseStatusMap {
              edgeResponseStatus
              requests
            }
          }
          uniq {
            uniques
          }
        }
      }
    }
  }`;

  const resp = await fetch(CF_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    console.error(`Cloudflare GraphQL HTTP ${resp.status}: ${errText.slice(0, 300)}`);
    return false;
  }

  const gql = (await resp.json()) as GraphQLResponse;
  if (Array.isArray(gql.errors) && gql.errors.length > 0) {
    console.error('Cloudflare GraphQL errors:', JSON.stringify(gql.errors).slice(0, 300));
    return false;
  }

  const zone = gql.data?.viewer?.zones?.[0];
  const hourGroups = zone?.httpRequests1hGroups ?? [];
  const dayGroups = zone?.httpRequests1dGroups ?? [];
  if (hourGroups.length === 0 && dayGroups.length === 0) {
    console.warn('Cloudflare GraphQL returned 0 hour and day groups');
    return false;
  }

  const updatedAtSec = Math.floor(Date.now() / 1000);
  const cutoffHourRetention = updatedAtSec - EDGE_HOURLY_RETENTION_SECONDS;
  const cutoffDayRetention = shiftDateKey(toDateKeyUtc(updatedAtSec), -EDGE_DAILY_RETENTION_DAYS);
  const stmts: D1PreparedStatement[] = [];

  for (const group of hourGroups) {
    const dt = group?.dimensions?.datetime;
    if (!dt) continue;
    const parsedMs = Date.parse(dt);
    if (!Number.isFinite(parsedMs)) continue;
    const hourTs = Math.floor(parsedMs / 1000);
    if (hourTs <= 0) continue;

    stmts.push(
      env.DB.prepare(
        `INSERT INTO edge_buckets (hour_ts, page_views, requests, cached_requests, threats, bytes, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         ON CONFLICT(hour_ts) DO UPDATE SET
           page_views = excluded.page_views,
           requests = excluded.requests,
           cached_requests = excluded.cached_requests,
           threats = excluded.threats,
           bytes = excluded.bytes,
           updated_at = excluded.updated_at`
      ).bind(
        hourTs,
        toSafeInt(group?.sum?.pageViews),
        toSafeInt(group?.sum?.requests),
        toSafeInt(group?.sum?.cachedRequests),
        toSafeInt(group?.sum?.threats),
        toSafeInt(group?.sum?.bytes),
        updatedAtSec
      )
    );
  }

  for (const day of dayGroups) {
    const dateKey = day?.dimensions?.date;
    if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue;

    const countryMap = (day?.sum?.countryMap ?? [])
      .map((c) => ({
        code: String(c?.clientCountryName || 'XX').toUpperCase().slice(0, 8),
        requests: toSafeInt(c?.requests),
      }))
      .filter((c) => c.requests > 0)
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 30);

    const statusCounts = { s2xx: 0, s3xx: 0, s4xx: 0, s5xx: 0 };
    for (const s of day?.sum?.responseStatusMap ?? []) {
      const code = Number(s?.edgeResponseStatus ?? 0);
      const reqs = toSafeInt(s?.requests);
      if (code >= 200 && code < 300) statusCounts.s2xx += reqs;
      else if (code >= 300 && code < 400) statusCounts.s3xx += reqs;
      else if (code >= 400 && code < 500) statusCounts.s4xx += reqs;
      else if (code >= 500 && code < 600) statusCounts.s5xx += reqs;
    }

    stmts.push(
      env.DB.prepare(
        `INSERT INTO edge_daily_stats (
           date_key, requests, page_views, uniques, cached_requests, threats, bytes,
           countries_json, status_json, updated_at
         )
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
         ON CONFLICT(date_key) DO UPDATE SET
           requests = excluded.requests,
           page_views = excluded.page_views,
           uniques = excluded.uniques,
           cached_requests = excluded.cached_requests,
           threats = excluded.threats,
           bytes = excluded.bytes,
           countries_json = excluded.countries_json,
           status_json = excluded.status_json,
           updated_at = excluded.updated_at`
      ).bind(
        dateKey,
        toSafeInt(day?.sum?.requests),
        toSafeInt(day?.sum?.pageViews),
        toSafeInt(day?.uniq?.uniques),
        toSafeInt(day?.sum?.cachedRequests),
        toSafeInt(day?.sum?.threats),
        toSafeInt(day?.sum?.bytes),
        JSON.stringify(countryMap),
        JSON.stringify(statusCounts),
        updatedAtSec
      )
    );
  }

  if (stmts.length === 0) return false;

  stmts.push(
    env.DB.prepare('DELETE FROM edge_buckets WHERE hour_ts < ?1').bind(cutoffHourRetention),
    env.DB.prepare('DELETE FROM edge_daily_stats WHERE date_key < ?1').bind(cutoffDayRetention)
  );

  await env.DB.batch(stmts);
  return true;
}

async function ensureEdgeBucketsFresh(env: Env, nowSec: number, forceMaxAgeSec = EDGE_SYNC_STALE_SECONDS): Promise<boolean> {
  const [hourStatus, dayStatus] = await Promise.all([
    env.DB.prepare(
      'SELECT MAX(updated_at) AS max_updated_at, COUNT(*) AS row_count FROM edge_buckets'
    ).first<EdgeFreshnessRow>(),
    env.DB.prepare(
      'SELECT MAX(updated_at) AS max_updated_at, COUNT(*) AS row_count FROM edge_daily_stats'
    ).first<EdgeFreshnessRow>(),
  ]);

  const hourCount = toSafeInt(hourStatus?.row_count);
  const hourUpdated = toSafeInt(hourStatus?.max_updated_at);
  const dayCount = toSafeInt(dayStatus?.row_count);
  const dayUpdated = toSafeInt(dayStatus?.max_updated_at);

  const minUpdated = Math.min(hourUpdated, dayUpdated);
  const needsSync =
    hourCount === 0 ||
    dayCount === 0 ||
    minUpdated <= 0 ||
    nowSec - minUpdated > forceMaxAgeSec;

  if (!needsSync) return true;

  if (!inflightEdgeSync) {
    inflightEdgeSync = syncEdgeMetrics(env)
      .catch((err) => {
        console.error('ensureEdgeBucketsFresh failed:', err);
        return false;
      })
      .finally(() => {
        inflightEdgeSync = null;
      });
  }

  return inflightEdgeSync;
}

async function queryEdgeVisits24h(
  db: D1Database,
  nowSec: number
): Promise<{ edgeVisits24h: number; edgeSyncAt: string | null }> {
  const cutoffSec = nowSec - WINDOW_SECONDS;
  const minHourTs = cutoffSec - 3600;

  const result = await db
    .prepare(
      'SELECT hour_ts, page_views, updated_at FROM edge_buckets WHERE hour_ts > ?1 AND hour_ts <= ?2 ORDER BY hour_ts ASC'
    )
    .bind(minHourTs, nowSec)
    .all<EdgeBucketRow>();

  const rows = result.results ?? [];
  let total = 0;
  let maxUpdatedAt = 0;

  for (const row of rows) {
    const hourTs = toSafeInt(row.hour_ts);
    const pageViews = toSafeInt(row.page_views);
    const updatedAt = toSafeInt(row.updated_at);

    if (updatedAt > maxUpdatedAt) {
      maxUpdatedAt = updatedAt;
    }

    if (hourTs >= cutoffSec) {
      total += pageViews;
    } else if (hourTs + 3600 > cutoffSec) {
      const remainingRatio = (hourTs + 3600 - cutoffSec) / 3600;
      total += Math.round(pageViews * remainingRatio);
    }
  }

  return {
    edgeVisits24h: total,
    edgeSyncAt: maxUpdatedAt > 0 ? new Date(maxUpdatedAt * 1000).toISOString() : null,
  };
}

async function queryHumanVisits24h(db: D1Database, nowSec: number): Promise<number> {
  const cutoffTs = nowSec - WINDOW_SECONDS;
  const row = await db
    .prepare('SELECT COALESCE(SUM(hits), 0) AS total FROM visit_buckets WHERE bucket_ts >= ?1')
    .bind(cutoffTs)
    .first<D1ResultRow>();
  return toSafeInt(row?.total);
}

async function queryDualMetrics(env: Env, nowSec: number): Promise<DualVisitsMetrics> {
  await ensureEdgeBucketsFresh(env, nowSec);
  const [edgeStats, humanVisits24h] = await Promise.all([
    queryEdgeVisits24h(env.DB, nowSec),
    queryHumanVisits24h(env.DB, nowSec),
  ]);

  return {
    edgeVisits24h: edgeStats.edgeVisits24h,
    humanVisits24h,
    edgeSyncAt: edgeStats.edgeSyncAt,
  };
}

function buildGetPayload(metrics: DualVisitsMetrics, updatedAt: string) {
  return {
    visits24h: metrics.edgeVisits24h,
    edgeVisits24h: metrics.edgeVisits24h,
    humanVisits24h: metrics.humanVisits24h,
    edgeSyncAt: metrics.edgeSyncAt,
    windowHours: 24,
    updatedAt,
    mode: 'rolling-24h',
  };
}

function stripLocalePrefix(pathname: string): string {
  const clean = pathname.trim() || '/';
  const match = clean.match(/^\/(zh-CN|zh-TW|ja|ko|es)(\/.*)?$/);
  if (match) {
    return match[2] || '/';
  }
  return clean;
}

function normalizePath(rawPath: unknown): string {
  if (typeof rawPath !== 'string') return '/';
  let p = rawPath.split('?')[0].split('#')[0].trim();
  if (!p.startsWith('/')) p = `/${p}`;
  p = p.replace(/\/+/g, '/');
  if (p.length > 1 && !p.endsWith('/')) {
    p = `${p}/`;
  }
  return p.slice(0, 160);
}

function isAdminPath(path: string): boolean {
  const stripped = stripLocalePrefix(path).toLowerCase();
  return stripped === '/admin' || stripped.startsWith('/admin/');
}

function resolveChannel(path: string): string {
  const stripped = stripLocalePrefix(path).toLowerCase();
  if (stripped === '/' || stripped === '') return 'Home';
  if (stripped.startsWith('/deals')) return 'Deals';
  if (stripped.startsWith('/calculator')) return 'Calculator';
  if (stripped.startsWith('/compare')) return 'Compare';
  if (stripped.startsWith('/models')) return 'Models';
  if (stripped.startsWith('/harness')) return 'Harness';
  if (stripped.startsWith('/pricing')) return 'Pricing';
  if (stripped.startsWith('/developers')) return 'Developers';
  if (stripped.startsWith('/contact')) return 'Contact';
  return 'Other';
}

function normalizeLocale(rawLocale: unknown, path: string): string {
  if (typeof rawLocale === 'string') {
    const trimmed = rawLocale.trim();
    if ((ALLOWED_LOCALES as readonly string[]).includes(trimmed)) {
      return trimmed;
    }
    const lower = trimmed.toLowerCase();
    if (lower === 'zh-cn' || lower === 'zh') return 'zh-CN';
    if (lower === 'zh-tw' || lower === 'zh-hk') return 'zh-TW';
    if (lower === 'ja' || lower === 'ko' || lower === 'es' || lower === 'en') return lower;
  }
  const m = path.match(/^\/(zh-CN|zh-TW|ja|ko|es)(\/|$)/);
  if (m) return m[1];
  return 'en';
}

function normalizeDevice(rawDevice: unknown): 'desktop' | 'mobile' | 'tablet' {
  if (typeof rawDevice === 'string') {
    const lower = rawDevice.toLowerCase().trim();
    if (lower === 'mobile' || lower === 'tablet' || lower === 'desktop') {
      return lower;
    }
  }
  return 'desktop';
}

function normalizeReferrer(rawRef: unknown): string {
  if (typeof rawRef !== 'string') return 'Direct / None';
  const trimmed = rawRef.trim().toLowerCase().replace(/^www\./, '');
  if (!trimmed || trimmed === 'tokencostsai.com' || trimmed === 'localhost' || trimmed === '127.0.0.1') {
    return 'Direct / None';
  }
  return trimmed.slice(0, 80);
}

function sanitizeShortToken(raw: unknown, maxLen = 64): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim().slice(0, maxLen);
  return cleaned || null;
}

function classifyEvent(event: string): {
  category: EventCategory;
  stage: 1 | 2 | 3 | 4;
  isPv: boolean;
  isImpression: boolean;
  isClick: boolean;
  isConversion: boolean;
  isEngaged: boolean;
} {
  if (event === 'page_view') {
    return {
      category: 'page_view',
      stage: 1,
      isPv: true,
      isImpression: false,
      isClick: false,
      isConversion: false,
      isEngaged: false,
    };
  }
  if (event === 'module_impression') {
    return {
      category: 'other',
      stage: 1,
      isPv: false,
      isImpression: true,
      isClick: false,
      isConversion: false,
      isEngaged: false,
    };
  }
  if (CONVERSION_EVENTS.has(event)) {
    return {
      category: 'conversion',
      stage: 4,
      isPv: false,
      isImpression: false,
      isClick: true,
      isConversion: true,
      isEngaged: true,
    };
  }
  if (HIGH_INTENT_EVENTS.has(event)) {
    return {
      category: 'high_intent',
      stage: 3,
      isPv: false,
      isImpression: false,
      isClick: true,
      isConversion: false,
      isEngaged: true,
    };
  }
  if (TOOL_INTERACT_EVENTS.has(event)) {
    return {
      category: 'tool_interact',
      stage: 2,
      isPv: false,
      isImpression: false,
      isClick: true,
      isConversion: false,
      isEngaged: true,
    };
  }
  return {
    category: 'other',
    stage: 1,
    isPv: false,
    isImpression: false,
    isClick: false,
    isConversion: false,
    isEngaged: false,
  };
}

function extractEventTarget(params: Record<string, unknown>): string | null {
  const keys = ['partner', 'model_id', 'modelId', 'strategy', 'strategy_id', 'harness', 'value', 'to_locale', 'theme_to', 'topic', 'placement'];
  for (const k of keys) {
    const v = params[k];
    if (typeof v === 'string' && v.trim()) {
      return v.trim().slice(0, 64);
    }
  }
  return null;
}

async function handleCollect(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const corsHeaders = getAnalyticsCorsHeaders(request);

  if (isAutomatedRequest(request)) {
    return jsonResponse({ ok: true, counted: false }, 200, 'no-store', corsHeaders);
  }

  let rawText = '';
  try {
    rawText = await request.text();
  } catch {
    return jsonResponse({ error: 'Invalid body' }, 400, 'no-store', corsHeaders);
  }
  if (!rawText || rawText.length > 16384) {
    return jsonResponse({ error: 'Invalid payload size' }, 400, 'no-store', corsHeaders);
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400, 'no-store', corsHeaders);
  }

  const event = sanitizeShortToken(body.event, 64);
  const sid = sanitizeShortToken(body.sid, 64);
  if (!event || !sid || !/^[a-zA-Z0-9_:-]+$/.test(event)) {
    return jsonResponse({ error: 'Missing event or sid' }, 400, 'no-store', corsHeaders);
  }

  const path = normalizePath(body.path);
  if (isAdminPath(path)) {
    return jsonResponse({ ok: true, counted: false }, 200, 'no-store', corsHeaders);
  }

  const nowMs = Date.now();
  const nowSec = Math.floor(nowMs / 1000);
  const hourTs = Math.floor(nowSec / 3600) * 3600;
  const dateKey = toDateKeyUtc(nowSec);
  const pageGroup = sanitizeShortToken(body.page_group, 32) || resolveChannel(path);
  const locale = normalizeLocale(body.locale, path);
  const device = normalizeDevice(body.device_type);
  const referrerHost = normalizeReferrer(body.referrer_host);
  const utmSource = sanitizeShortToken(body.utm_source, 48);
  const params =
    body.params && typeof body.params === 'object' && !Array.isArray(body.params)
      ? (body.params as Record<string, unknown>)
      : {};

  const cls = classifyEvent(event);
  const pvInc = cls.isPv ? 1 : 0;
  const imprInc = cls.isImpression ? 1 : 0;
  const clickInc = cls.isClick ? 1 : 0;
  const convInc = cls.isConversion ? 1 : 0;
  const engagedInc = cls.isEngaged ? 1 : 0;

  const cfCountryRaw = (request as Request & { cf?: { country?: string } }).cf?.country;
  const country = typeof cfCountryRaw === 'string' && cfCountryRaw.trim() ? cfCountryRaw.trim().toUpperCase().slice(0, 8) : null;

  const stmts: D1PreparedStatement[] = [
    env.DB.prepare(
      `INSERT INTO analytics_hourly (hour_ts, human_pv, unique_sessions, clicks, conversions, engaged_sessions)
       VALUES (?1, ?2, 0, ?3, ?4, ?5)
       ON CONFLICT(hour_ts) DO UPDATE SET
         human_pv = human_pv + excluded.human_pv,
         clicks = clicks + excluded.clicks,
         conversions = conversions + excluded.conversions,
         engaged_sessions = engaged_sessions + excluded.engaged_sessions`
    ).bind(hourTs, pvInc, clickInc, convInc, engagedInc),

    env.DB.prepare(
      `INSERT INTO analytics_daily (date_key, human_pv, unique_sessions, clicks, conversions, engaged_sessions)
       VALUES (?1, ?2, 0, ?3, ?4, ?5)
       ON CONFLICT(date_key) DO UPDATE SET
         human_pv = human_pv + excluded.human_pv,
         clicks = clicks + excluded.clicks,
         conversions = conversions + excluded.conversions,
         engaged_sessions = engaged_sessions + excluded.engaged_sessions`
    ).bind(dateKey, pvInc, clickInc, convInc, engagedInc),

    env.DB.prepare(
      `INSERT INTO analytics_page_daily (date_key, path, page_group, impressions, human_pv, clicks, conversions)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
       ON CONFLICT(date_key, path) DO UPDATE SET
         page_group = excluded.page_group,
         impressions = impressions + excluded.impressions,
         human_pv = human_pv + excluded.human_pv,
         clicks = clicks + excluded.clicks,
         conversions = conversions + excluded.conversions`
    ).bind(dateKey, path, pageGroup, imprInc, pvInc, clickInc, convInc),

    env.DB.prepare(
      `INSERT INTO analytics_session_seen (scope_type, scope_val, sid, scope_ts, max_stage, first_seen_ts, last_seen_ts)
       VALUES ('h', ?1, ?2, ?3, ?4, ?5, ?5)
       ON CONFLICT(scope_type, scope_val, sid) DO UPDATE SET
         max_stage = CASE WHEN excluded.max_stage > max_stage THEN excluded.max_stage ELSE max_stage END,
         last_seen_ts = excluded.last_seen_ts`
    ).bind(String(hourTs), sid, hourTs, cls.stage, nowSec),

    env.DB.prepare(
      `INSERT INTO analytics_session_seen (scope_type, scope_val, sid, scope_ts, max_stage, first_seen_ts, last_seen_ts)
       VALUES ('d', ?1, ?2, ?3, ?4, ?5, ?5)
       ON CONFLICT(scope_type, scope_val, sid) DO UPDATE SET
         max_stage = CASE WHEN excluded.max_stage > max_stage THEN excluded.max_stage ELSE max_stage END,
         last_seen_ts = excluded.last_seen_ts`
    ).bind(dateKey, sid, hourTs, cls.stage, nowSec),
  ];

  if (cls.isPv) {
    const refKey = utmSource ? `${referrerHost}||${utmSource}` : referrerHost;
    stmts.push(
      env.DB.prepare(
        `INSERT INTO analytics_dim_daily (date_key, dim_type, dim_key, count)
         VALUES (?1, 'referrer', ?2, 1)
         ON CONFLICT(date_key, dim_type, dim_key) DO UPDATE SET count = count + 1`
      ).bind(dateKey, refKey),
      env.DB.prepare(
        `INSERT INTO analytics_dim_daily (date_key, dim_type, dim_key, count)
         VALUES (?1, 'locale', ?2, 1)
         ON CONFLICT(date_key, dim_type, dim_key) DO UPDATE SET count = count + 1`
      ).bind(dateKey, locale),
      env.DB.prepare(
        `INSERT INTO analytics_dim_daily (date_key, dim_type, dim_key, count)
         VALUES (?1, 'device', ?2, 1)
         ON CONFLICT(date_key, dim_type, dim_key) DO UPDATE SET count = count + 1`
      ).bind(dateKey, device)
    );
  }

  if (!cls.isPv && !cls.isImpression) {
    stmts.push(
      env.DB.prepare(
        `INSERT INTO analytics_dim_daily (date_key, dim_type, dim_key, count)
         VALUES (?1, 'event', ?2, 1)
         ON CONFLICT(date_key, dim_type, dim_key) DO UPDATE SET count = count + 1`
      ).bind(dateKey, event)
    );
  }

  const partner = sanitizeShortToken(params.partner, 48);
  if (cls.isConversion && partner) {
    stmts.push(
      env.DB.prepare(
        `INSERT INTO analytics_dim_daily (date_key, dim_type, dim_key, count)
         VALUES (?1, 'partner', ?2, 1)
         ON CONFLICT(date_key, dim_type, dim_key) DO UPDATE SET count = count + 1`
      ).bind(dateKey, partner)
    );
  }

  if (!cls.isImpression) {
    const eventId = `${nowMs}-${crypto.randomUUID().slice(0, 8)}`;
    const target = extractEventTarget(params);
    stmts.push(
      env.DB.prepare(
        `INSERT INTO analytics_recent_events (id, ts, event, category, path, target, locale, device, country)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
      ).bind(eventId, nowMs, event, cls.category, path, target, locale, device, country)
    );
  }

  await env.DB.batch(stmts);

  // Probabilistic cleanup of old session/recent rows (5%)
  if (Math.random() < 0.05) {
    const sessionCutoff = nowSec - EDGE_HOURLY_RETENTION_SECONDS;
    const dailyCutoff = shiftDateKey(dateKey, -ANALYTICS_DAILY_RETENTION_DAYS);
    ctx.waitUntil(
      env.DB.batch([
        env.DB.prepare(
          'DELETE FROM analytics_recent_events WHERE id NOT IN (SELECT id FROM analytics_recent_events ORDER BY ts DESC LIMIT 100)'
        ),
        env.DB.prepare('DELETE FROM analytics_session_seen WHERE scope_ts < ?1').bind(sessionCutoff),
        env.DB.prepare('DELETE FROM analytics_hourly WHERE hour_ts < ?1').bind(sessionCutoff),
        env.DB.prepare('DELETE FROM analytics_daily WHERE date_key < ?1').bind(dailyCutoff),
        env.DB.prepare('DELETE FROM analytics_page_daily WHERE date_key < ?1').bind(dailyCutoff),
        env.DB.prepare('DELETE FROM analytics_dim_daily WHERE date_key < ?1').bind(dailyCutoff),
      ])
    );
  }

  return jsonResponse({ ok: true, counted: true }, 200, 'no-store', corsHeaders);
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const corsHeaders = getAnalyticsCorsHeaders(request);
  const adminPassword = env.ADMIN_PASSWORD?.trim();
  const sessionSecret = env.ADMIN_SESSION_SECRET?.trim();

  if (!adminPassword || !sessionSecret) {
    return jsonResponse({ error: 'Admin authentication is not configured' }, 500, 'no-store', corsHeaders);
  }

  let body: { password?: unknown };
  try {
    body = (await request.json()) as { password?: unknown };
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400, 'no-store', corsHeaders);
  }

  const submitted = typeof body.password === 'string' ? body.password : '';
  const nowSec = Math.floor(Date.now() / 1000);
  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  const ipHash = await sha256Hex(`${ip}:${sessionSecret}`);

  const attempt = await env.DB.prepare(
    'SELECT ip_hash, failures, window_start, locked_until FROM analytics_login_attempts WHERE ip_hash = ?1'
  )
    .bind(ipHash)
    .first<LoginAttemptRow>();

  if (attempt && toSafeInt(attempt.locked_until) > nowSec) {
    const retryAfter = toSafeInt(attempt.locked_until) - nowSec;
    return new Response(
      JSON.stringify({ error: 'Too many failed attempts', retryAfter }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
          'Retry-After': String(retryAfter),
          ...corsHeaders,
        },
      }
    );
  }

  const valid = submitted.length > 0 && (await constantTimeStringEqual(submitted, adminPassword));
  if (!valid) {
    const prevWindowStart = attempt ? toSafeInt(attempt.window_start) : 0;
    const withinWindow = prevWindowStart > 0 && nowSec - prevWindowStart <= LOGIN_WINDOW_SECONDS;
    const nextFailures = withinWindow ? toSafeInt(attempt?.failures) + 1 : 1;
    const nextWindowStart = withinWindow ? prevWindowStart : nowSec;
    const nextLockedUntil = nextFailures >= LOGIN_MAX_FAILURES ? nowSec + LOGIN_LOCK_SECONDS : 0;

    await env.DB.prepare(
      `INSERT INTO analytics_login_attempts (ip_hash, failures, window_start, locked_until)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(ip_hash) DO UPDATE SET
         failures = excluded.failures,
         window_start = excluded.window_start,
         locked_until = excluded.locked_until`
    )
      .bind(ipHash, nextFailures, nextWindowStart, nextLockedUntil)
      .run();

    if (nextLockedUntil > nowSec) {
      return new Response(
        JSON.stringify({ error: 'Too many failed attempts', retryAfter: LOGIN_LOCK_SECONDS }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'Retry-After': String(LOGIN_LOCK_SECONDS),
            ...corsHeaders,
          },
        }
      );
    }

    return jsonResponse({ error: 'Invalid password' }, 401, 'no-store', corsHeaders);
  }

  await env.DB.prepare('DELETE FROM analytics_login_attempts WHERE ip_hash = ?1').bind(ipHash).run();

  const { token, exp } = await createSessionToken(sessionSecret, nowSec);
  return new Response(
    JSON.stringify({
      ok: true,
      authenticated: true,
      token,
      expiresAt: new Date(exp * 1000).toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Set-Cookie': buildSessionCookie(token, SESSION_TTL_SECONDS),
        ...corsHeaders,
      },
    }
  );
}

async function handleSession(request: Request, env: Env): Promise<Response> {
  const corsHeaders = getAnalyticsCorsHeaders(request);
  const nowSec = Math.floor(Date.now() / 1000);
  const token = extractRequestSessionToken(request);
  const verified = await verifySessionToken(token, env.ADMIN_SESSION_SECRET?.trim(), nowSec);
  return jsonResponse(
    {
      authenticated: verified.valid,
      expiresAt: verified.exp ? new Date(verified.exp * 1000).toISOString() : null,
    },
    200,
    'no-store',
    corsHeaders
  );
}

async function handleLogout(request: Request): Promise<Response> {
  const corsHeaders = getAnalyticsCorsHeaders(request);
  return new Response(
    JSON.stringify({ ok: true, authenticated: false }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Set-Cookie': buildSessionCookie('', 0),
        ...corsHeaders,
      },
    }
  );
}

function calcDeltaPct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  const pct = ((current - previous) / previous) * 100;
  return Math.round(pct * 10) / 10;
}

function parseJsonSafe<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function handleOverview(request: Request, env: Env): Promise<Response> {
  const corsHeaders = getAnalyticsCorsHeaders(request);
  const nowSec = Math.floor(Date.now() / 1000);
  const token = extractRequestSessionToken(request);
  const verified = await verifySessionToken(token, env.ADMIN_SESSION_SECRET?.trim(), nowSec);
  if (!verified.valid) {
    return jsonResponse({ error: 'Unauthorized' }, 401, 'no-store', corsHeaders);
  }

  const url = new URL(request.url);
  const rawRange = url.searchParams.get('range');
  const range: AnalyticsRange =
    rawRange === '7d' || rawRange === '30d' ? rawRange : '24h';
  const forceRefresh = url.searchParams.get('refresh') === '1';

  const syncOk = await ensureEdgeBucketsFresh(
    env,
    nowSec,
    forceRefresh ? MANUAL_SYNC_COOLDOWN_SECONDS : EDGE_SYNC_STALE_SECONDS
  );

  const currentHourTs = Math.floor(nowSec / 3600) * 3600;
  const todayKey = toDateKeyUtc(nowSec);

  let edgeRequests = 0;
  let edgeCached = 0;
  let edgePageViews = 0;
  let edgeUniques = 0;
  let edgeThreats = 0;
  let edgeBytes = 0;
  let status2xx = 0;
  let status3xx = 0;
  let status4xx = 0;
  let status5xx = 0;
  let maxUpdatedAt = 0;

  let prevEdgeRequests = 0;
  let prevEdgePageViews = 0;

  const countryAgg = new Map<string, number>();

  const edgeSeries: Array<{
    bucket: string;
    label: string;
    requests: number;
    pageViews: number;
    cachedRequests: number;
  }> = [];

  const humanSeries: Array<{
    bucket: string;
    label: string;
    pv: number;
    sessions: number;
    clicks: number;
    conversions: number;
  }> = [];

  let humanPv = 0;
  let prevHumanPv = 0;
  let clicks = 0;
  let prevClicks = 0;
  let conversions = 0;
  let prevConversions = 0;

  let dimStartDateKey = todayKey;
  let dimEndDateKey = todayKey;

  if (range === '24h') {
    const startHourTs = currentHourTs - 23 * 3600;
    const prevStartHourTs = startHourTs - 24 * 3600;
    dimStartDateKey = shiftDateKey(todayKey, -1);
    dimEndDateKey = todayKey;

    const [edgeHourRes, humanHourRes, sessionBucketRes, edgeDayRes] = await Promise.all([
      env.DB.prepare(
        'SELECT hour_ts, page_views, requests, cached_requests, threats, bytes, updated_at FROM edge_buckets WHERE hour_ts >= ?1 AND hour_ts <= ?2 ORDER BY hour_ts ASC'
      )
        .bind(prevStartHourTs, currentHourTs)
        .all<EdgeBucketRow>(),
      env.DB.prepare(
        'SELECT hour_ts, human_pv, unique_sessions, clicks, conversions, engaged_sessions FROM analytics_hourly WHERE hour_ts >= ?1 AND hour_ts <= ?2 ORDER BY hour_ts ASC'
      )
        .bind(prevStartHourTs, currentHourTs)
        .all<AnalyticsHourlyRow>(),
      env.DB.prepare(
        "SELECT scope_ts AS bucket_key, COUNT(*) AS sessions FROM analytics_session_seen WHERE scope_type = 'h' AND scope_ts >= ?1 AND scope_ts <= ?2 GROUP BY scope_ts"
      )
        .bind(startHourTs, currentHourTs)
        .all<BucketSessionCountRow>(),
      env.DB.prepare(
        'SELECT date_key, requests, page_views, uniques, cached_requests, threats, bytes, countries_json, status_json, updated_at FROM edge_daily_stats WHERE date_key >= ?1 AND date_key <= ?2 ORDER BY date_key ASC'
      )
        .bind(shiftDateKey(todayKey, -1), todayKey)
        .all<EdgeDailyRow>(),
    ]);

    const edgeMap = new Map<number, EdgeBucketRow>();
    for (const r of edgeHourRes.results ?? []) {
      const h = toSafeInt(r.hour_ts);
      edgeMap.set(h, r);
      const u = toSafeInt(r.updated_at);
      if (u > maxUpdatedAt) maxUpdatedAt = u;
    }

    const humanMap = new Map<number, AnalyticsHourlyRow>();
    for (const r of humanHourRes.results ?? []) {
      humanMap.set(toSafeInt(r.hour_ts), r);
    }

    const sessionBucketMap = new Map<number, number>();
    for (const r of sessionBucketRes.results ?? []) {
      sessionBucketMap.set(toSafeInt(r.bucket_key), toSafeInt(r.sessions));
    }

    for (let h = prevStartHourTs; h < startHourTs; h += 3600) {
      const e = edgeMap.get(h);
      if (e) {
        prevEdgeRequests += toSafeInt(e.requests);
        prevEdgePageViews += toSafeInt(e.page_views);
      }
      const hu = humanMap.get(h);
      if (hu) {
        prevHumanPv += toSafeInt(hu.human_pv);
        prevClicks += toSafeInt(hu.clicks);
        prevConversions += toSafeInt(hu.conversions);
      }
    }

    for (let i = 0; i < 24; i += 1) {
      const h = startHourTs + i * 3600;
      const iso = new Date(h * 1000).toISOString();
      const label = iso.slice(11, 16);

      const e = edgeMap.get(h);
      const reqs = e ? toSafeInt(e.requests) : 0;
      const pvs = e ? toSafeInt(e.page_views) : 0;
      const cached = e ? toSafeInt(e.cached_requests) : 0;
      const threats = e ? toSafeInt(e.threats) : 0;
      const bytes = e ? toSafeInt(e.bytes) : 0;

      edgeRequests += reqs;
      edgePageViews += pvs;
      edgeCached += cached;
      edgeThreats += threats;
      edgeBytes += bytes;

      edgeSeries.push({
        bucket: iso,
        label,
        requests: reqs,
        pageViews: pvs,
        cachedRequests: cached,
      });

      const hu = humanMap.get(h);
      const hpv = hu ? toSafeInt(hu.human_pv) : 0;
      const hclicks = hu ? toSafeInt(hu.clicks) : 0;
      const hconv = hu ? toSafeInt(hu.conversions) : 0;
      const hsess = sessionBucketMap.get(h) ?? 0;

      humanPv += hpv;
      clicks += hclicks;
      conversions += hconv;

      humanSeries.push({
        bucket: iso,
        label,
        pv: hpv,
        sessions: hsess,
        clicks: hclicks,
        conversions: hconv,
      });
    }

    // Derive countries, HTTP status, and uniques for 24h from today's + weighted yesterday's edge_daily_stats
    const hoursToday = Math.max(1, new Date(nowSec * 1000).getUTCHours() + 1);
    const yesterdayWeight = Math.max(0, (24 - hoursToday) / 24);
    for (const d of edgeDayRes.results ?? []) {
      const w = d.date_key === todayKey ? 1 : yesterdayWeight;
      if (w <= 0) continue;
      edgeUniques += Math.round(toSafeInt(d.uniques) * w);
      const st = parseJsonSafe<{ s2xx?: number; s3xx?: number; s4xx?: number; s5xx?: number }>(
        d.status_json,
        {}
      );
      status2xx += Math.round(toSafeInt(st.s2xx) * w);
      status3xx += Math.round(toSafeInt(st.s3xx) * w);
      status4xx += Math.round(toSafeInt(st.s4xx) * w);
      status5xx += Math.round(toSafeInt(st.s5xx) * w);
      const countries = parseJsonSafe<Array<{ code: string; requests: number }>>(d.countries_json, []);
      for (const c of countries) {
        const code = String(c.code || 'XX').toUpperCase();
        countryAgg.set(code, (countryAgg.get(code) || 0) + Math.round(toSafeInt(c.requests) * w));
      }
    }
  } else {
    const days = range === '7d' ? 7 : 30;
    const startDateKey = shiftDateKey(todayKey, -(days - 1));
    const prevStartDateKey = shiftDateKey(startDateKey, -days);
    dimStartDateKey = startDateKey;
    dimEndDateKey = todayKey;

    const [edgeDayRes, humanDayRes, sessionBucketRes] = await Promise.all([
      env.DB.prepare(
        'SELECT date_key, requests, page_views, uniques, cached_requests, threats, bytes, countries_json, status_json, updated_at FROM edge_daily_stats WHERE date_key >= ?1 AND date_key <= ?2 ORDER BY date_key ASC'
      )
        .bind(prevStartDateKey, todayKey)
        .all<EdgeDailyRow>(),
      env.DB.prepare(
        'SELECT date_key, human_pv, unique_sessions, clicks, conversions, engaged_sessions FROM analytics_daily WHERE date_key >= ?1 AND date_key <= ?2 ORDER BY date_key ASC'
      )
        .bind(prevStartDateKey, todayKey)
        .all<AnalyticsDailyRow>(),
      env.DB.prepare(
        "SELECT scope_val AS bucket_key, COUNT(*) AS sessions FROM analytics_session_seen WHERE scope_type = 'd' AND scope_val >= ?1 AND scope_val <= ?2 GROUP BY scope_val"
      )
        .bind(startDateKey, todayKey)
        .all<BucketSessionCountRow>(),
    ]);

    const edgeDayMap = new Map<string, EdgeDailyRow>();
    for (const r of edgeDayRes.results ?? []) {
      edgeDayMap.set(r.date_key, r);
      const u = toSafeInt(r.updated_at);
      if (u > maxUpdatedAt) maxUpdatedAt = u;
    }

    const humanDayMap = new Map<string, AnalyticsDailyRow>();
    for (const r of humanDayRes.results ?? []) {
      humanDayMap.set(r.date_key, r);
    }

    const sessionDayMap = new Map<string, number>();
    for (const r of sessionBucketRes.results ?? []) {
      sessionDayMap.set(String(r.bucket_key), toSafeInt(r.sessions));
    }

    for (let i = 0; i < days; i += 1) {
      const dk = shiftDateKey(prevStartDateKey, i);
      const e = edgeDayMap.get(dk);
      if (e) {
        prevEdgeRequests += toSafeInt(e.requests);
        prevEdgePageViews += toSafeInt(e.page_views);
      }
      const hu = humanDayMap.get(dk);
      if (hu) {
        prevHumanPv += toSafeInt(hu.human_pv);
        prevClicks += toSafeInt(hu.clicks);
        prevConversions += toSafeInt(hu.conversions);
      }
    }

    for (let i = 0; i < days; i += 1) {
      const dk = shiftDateKey(startDateKey, i);
      const label = `${dk.slice(5, 7)}/${dk.slice(8, 10)}`;
      const e = edgeDayMap.get(dk);
      const reqs = e ? toSafeInt(e.requests) : 0;
      const pvs = e ? toSafeInt(e.page_views) : 0;
      const cached = e ? toSafeInt(e.cached_requests) : 0;

      if (e) {
        edgeRequests += reqs;
        edgePageViews += pvs;
        edgeUniques += toSafeInt(e.uniques);
        edgeCached += cached;
        edgeThreats += toSafeInt(e.threats);
        edgeBytes += toSafeInt(e.bytes);

        const st = parseJsonSafe<{ s2xx?: number; s3xx?: number; s4xx?: number; s5xx?: number }>(
          e.status_json,
          {}
        );
        status2xx += toSafeInt(st.s2xx);
        status3xx += toSafeInt(st.s3xx);
        status4xx += toSafeInt(st.s4xx);
        status5xx += toSafeInt(st.s5xx);

        const countries = parseJsonSafe<Array<{ code: string; requests: number }>>(e.countries_json, []);
        for (const c of countries) {
          const code = String(c.code || 'XX').toUpperCase();
          countryAgg.set(code, (countryAgg.get(code) || 0) + toSafeInt(c.requests));
        }
      }

      edgeSeries.push({
        bucket: dk,
        label,
        requests: reqs,
        pageViews: pvs,
        cachedRequests: cached,
      });

      const hu = humanDayMap.get(dk);
      const hpv = hu ? toSafeInt(hu.human_pv) : 0;
      const hclicks = hu ? toSafeInt(hu.clicks) : 0;
      const hconv = hu ? toSafeInt(hu.conversions) : 0;
      const hsess = sessionDayMap.get(dk) ?? 0;

      humanPv += hpv;
      clicks += hclicks;
      conversions += hconv;

      humanSeries.push({
        bucket: dk,
        label,
        pv: hpv,
        sessions: hsess,
        clicks: hclicks,
        conversions: hconv,
      });
    }
  }

  // Query funnel, unique sessions, page performance, dimensions, and live feed in parallel
  const funnelQuery =
    range === '24h'
      ? env.DB.prepare(
          "SELECT sid, MAX(max_stage) AS max_stage FROM analytics_session_seen WHERE scope_type = 'h' AND scope_ts >= ?1 GROUP BY sid"
        ).bind(currentHourTs - 23 * 3600)
      : env.DB.prepare(
          "SELECT sid, MAX(max_stage) AS max_stage FROM analytics_session_seen WHERE scope_type = 'd' AND scope_val >= ?1 AND scope_val <= ?2 GROUP BY sid"
        ).bind(dimStartDateKey, dimEndDateKey);

  const [sessionStageRes, pagesRes, refRes, localeRes, deviceRes, partnerRes, eventRes, recentRes] =
    await Promise.all([
      funnelQuery.all<SessionStageRow>(),
      env.DB.prepare(
        `SELECT path, MAX(page_group) AS page_group,
                SUM(impressions) AS impressions, SUM(human_pv) AS human_pv,
                SUM(clicks) AS clicks, SUM(conversions) AS conversions
         FROM analytics_page_daily
         WHERE date_key >= ?1 AND date_key <= ?2
         GROUP BY path
         ORDER BY human_pv DESC, clicks DESC
         LIMIT 50`
      )
        .bind(dimStartDateKey, dimEndDateKey)
        .all<AnalyticsPageRow>(),
      env.DB.prepare(
        "SELECT dim_key, SUM(count) AS total FROM analytics_dim_daily WHERE date_key >= ?1 AND date_key <= ?2 AND dim_type = 'referrer' GROUP BY dim_key ORDER BY total DESC LIMIT 20"
      )
        .bind(dimStartDateKey, dimEndDateKey)
        .all<AnalyticsDimRow>(),
      env.DB.prepare(
        "SELECT dim_key, SUM(count) AS total FROM analytics_dim_daily WHERE date_key >= ?1 AND date_key <= ?2 AND dim_type = 'locale' GROUP BY dim_key ORDER BY total DESC"
      )
        .bind(dimStartDateKey, dimEndDateKey)
        .all<AnalyticsDimRow>(),
      env.DB.prepare(
        "SELECT dim_key, SUM(count) AS total FROM analytics_dim_daily WHERE date_key >= ?1 AND date_key <= ?2 AND dim_type = 'device' GROUP BY dim_key ORDER BY total DESC"
      )
        .bind(dimStartDateKey, dimEndDateKey)
        .all<AnalyticsDimRow>(),
      env.DB.prepare(
        "SELECT dim_key, SUM(count) AS total FROM analytics_dim_daily WHERE date_key >= ?1 AND date_key <= ?2 AND dim_type = 'partner' GROUP BY dim_key ORDER BY total DESC LIMIT 10"
      )
        .bind(dimStartDateKey, dimEndDateKey)
        .all<AnalyticsDimRow>(),
      env.DB.prepare(
        "SELECT dim_key, SUM(count) AS total FROM analytics_dim_daily WHERE date_key >= ?1 AND date_key <= ?2 AND dim_type = 'event' GROUP BY dim_key ORDER BY total DESC LIMIT 12"
      )
        .bind(dimStartDateKey, dimEndDateKey)
        .all<AnalyticsDimRow>(),
      env.DB.prepare(
        'SELECT id, ts, event, category, path, target, locale, device, country FROM analytics_recent_events ORDER BY ts DESC LIMIT 20'
      ).all<RecentEventRow>(),
    ]);

  let stage1 = 0;
  let stage2 = 0;
  let stage3 = 0;
  let stage4 = 0;
  for (const row of sessionStageRes.results ?? []) {
    const st = toSafeInt(row.max_stage);
    stage1 += 1;
    if (st >= 2) stage2 += 1;
    if (st >= 3) stage3 += 1;
    if (st >= 4) stage4 += 1;
  }
  const humanSessions = stage1;

  const pct = (num: number, den: number) =>
    den > 0 ? Math.round((num / den) * 1000) / 10 : 0;

  const funnel = [
    {
      step: 1 as const,
      key: 'landed' as const,
      labelZh: '全站访问',
      labelEn: 'Landed Sessions',
      sessions: stage1,
      pctOfTotal: stage1 > 0 ? 100 : 0,
      stepConversionPct: stage1 > 0 ? 100 : 0,
    },
    {
      step: 2 as const,
      key: 'engaged' as const,
      labelZh: '核心工具互动',
      labelEn: 'Engaged Tool / Filter',
      sessions: stage2,
      pctOfTotal: pct(stage2, stage1),
      stepConversionPct: pct(stage2, stage1),
    },
    {
      step: 3 as const,
      key: 'high_intent' as const,
      labelZh: '高意向复制 / 对比',
      labelEn: 'High-Intent Copy / Compare',
      sessions: stage3,
      pctOfTotal: pct(stage3, stage1),
      stepConversionPct: pct(stage3, stage2),
    },
    {
      step: 4 as const,
      key: 'conversion' as const,
      labelZh: '商业出站转化',
      labelEn: 'Commercial Outbound',
      sessions: stage4,
      pctOfTotal: pct(stage4, stage1),
      stepConversionPct: pct(stage4, stage3),
    },
  ];

  const pages = (pagesRes.results ?? []).map((p) => {
    const pv = toSafeInt(p.human_pv);
    const cl = toSafeInt(p.clicks);
    const cv = toSafeInt(p.conversions);
    return {
      path: p.path,
      channel: p.page_group || resolveChannel(p.path),
      edgeHits: null,
      humanPv: pv,
      moduleImpressions: toSafeInt(p.impressions),
      clicks: cl,
      ctr: pct(cl, pv),
      conversions: cv,
      cvr: pct(cv, pv),
    };
  });

  // Breakdowns: Countries
  const totalCountryReqs = Array.from(countryAgg.values()).reduce((a, b) => a + b, 0);
  const countries = Array.from(countryAgg.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([code, requests]) => ({
      code,
      name: COUNTRY_NAMES[code] || code,
      requests,
      sharePct: pct(requests, totalCountryReqs || edgeRequests),
      isTier1: TIER1_COUNTRY_CODES.has(code),
    }));

  // Breakdowns: Referrers
  const refRows = refRes.results ?? [];
  const totalRef = refRows.reduce((s, r) => s + toSafeInt(r.total), 0);
  const referrers = refRows.slice(0, 10).map((r) => {
    const [source, utmSource] = r.dim_key.split('||');
    const count = toSafeInt(r.total);
    return {
      source: source || 'Direct / None',
      utmSource: utmSource || null,
      count,
      sharePct: pct(count, totalRef),
    };
  });

  // Breakdowns: 6 real site locales (en, zh-CN, zh-TW, ja, ko, es)
  const localeCounts = new Map<string, number>();
  for (const loc of ALLOWED_LOCALES) localeCounts.set(loc, 0);
  for (const r of localeRes.results ?? []) {
    const loc = normalizeLocale(r.dim_key, '/');
    localeCounts.set(loc, (localeCounts.get(loc) || 0) + toSafeInt(r.total));
  }
  const totalLocale = Array.from(localeCounts.values()).reduce((a, b) => a + b, 0);
  const locales = Array.from(localeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([locale, count]) => ({
      locale,
      count,
      sharePct: pct(count, totalLocale),
    }));

  // Breakdowns: Devices
  const deviceCounts = new Map<string, number>([
    ['desktop', 0],
    ['mobile', 0],
    ['tablet', 0],
  ]);
  for (const r of deviceRes.results ?? []) {
    const dev = normalizeDevice(r.dim_key);
    deviceCounts.set(dev, (deviceCounts.get(dev) || 0) + toSafeInt(r.total));
  }
  const totalDevice = Array.from(deviceCounts.values()).reduce((a, b) => a + b, 0);
  const devices = Array.from(deviceCounts.entries()).map(([device, count]) => ({
    device,
    count,
    sharePct: pct(count, totalDevice),
  }));

  // Breakdowns: Partners
  const partnerRows = partnerRes.results ?? [];
  const totalPartners = partnerRows.reduce((s, r) => s + toSafeInt(r.total), 0);
  const partners = partnerRows.map((r) => {
    const count = toSafeInt(r.total);
    return {
      partner: r.dim_key,
      count,
      sharePct: pct(count, totalPartners),
    };
  });

  // Breakdowns: Top Events
  const eventRows = eventRes.results ?? [];
  const totalEvents = eventRows.reduce((s, r) => s + toSafeInt(r.total), 0);
  const topEvents = eventRows.map((r) => {
    const count = toSafeInt(r.total);
    const cls = classifyEvent(r.dim_key);
    const cat =
      cls.category === 'tool_interact'
        ? ('tool' as const)
        : cls.category === 'high_intent'
          ? ('high_intent' as const)
          : cls.category === 'conversion'
            ? ('conversion' as const)
            : ('other' as const);
    return {
      event: r.dim_key,
      category: cat,
      count,
      sharePct: pct(count, totalEvents),
    };
  });

  const liveFeed = (recentRes.results ?? []).map((r) => ({
    id: r.id,
    ts: new Date(toSafeInt(r.ts)).toISOString(),
    event: r.event,
    category: (['page_view', 'tool_interact', 'high_intent', 'conversion', 'other'].includes(r.category)
      ? r.category
      : 'other') as EventCategory,
    path: r.path,
    target: r.target,
    locale: r.locale || 'en',
    device: r.device || 'desktop',
    country: r.country || undefined,
  }));

  const isStale = maxUpdatedAt <= 0 || nowSec - maxUpdatedAt > EDGE_SYNC_STALE_SECONDS * 2;
  const healthStatus: 'live' | 'stale' | 'degraded' =
    !syncOk && edgeRequests === 0
      ? 'degraded'
      : !syncOk || isStale
        ? 'stale'
        : 'live';

  const payload = {
    range,
    syncedAt: maxUpdatedAt > 0 ? new Date(maxUpdatedAt * 1000).toISOString() : new Date().toISOString(),
    health: {
      status: healthStatus,
      ...(healthStatus !== 'live'
        ? { staleReason: '部分边缘数据同步延迟，当前展示最近缓存快照' }
        : {}),
    },
    kpis: {
      edgeRequests,
      cacheHitRate: pct(edgeCached, edgeRequests),
      edgePageViews,
      edgeUniques,
      humanPv,
      humanSessions,
      clicks,
      ctr: pct(clicks, humanPv),
      conversions,
      cvr: pct(conversions, humanSessions),
      deltas: {
        edgeRequests: calcDeltaPct(edgeRequests, prevEdgeRequests),
        edgePageViews: calcDeltaPct(edgePageViews, prevEdgePageViews),
        humanPv: calcDeltaPct(humanPv, prevHumanPv),
        clicks: calcDeltaPct(clicks, prevClicks),
        conversions: calcDeltaPct(conversions, prevConversions),
      },
    },
    trends: {
      edgeSeries,
      humanSeries,
    },
    funnel,
    pages,
    breakdowns: {
      countries,
      referrers,
      locales,
      devices,
      partners,
      topEvents,
    },
    httpHealth: {
      status2xx,
      status3xx,
      status4xx,
      status5xx,
      threats: edgeThreats,
      bytes: edgeBytes,
    },
    liveFeed,
  };

  return jsonResponse(payload, 200, 'no-store', corsHeaders);
}

const worker = {
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    const synced = await syncEdgeMetrics(env);
    const cache = getDefaultCache();
    const cacheKey = new Request(CACHE_KEY_URL, { method: 'GET' });
    const cacheControlEdge = `public, max-age=${EDGE_CACHE_TTL_SECONDS}, s-maxage=${EDGE_CACHE_TTL_SECONDS}`;

    if (synced) {
      const nowSec = Math.floor(Date.now() / 1000);
      const updatedAt = new Date(nowSec * 1000).toISOString();
      const [edgeStats, humanVisits24h] = await Promise.all([
        queryEdgeVisits24h(env.DB, nowSec),
        queryHumanVisits24h(env.DB, nowSec),
      ]);
      const freshResponse = jsonResponse(
        buildGetPayload(
          {
            edgeVisits24h: edgeStats.edgeVisits24h,
            humanVisits24h,
            edgeSyncAt: edgeStats.edgeSyncAt,
          },
          updatedAt
        ),
        200,
        cacheControlEdge
      );
      await cache.put(cacheKey, freshResponse);
    } else {
      await cache.delete(cacheKey);
    }
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';

    if (pathname.startsWith('/api/analytics')) {
      const analyticsCors = getAnalyticsCorsHeaders(request);
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: analyticsCors });
      }

      if (pathname === '/api/analytics/collect' && request.method === 'POST') {
        return handleCollect(request, env, ctx);
      }
      if (pathname === '/api/analytics/login' && request.method === 'POST') {
        return handleLogin(request, env);
      }
      if (pathname === '/api/analytics/session' && request.method === 'GET') {
        return handleSession(request, env);
      }
      if (pathname === '/api/analytics/logout' && request.method === 'POST') {
        return handleLogout(request);
      }
      if (pathname === '/api/analytics/overview' && request.method === 'GET') {
        return handleOverview(request, env);
      }
      return jsonResponse({ error: 'Not Found' }, 404, 'no-store', analyticsCors);
    }

    if (pathname !== '/api/visits-24h') {
      return jsonResponse({ error: 'Not Found' }, 404, 'no-store');
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: VISITS_CORS_HEADERS,
      });
    }

    const cache = getDefaultCache();
    const cacheKey = new Request(CACHE_KEY_URL, { method: 'GET' });
    const cacheControlEdge = `public, max-age=${EDGE_CACHE_TTL_SECONDS}, s-maxage=${EDGE_CACHE_TTL_SECONDS}`;

    if (request.method === 'GET') {
      const cached = await cache.match(cacheKey);
      if (cached) {
        return new Response(cached.body, {
          status: cached.status,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': cacheControlEdge,
            ...VISITS_CORS_HEADERS,
          },
        });
      }

      const nowSec = Math.floor(Date.now() / 1000);
      const metrics = await queryDualMetrics(env, nowSec);
      const updatedAt = new Date().toISOString();
      const response = jsonResponse(
        buildGetPayload(metrics, updatedAt),
        200,
        cacheControlEdge
      );
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    }

    if (request.method === 'POST') {
      const nowMs = Date.now();
      const nowSec = Math.floor(nowMs / 1000);
      const updatedAt = new Date(nowMs).toISOString();

      if (isAutomatedRequest(request)) {
        const metrics = await queryDualMetrics(env, nowSec);
        return jsonResponse(
          {
            ...buildGetPayload(metrics, updatedAt),
            counted: false,
          },
          200,
          'no-store'
        );
      }

      const bucketTs = Math.floor(nowMs / 60000) * 60;
      const cutoff24h = nowSec - WINDOW_SECONDS;
      const cutoff48h = nowSec - LEGACY_VISIT_RETENTION_SECONDS;

      const [, results] = await Promise.all([
        ensureEdgeBucketsFresh(env, nowSec),
        env.DB.batch<D1ResultRow>([
          env.DB.prepare(
            'INSERT INTO visit_buckets (bucket_ts, hits) VALUES (?1, 1) ON CONFLICT(bucket_ts) DO UPDATE SET hits = hits + 1'
          ).bind(bucketTs),
          env.DB.prepare(
            'SELECT COALESCE(SUM(hits), 0) AS total FROM visit_buckets WHERE bucket_ts >= ?1'
          ).bind(cutoff24h),
        ]),
      ]);

      const humanVisits24h = toSafeInt(results[1]?.results?.[0]?.total);
      const edgeStats = await queryEdgeVisits24h(env.DB, nowSec);
      const metrics: DualVisitsMetrics = {
        edgeVisits24h: edgeStats.edgeVisits24h,
        humanVisits24h,
        edgeSyncAt: edgeStats.edgeSyncAt,
      };

      if (Math.random() < 0.05) {
        ctx.waitUntil(
          env.DB.prepare('DELETE FROM visit_buckets WHERE bucket_ts < ?1')
            .bind(cutoff48h)
            .run()
        );
      }

      const freshGetResponse = jsonResponse(
        buildGetPayload(metrics, updatedAt),
        200,
        cacheControlEdge
      );
      ctx.waitUntil(cache.put(cacheKey, freshGetResponse));

      return jsonResponse(
        {
          ...buildGetPayload(metrics, updatedAt),
          counted: true,
        },
        200,
        'no-store'
      );
    }

    return jsonResponse({ error: 'Method Not Allowed' }, 405, 'no-store');
  },
};

export default worker;
