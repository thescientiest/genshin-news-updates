-- =========================================================
-- Teyvat Chronicle: PostgreSQL Database Schema
-- =========================================================

-- Create the articles table
CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    video_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    summary TEXT NOT NULL,
    body TEXT NOT NULL,
    key_takeaways TEXT[] NOT NULL DEFAULT '{}',
    tags TEXT[] NOT NULL DEFAULT '{}',
    thumbnail_url TEXT NOT NULL,
    video_published_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published'))
);

-- Index for fast homepage & paginated feed queries (status + publish date)
CREATE INDEX IF NOT EXISTS idx_articles_status_pub 
ON articles (status, video_published_at DESC);

-- Unique index for instant article slug lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_slug 
ON articles (slug);

-- GIN Index for fast array tag filtering (e.g. tags @> ARRAY['Snezhnaya'])
CREATE INDEX IF NOT EXISTS idx_articles_tags 
ON articles USING GIN (tags);
