interface D1ResultRow {
  total?: number | string | null;
}

interface EdgeBucketRow {
  hour_ts: number | string;
  page_views: number | string;
  updated_at: number | string;
}

interface EdgeFreshnessRow {
  max_updated_at: number | string | null;
  row_count: number | string | null;
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
  };
}

interface GraphQLResponse {
  data?: {
    viewer?: {
      zones?: Array<{
        httpRequests1hGroups?: GraphQLHourGroup[];
      }>;
    };
  };
  errors?: Array<{ message?: string }>;
}

export interface Env {
  DB: D1Database;
  CF_API_TOKEN?: string;
  CF_ZONE_ID?: string;
}

interface DualVisitsMetrics {
  edgeVisits24h: number;
  humanVisits24h: number;
  edgeSyncAt: string | null;
}

const CACHE_KEY_URL = 'https://tokencostsai.com/api/visits-24h';
const EDGE_CACHE_TTL_SECONDS = 10;
const WINDOW_SECONDS = 86400;
const RETENTION_SECONDS = 172800; // 48 hours
const EDGE_SYNC_STALE_SECONDS = 900; // 15 minutes
const EDGE_LOOKBACK_HOURS = 26;
const DEFAULT_CF_ZONE_ID = '2ed5d603d02f067e1fafd1ed33f0021d';
const CF_GRAPHQL_ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';

const BOT_UA_REGEX =
  /(?:bot(?![a-z])|crawl|spider|slurp|mediapartners|bingpreview|facebookexternalhit|whatsapp|telegram|discord|twitterbot|linkedinbot|curl|wget|python|httpx|aiohttp|axios|node-fetch|undici|go-http-client|headless|playwright|puppeteer|selenium|phantomjs|lighthouse|pagespeed|gtmetrix|pingdom|monitor|uptime|statuscake|datadog|check_http|healthcheck|ahrefs|semrush|mj12|dotbot|yandex|baidu|sogou|bytespider|gptbot|claudebot|anthropic|ccbot|perplexity|applebot|petalbot)/i;

const CORS_HEADERS: Record<string, string> = {
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

function jsonResponse(
  payload: unknown,
  status: number,
  cacheControl: string
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
      ...CORS_HEADERS,
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

async function syncEdgeBuckets(env: Env): Promise<boolean> {
  const token = env.CF_API_TOKEN?.trim();
  if (!token) {
    console.error('Missing CF_API_TOKEN secret; skipping edge_buckets sync');
    return false;
  }

  const rawZoneId = env.CF_ZONE_ID?.trim() || DEFAULT_CF_ZONE_ID;
  if (!/^[a-f0-9]{32}$/i.test(rawZoneId)) {
    console.error('Invalid CF_ZONE_ID format; skipping edge_buckets sync');
    return false;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const lookbackStartSec = Math.floor((nowSec - EDGE_LOOKBACK_HOURS * 3600) / 3600) * 3600;
  const datetimeGeq = new Date(lookbackStartSec * 1000)
    .toISOString()
    .replace(/\.\d{3}Z$/, 'Z');

  const query = `{
    viewer {
      zones(filter: { zoneTag: "${rawZoneId}" }) {
        httpRequests1hGroups(
          limit: 48,
          orderBy: [datetime_ASC],
          filter: { datetime_geq: "${datetimeGeq}" }
        ) {
          dimensions {
            datetime
          }
          sum {
            pageViews
            requests
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

  const groups = gql.data?.viewer?.zones?.[0]?.httpRequests1hGroups;
  if (!Array.isArray(groups) || groups.length === 0) {
    console.warn('Cloudflare GraphQL returned 0 httpRequests1hGroups');
    return false;
  }

  const updatedAtSec = Math.floor(Date.now() / 1000);
  const cutoffRetentionSec = updatedAtSec - RETENTION_SECONDS;
  const stmts: D1PreparedStatement[] = [];

  for (const group of groups) {
    const dt = group?.dimensions?.datetime;
    if (!dt) continue;
    const parsedMs = Date.parse(dt);
    if (!Number.isFinite(parsedMs)) continue;
    const hourTs = Math.floor(parsedMs / 1000);
    if (hourTs <= 0) continue;

    const pageViews = toSafeInt(group?.sum?.pageViews);
    const requests = toSafeInt(group?.sum?.requests);

    stmts.push(
      env.DB.prepare(
        `INSERT INTO edge_buckets (hour_ts, page_views, requests, updated_at)
         VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(hour_ts) DO UPDATE SET
           page_views = excluded.page_views,
           requests = excluded.requests,
           updated_at = excluded.updated_at`
      ).bind(hourTs, pageViews, requests, updatedAtSec)
    );
  }

  if (stmts.length === 0) {
    return false;
  }

  stmts.push(
    env.DB.prepare('DELETE FROM edge_buckets WHERE hour_ts < ?1').bind(cutoffRetentionSec)
  );

  await env.DB.batch(stmts);
  return true;
}

async function ensureEdgeBucketsFresh(env: Env, nowSec: number): Promise<void> {
  const statusRow = await env.DB.prepare(
    'SELECT MAX(updated_at) AS max_updated_at, COUNT(*) AS row_count FROM edge_buckets'
  ).first<EdgeFreshnessRow>();

  const rowCount = toSafeInt(statusRow?.row_count);
  const maxUpdatedAt = toSafeInt(statusRow?.max_updated_at);

  const needsSync =
    rowCount === 0 ||
    maxUpdatedAt <= 0 ||
    nowSec - maxUpdatedAt > EDGE_SYNC_STALE_SECONDS;

  if (!needsSync) return;

  if (!inflightEdgeSync) {
    inflightEdgeSync = syncEdgeBuckets(env)
      .catch((err) => {
        console.error('ensureEdgeBucketsFresh failed:', err);
        return false;
      })
      .finally(() => {
        inflightEdgeSync = null;
      });
  }

  await inflightEdgeSync;
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

const worker = {
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    const synced = await syncEdgeBuckets(env);
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

    if (pathname !== '/api/visits-24h') {
      return jsonResponse({ error: 'Not Found' }, 404, 'no-store');
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
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
            ...CORS_HEADERS,
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
      const cutoff48h = nowSec - RETENTION_SECONDS;

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

      // Low-frequency cleanup of buckets older than 48h
      if (Math.random() < 0.05) {
        ctx.waitUntil(
          env.DB.prepare('DELETE FROM visit_buckets WHERE bucket_ts < ?1')
            .bind(cutoff48h)
            .run()
        );
      }

      // Refresh edge cache so subsequent GET reflects the latest counts immediately
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
