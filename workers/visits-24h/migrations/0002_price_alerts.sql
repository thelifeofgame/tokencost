CREATE TABLE IF NOT EXISTS price_snapshot (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  updated_at TEXT NOT NULL,
  document TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS price_changes (
  version TEXT NOT NULL,
  model_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  field TEXT NOT NULL,
  old_value REAL,
  new_value REAL,
  change_percent REAL,
  found_at TEXT NOT NULL,
  PRIMARY KEY (version, model_id, field)
);
CREATE INDEX IF NOT EXISTS idx_price_changes_found ON price_changes(found_at);

CREATE TABLE IF NOT EXISTS alert_subscriptions (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL CHECK (state IN ('pending', 'confirmed', 'unsubscribed')),
  locale TEXT NOT NULL,
  models TEXT NOT NULL DEFAULT '[]',
  pending_models TEXT,
  pending_locale TEXT,
  source TEXT NOT NULL,
  confirmation_hash TEXT UNIQUE,
  confirmation_expires INTEGER,
  requested_at INTEGER NOT NULL,
  confirmed_at INTEGER,
  unsubscribed_at INTEGER,
  unsubscribe_nonce TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_alert_subscriptions_cleanup ON alert_subscriptions(state, unsubscribed_at);

CREATE TABLE IF NOT EXISTS alert_rate_buckets (
  digest TEXT NOT NULL,
  hour INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (digest, hour)
);

CREATE TABLE IF NOT EXISTS alert_mail_queue (
  subscription_id TEXT NOT NULL REFERENCES alert_subscriptions(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('alert', 'digest')),
  batch_key TEXT NOT NULL,
  document TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'queued' CHECK (state IN ('queued', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (subscription_id, kind, batch_key)
);
CREATE INDEX IF NOT EXISTS idx_alert_mail_queue_due ON alert_mail_queue(state, next_attempt);

CREATE TRIGGER IF NOT EXISTS analytics_subscription_confirmed
AFTER UPDATE OF state ON alert_subscriptions
WHEN OLD.state <> 'confirmed' AND NEW.state = 'confirmed'
BEGIN
  INSERT INTO analytics_dim_daily (date_key, dim_type, dim_key, count)
  VALUES (date(NEW.confirmed_at, 'unixepoch'), 'event', 'subscribe_confirmed', 1)
  ON CONFLICT(date_key, dim_type, dim_key) DO UPDATE SET count = count + 1;
END;
