-- Migration: Generated sites + bot hub coordination

CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  prompt TEXT,
  transcript TEXT,
  layout_json TEXT,
  html TEXT,
  css TEXT,
  status TEXT DEFAULT 'draft'
);

CREATE TABLE IF NOT EXISTS site_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL,
  ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  kind TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  content_type TEXT,
  size_bytes INTEGER,
  FOREIGN KEY(site_id) REFERENCES sites(id)
);

CREATE TABLE IF NOT EXISTS bot_agents (
  id TEXT PRIMARY KEY,
  ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  name TEXT UNIQUE NOT NULL,
  kind TEXT NOT NULL,
  endpoint TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS bot_tasks (
  id TEXT PRIMARY KEY,
  ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'queued',
  agent_name TEXT,
  input_json TEXT,
  output_json TEXT,
  error TEXT
);

