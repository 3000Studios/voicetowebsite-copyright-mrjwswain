-- Migration: Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT
);
