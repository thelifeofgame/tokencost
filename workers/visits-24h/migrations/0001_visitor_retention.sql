CREATE TABLE IF NOT EXISTS analytics_visitors (
  vid TEXT PRIMARY KEY,
  first_date TEXT NOT NULL,
  last_date TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_analytics_visitors_first_date ON analytics_visitors(first_date);
CREATE INDEX IF NOT EXISTS idx_analytics_visitors_last_date ON analytics_visitors(last_date);

CREATE TABLE IF NOT EXISTS analytics_visitor_days (
  vid TEXT NOT NULL REFERENCES analytics_visitors(vid) ON DELETE CASCADE,
  date_key TEXT NOT NULL,
  PRIMARY KEY (vid, date_key)
);
CREATE INDEX IF NOT EXISTS idx_analytics_visitor_days_date ON analytics_visitor_days(date_key);
