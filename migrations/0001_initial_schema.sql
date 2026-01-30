-- Migration: Create commands table
CREATE TABLE IF NOT EXISTS commands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  command TEXT,
  actions TEXT,
  files TEXT,
  commit_sha TEXT,
  intent_json TEXT,
  deployment_id TEXT,
  deployment_status TEXT,
  deployment_message TEXT
);
