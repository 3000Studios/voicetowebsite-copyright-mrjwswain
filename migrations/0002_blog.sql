PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content_html TEXT NOT NULL,
  category TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  keywords_json TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  og_image TEXT,
  related_slugs_json TEXT NOT NULL DEFAULT '[]',
  source_mode TEXT NOT NULL, -- original|sourced
  citations_json TEXT NOT NULL DEFAULT '[]',
  quality_score INTEGER NOT NULL DEFAULT 0,
  published_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
