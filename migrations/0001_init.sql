-- VoiceToWebsite.com D1 schema (MVP)
-- Apply via: wrangler d1 execute <DB_NAME> --file=uploads/voicetowebsite.com/migrations/0001_init.sql

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  email TEXT NOT NULL,
  plan TEXT NOT NULL,
  cadence TEXT NOT NULL,
  launch_discount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL, -- created|paid|generating|delivered|failed
  business_description TEXT,
  industry TEXT,
  style_preference TEXT,
  stripe_session_id TEXT,
  site_url TEXT,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  detail TEXT
);

