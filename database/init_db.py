#!/usr/bin/env python3
"""
Initialize PostgreSQL database schema and migrate existing Markdown articles.
"""

import os
import re
import json
from pathlib import Path
import psycopg2
from psycopg2.extras import execute_values

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
SCHEMA_FILE = BASE_DIR / "schema.sql"
ARTICLES_DIR = ROOT_DIR / "src" / "content" / "articles"

def get_db_url() -> str:
    """Retrieve DATABASE_URL from environment or .env files."""
    for env_file in [ROOT_DIR / ".env", ROOT_DIR / "pipeline" / ".env"]:
        if env_file.exists():
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("DATABASE_URL="):
                        val = line.split("=", 1)[1].strip().strip("'\"")
                        if val:
                            return val
    return os.getenv("DATABASE_URL", "")

def init_schema(conn):
    """Execute schema.sql to create tables and indexes."""
    with open(SCHEMA_FILE, "r", encoding="utf-8") as f:
        sql = f.read()
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()
    print("✓ Schema initialized successfully (tables and indexes created).")

def clean_str(text: str) -> str:
    if not text:
        return ""
    text = text.replace('\\"', '"').replace("\\'", "'")
    text = text.replace('\\u00a0', ' ').replace('\u00a0', ' ')
    return text.strip()

def parse_markdown_article(file_path: Path) -> dict:
    """Parse front matter and body from an existing markdown article."""
    content = file_path.read_text(encoding="utf-8")
    parts = content.split("---", 2)
    if len(parts) < 3:
        return None
    
    front_matter_raw = parts[1].strip()
    body_raw = parts[2].strip()
    
    meta = {}
    for line in front_matter_raw.split("\n"):
        if ":" in line:
            k, v = line.split(":", 1)
            k = k.strip()
            v = v.strip().strip("'\"")
            if k == "tags":
                try:
                    meta["tags"] = json.loads(v)
                except Exception:
                    meta["tags"] = ["Genshin Impact"]
            else:
                meta[k] = clean_str(v)
                
    title = clean_str(meta.get("title", file_path.stem))
    video_id = meta.get("videoId", "")
    date_str = meta.get("date", "2026-10-06T00:00:00+00:00")
    tags = [clean_str(t) for t in meta.get("tags", ["Genshin Impact"])]
    
    # Parse Summary
    summary = ""
    summary_match = re.search(r"## Summary\s*\n\n(.*?)(?=\n\n##|$)", body_raw, re.DOTALL)
    if summary_match:
        summary = clean_str(summary_match.group(1))
        
    # Parse Key Takeaways
    takeaways = []
    takeaways_match = re.search(r"## Key Takeaways\s*\n\n(.*?)(?=\n\n##|$)", body_raw, re.DOTALL)
    if takeaways_match:
        for line in takeaways_match.group(1).split("\n"):
            line = line.strip()
            if line.startswith("- "):
                takeaways.append(clean_str(line[2:]))
                
    # Parse Body ("What This Means for Players")
    body = ""
    body_match = re.search(r"## What This Means for Players\s*\n\n(.*)", body_raw, re.DOTALL)
    if body_match:
        body = clean_str(body_match.group(1))
    else:
        body = clean_str(body_raw)

    slug = file_path.stem
    thumbnail_url = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg" if video_id else ""

    return {
        "video_id": video_id,
        "title": title,
        "slug": slug,
        "summary": summary,
        "body": body,
        "key_takeaways": takeaways,
        "tags": tags,
        "thumbnail_url": thumbnail_url,
        "video_published_at": date_str,
        "status": "published"
    }

def migrate_existing_articles(conn):
    """Import articles from src/content/articles into the database."""
    if not ARTICLES_DIR.exists():
        return
    
    articles = []
    for file in ARTICLES_DIR.glob("*.md"):
        art = parse_markdown_article(file)
        if art and art.get("video_id"):
            articles.append(art)
            
    if not articles:
        print("No existing markdown articles found to migrate.")
        return

    insert_sql = """
    INSERT INTO articles (
        video_id, title, slug, summary, body, key_takeaways, tags, 
        thumbnail_url, video_published_at, status
    ) VALUES (
        %(video_id)s, %(title)s, %(slug)s, %(summary)s, %(body)s, 
        %(key_takeaways)s, %(tags)s, %(thumbnail_url)s, %(video_published_at)s, %(status)s
    )
    ON CONFLICT (video_id) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'published';
    """
    
    with conn.cursor() as cur:
        for art in articles:
            cur.execute(insert_sql, art)
    conn.commit()
    print(f"✓ Migrated {len(articles)} existing articles into PostgreSQL (all auto-published)!")

def main():
    db_url = get_db_url()
    if not db_url:
        print("\n[Notice] DATABASE_URL not found!")
        print("Please add DATABASE_URL=postgresql://... to your .env file, then rerun this script.")
        return 1

    print(f"Connecting to PostgreSQL database...")
    try:
        conn = psycopg2.connect(db_url)
        init_schema(conn)
        migrate_existing_articles(conn)
        conn.close()
        print("\n🎉 Database setup and migration complete!")
    except Exception as e:
        print(f"\n[Error] Database connection failed: {e}")
        return 1
    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())
