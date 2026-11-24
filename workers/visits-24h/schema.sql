-- Legacy /api/visits-24h 1-minute human visit buckets (48h retention)
CREATE TABLE IF NOT EXISTS visit_buckets (
  bucket_ts INTEGER PRIMARY KEY,
  hits INTEGER NOT NULL DEFAULT 0
);

-- Cloudflare Edge hourly buckets (35-day retention)
CREATE TABLE IF NOT EXISTS edge_buckets (
  hour_ts INTEGER PRIMARY KEY,
  page_views INTEGER NOT NULL DEFAULT 0,
  requests INTEGER NOT NULL DEFAULT 0,
  cached_requests INTEGER NOT NULL DEFAULT 0,
  threats INTEGER NOT NULL DEFAULT 0,
  bytes INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

-- Cloudflare Edge daily stats (35-day retention, includes countries & HTTP status breakdown)
CREATE TABLE IF NOT EXISTS edge_daily_stats (
  date_key TEXT PRIMARY KEY,
  requests INTEGER NOT NULL DEFAULT 0,
  page_views INTEGER NOT NULL DEFAULT 0,
  uniques INTEGER NOT NULL DEFAULT 0,
  cached_requests INTEGER NOT NULL DEFAULT 0,
  threats INTEGER NOT NULL DEFAULT 0,
  bytes INTEGER NOT NULL DEFAULT 0,
  countries_json TEXT NOT NULL DEFAULT '[]',
  status_json TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL
);

-- First-party human analytics: hourly rollup (35-day retention)
CREATE TABLE IF NOT EXISTS analytics_hourly (
  hour_ts INTEGER PRIMARY KEY,
  human_pv INTEGER NOT NULL DEFAULT 0,
  unique_sessions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  engaged_sessions INTEGER NOT NULL DEFAULT 0
);

-- First-party human analytics: daily rollup (90-day retention)
CREATE TABLE IF NOT EXISTS analytics_daily (
  date_key TEXT PRIMARY KEY,
  human_pv INTEGER NOT NULL DEFAULT 0,
  unique_sessions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  engaged_sessions INTEGER NOT NULL DEFAULT 0
);

-- First-party page performance daily rollup
CREATE TABLE IF NOT EXISTS analytics_page_daily (
  date_key TEXT NOT NULL,
  path TEXT NOT NULL,
  page_group TEXT NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  human_pv INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (date_key, path)
);

-- First-party dimension daily rollup (referrer, utm, locale, device, event, partner)
CREATE TABLE IF NOT EXISTS analytics_dim_daily (
  date_key TEXT NOT NULL,
  dim_type TEXT NOT NULL,
  dim_key TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (date_key, dim_type, dim_key)
);

-- Session deduplication & 4-stage funnel progression
-- scope_type: 'h' (hourly, scope_val = hour_ts string) | 'd' (daily, scope_val = YYYY-MM-DD)
CREATE TABLE IF NOT EXISTS analytics_session_seen (
  scope_type TEXT NOT NULL,
  scope_val TEXT NOT NULL,
  sid TEXT NOT NULL,
  scope_ts INTEGER NOT NULL,
  max_stage INTEGER NOT NULL DEFAULT 1,
  first_seen_ts INTEGER NOT NULL,
  last_seen_ts INTEGER NOT NULL,
  PRIMARY KEY (scope_type, scope_val, sid)
);
CREATE INDEX IF NOT EXISTS idx_session_seen_scope_ts ON analytics_session_seen(scope_type, scope_ts);

-- Recent verified human events stream (trimmed to latest 100 rows)
CREATE TABLE IF NOT EXISTS analytics_recent_events (
  id TEXT PRIMARY KEY,
  ts INTEGER NOT NULL,
  event TEXT NOT NULL,
  category TEXT NOT NULL,
  path TEXT NOT NULL,
  target TEXT,
  locale TEXT,
  device TEXT,
  country TEXT
);
CREATE INDEX IF NOT EXISTS idx_recent_events_ts ON analytics_recent_events(ts DESC);

-- Login rate limiting by hashed IP
CREATE TABLE IF NOT EXISTS analytics_login_attempts (
  ip_hash TEXT PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL,
  locked_until INTEGER NOT NULL DEFAULT 0
);
