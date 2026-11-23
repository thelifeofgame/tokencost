interface D1ResultRow {
  total?: number | string | null;
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

export interface Env {
  DB: D1Database;
}

const CACHE_KEY_URL = 'https://tokencostsai.com/api/visits-24h';
const EDGE_CACHE_TTL_SECONDS = 10;
const WINDOW_SECONDS = 86400;
const RETENTION_SECONDS = 172800; // 48 hours

const BOT_UA_REGEX =
  /(?:bot(?![a-z])|crawl|spider|slurp|mediapartners|bingpreview|facebookexternalhit|whatsapp|telegram|discord|twitterbot|linkedinbot|curl|wget|python|httpx|aiohttp|axios|node-fetch|undici|go-http-client|headless|playwright|puppeteer|selenium|phantomjs|lighthouse|pagespeed|gtmetrix|pingdom|monitor|uptime|statuscake|datadog|check_http|healthcheck|ahrefs|semrush|mj12|dotbot|yandex|baidu|sogou|bytespider|gptbot|claudebot|anthropic|ccbot|perplexity|applebot|petalbot)/i;

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

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

async function queryVisits24h(db: D1Database, nowSec: number): Promise<number> {
  const cutoffTs = nowSec - WINDOW_SECONDS;
  const row = await db
    .prepare('SELECT COALESCE(SUM(hits), 0) AS total FROM visit_buckets WHERE bucket_ts >= ?1')
    .bind(cutoffTs)
    .first<D1ResultRow>();
  const val = Number(row?.total ?? 0);
  return Number.isFinite(val) && val >= 0 ? Math.trunc(val) : 0;
}

function getDefaultCache(): Cache {
  return (caches as unknown as { default: Cache }).default;
}

function buildGetPayload(visits24h: number, updatedAt: string) {
  return {
    visits24h,
    windowHours: 24,
    updatedAt,
    mode: 'rolling-24h',
  };
}

const worker = {
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
      const visits24h = await queryVisits24h(env.DB, nowSec);
      const updatedAt = new Date().toISOString();
      const response = jsonResponse(
        buildGetPayload(visits24h, updatedAt),
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
        const visits24h = await queryVisits24h(env.DB, nowSec);
        return jsonResponse(
          {
            visits24h,
            windowHours: 24,
            updatedAt,
            counted: false,
          },
          200,
          'no-store'
        );
      }

      const bucketTs = Math.floor(nowMs / 60000) * 60;
      const cutoff24h = nowSec - WINDOW_SECONDS;
      const cutoff48h = nowSec - RETENTION_SECONDS;

      const results = await env.DB.batch<D1ResultRow>([
        env.DB.prepare(
          'INSERT INTO visit_buckets (bucket_ts, hits) VALUES (?1, 1) ON CONFLICT(bucket_ts) DO UPDATE SET hits = hits + 1'
        ).bind(bucketTs),
        env.DB.prepare(
          'SELECT COALESCE(SUM(hits), 0) AS total FROM visit_buckets WHERE bucket_ts >= ?1'
        ).bind(cutoff24h),
      ]);

      const rawTotal = results[1]?.results?.[0]?.total ?? 0;
      const visits24h = Number.isFinite(Number(rawTotal))
        ? Math.max(0, Math.trunc(Number(rawTotal)))
        : 0;

      // Low-frequency cleanup of buckets older than 48h
      if (Math.random() < 0.05) {
        ctx.waitUntil(
          env.DB.prepare('DELETE FROM visit_buckets WHERE bucket_ts < ?1')
            .bind(cutoff48h)
            .run()
        );
      }

      // Refresh edge cache so subsequent GET reflects the latest count immediately
      const freshGetResponse = jsonResponse(
        buildGetPayload(visits24h, updatedAt),
        200,
        cacheControlEdge
      );
      ctx.waitUntil(cache.put(cacheKey, freshGetResponse));

      return jsonResponse(
        {
          visits24h,
          windowHours: 24,
          updatedAt,
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
