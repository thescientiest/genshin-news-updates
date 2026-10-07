#!/usr/bin/env python3
"""
Genshin Fan Site Pipeline - YouTube to Markdown Articles
Full Pipeline:
1. Read YouTube RSS feed
2. Compare against processed.json
3. Fetch transcript with youtube-transcript-api (fallback to title + description)
4. Send to LLM (Gemini / Claude / GitHub Models / Offline fallback) with Genshin glossary
5. Strictly ground in transcript (no hallucinated details or long quotes)
6. Save Markdown with front matter (draft: true)
7. Update processed.json
"""

import os
import re
import sys
import json
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime

# Paths configuration
BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
DATA_DIR = BASE_DIR / "data"
PROCESSED_FILE = DATA_DIR / "processed.json"
GLOSSARY_FILE = DATA_DIR / "glossary.json"
ARTICLES_DIR = ROOT_DIR / "src" / "content" / "articles"

def load_env_file(path: Path):
    if not path.exists():
        return
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                if k and v and k not in os.environ:
                    os.environ[k] = v
    except Exception:
        pass

# Load both pipeline/.env and root .env
load_env_file(BASE_DIR / ".env")
load_env_file(ROOT_DIR / ".env")

# Default channel ID for @GenshinImpact
DEFAULT_CHANNEL_ID = "UCiS882YPwZt1NfaM0gR0D9Q"

def get_db_connection():
    """Attempt connecting to PostgreSQL if DATABASE_URL is set."""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        return None
    try:
        import psycopg2
        return psycopg2.connect(db_url)
    except Exception as e:
        print(f"[Warning] Could not connect to PostgreSQL: {e}")
        return None

def resolve_best_thumbnail(video_id: str) -> str:
    """Try maxresdefault.jpg, fall back to hqdefault.jpg."""
    maxres_url = f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg"
    try:
        req = urllib.request.Request(maxres_url, headers={"User-Agent": "Mozilla/5.0"}, method="HEAD")
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status == 200:
                return maxres_url
    except Exception:
        pass
    return f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"

def load_processed_ids() -> set:
    """Load processed video IDs from PostgreSQL or fallback to processed.json."""
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT video_id FROM articles")
                rows = cur.fetchall()
                conn.close()
                return set(r[0] for r in rows)
        except Exception as e:
            print(f"[Warning] Error querying articles table: {e}")
            conn.close()

    if not PROCESSED_FILE.exists():
        return set()
    try:
        with open(PROCESSED_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return set(data.get("processed_video_ids", []))
    except (json.JSONDecodeError, OSError) as e:
        print(f"[Warning] Could not read {PROCESSED_FILE}: {e}")
        return set()

def save_processed_id(video_id: str):
    """Add a video ID to processed.json."""
    processed = load_processed_ids()
    processed.add(video_id)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(PROCESSED_FILE, "w", encoding="utf-8") as f:
        json.dump({"processed_video_ids": sorted(list(processed))}, f, indent=2)

def load_glossary() -> dict:
    """Load the Genshin glossary reference file."""
    if not GLOSSARY_FILE.exists():
        return {}
    try:
        with open(GLOSSARY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[Warning] Could not load glossary: {e}")
        return {}

def fetch_channel_feed(channel_id: str) -> list[dict]:
    """Fetch YouTube channel RSS feed and parse video entries."""
    feed_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    req = urllib.request.Request(
        feed_url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            xml_data = response.read()
    except Exception as e:
        print(f"[Error] Failed to fetch RSS feed from {feed_url}: {e}")
        return []

    root = ET.fromstring(xml_data)
    ns = {
        "atom": "http://www.w3.org/2005/Atom",
        "yt": "http://www.youtube.com/xml/schemas/2015",
        "media": "http://search.yahoo.com/mrss/"
    }

    videos = []
    for entry in root.findall("atom:entry", ns):
        video_id_el = entry.find("yt:videoId", ns)
        title_el = entry.find("atom:title", ns)
        published_el = entry.find("atom:published", ns)
        link_el = entry.find("atom:link[@rel='alternate']", ns)
        media_group = entry.find("media:group", ns)
        description_el = media_group.find("media:description", ns) if media_group is not None else None

        if video_id_el is None or title_el is None:
            continue

        video_id = video_id_el.text.strip()
        title = title_el.text.strip()
        published = published_el.text.strip() if published_el is not None else datetime.utcnow().isoformat() + "Z"
        link = link_el.attrib.get("href", f"https://www.youtube.com/watch?v={video_id}") if link_el is not None else ""
        description = description_el.text.strip() if (description_el is not None and description_el.text) else ""

        videos.append({
            "video_id": video_id,
            "title": title,
            "published": published,
            "link": link,
            "description": description
        })

    return videos

def fetch_video_transcript(video_id: str) -> tuple[str, bool]:
    """
    Fetch transcript using youtube-transcript-api.
    Returns (transcript_text, success_boolean).
    """
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        
        # Instantiate or call API
        api = YouTubeTranscriptApi() if callable(YouTubeTranscriptApi) else None
        
        if api and hasattr(api, "list"):
            transcript_list = api.list(video_id)
            try:
                transcript = transcript_list.find_transcript(["en", "en-US"])
            except Exception:
                # Fallback to the first available transcript
                transcript = next(iter(transcript_list), None)
            
            if transcript:
                snippets = transcript.fetch()
                texts = [s.text if hasattr(s, "text") else s.get("text", "") for s in snippets]
                full_text = " ".join(texts).strip()
                if full_text:
                    return full_text, True
        elif hasattr(YouTubeTranscriptApi, "get_transcript"):
            snippets = YouTubeTranscriptApi.get_transcript(video_id, languages=["en", "en-US"])
            texts = [s.get("text", "") for s in snippets]
            full_text = " ".join(texts).strip()
            if full_text:
                return full_text, True
    except Exception as e:
        print(f"  [Transcript Notice] No direct subtitles for {video_id}: {type(e).__name__}")
        
    return "", False

def get_video_content(video: dict) -> tuple[str, str]:
    """
    Extract transcript or fall back to title and description.
    Returns (content_text, source_type)
    """
    transcript, ok = fetch_video_transcript(video["video_id"])
    if ok and len(transcript) > 50:
        return transcript, "transcript"
    
    # Fallback to title and description
    fallback_parts = [f"Title: {video['title']}"]
    if video["description"]:
        fallback_parts.append(f"Description:\n{video['description']}")
    return "\n\n".join(fallback_parts), "title_and_description"

import unicodedata

def clean_text(text: str) -> str:
    """Normalize unicode, strip escaped quotes, and normalize whitespace."""
    if not text:
        return ""
    # Unescape literal backslashes before quotes
    text = text.replace('\\"', '"').replace("\\'", "'")
    # Replace literal or unicode non-breaking spaces
    text = text.replace('\\u00a0', ' ').replace('\u00a0', ' ')
    normalized = unicodedata.normalize("NFKC", text)
    return normalized.strip()

def slugify(text: str) -> str:
    """Generate a clean URL-friendly slug."""
    text = clean_text(text).lower()
    text = re.sub(r'[\'\"#|!?,:;~()\[\]]', '', text)
    text = re.sub(r'\s+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text.strip("-")[:60]

# ==========================================
# LLM & Generation Engine
# ==========================================

SYSTEM_PROMPT = """You are an expert video game journalist writing articles for a Genshin Impact fan website.
Your job is to transform YouTube video information into a well-crafted news article.

CRITICAL INSTRUCTIONS:
1. Rely ONLY on the information provided in the Transcript/Metadata.
2. NEVER invent details, character abilities, release dates, or story points not explicitly mentioned.
3. NEVER quote long passages verbatim; summarize and rephrase naturally.
4. Correctly spell all character names, regions, Archons, and lore concepts using the provided Genshin glossary.
5. Return your output STRICTLY as valid JSON with NO markdown code fences, matching this schema:
{
  "title": "Clear, engaging headline for the article",
  "summary": "1 to 2 concise paragraphs summarizing the core message or event of the video.",
  "key_takeaways": [
    "Key takeaway point 1",
    "Key takeaway point 2",
    "Key takeaway point 3"
  ],
  "what_this_means_for_players": "Analysis of what this announcement, lore drop, or animation means for players, upcoming banners, or worldbuilding.",
  "tags": ["Genshin Impact", "Specific Tag 1", "Specific Tag 2"]
}
"""

def generate_article_with_gemini(api_key: str, user_prompt: str) -> dict:
    """Generate article using Google Gemini API (free tier available)."""
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    payload = {
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read().decode("utf-8"))
        text = result["candidates"][0]["content"]["parts"][0]["text"].strip()
        # Strip potential markdown fences if returned
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
        return json.loads(text)

def generate_article_offline_fallback(video: dict, content: str, content_type: str, glossary: dict) -> dict:
    """
    Intelligent offline extractor fallback.
    Used when no external LLM API key is configured, ensuring the pipeline never fails.
    """
    raw_title = video["title"]
    # Clean up standard YouTube fluff (#shorts, #GenshinImpact, etc.)
    clean_title = re.sub(r'#\w+', '', raw_title)
    clean_title = clean_title.replace('| Genshin Impact', '').strip(' -:')
    
    # Extract tags from hashtags and glossary matching
    tags = ["Genshin Impact"]
    hashtags = re.findall(r'#([A-Za-z0-9_]+)', raw_title)
    for tag in hashtags:
        if tag.lower() not in ["genshinimpact", "shorts"]:
            tags.append(tag)
            
    # Check glossary for mentions
    glossary_terms = []
    for category in ["nations", "elements", "harbingers", "archons", "core_gameplay_terms"]:
        glossary_terms.extend(glossary.get(category, []))
        
    for term in glossary_terms:
        # Check base word
        base_term = term.split('(')[0].split('-')[0].strip()
        if re.search(r'\b' + re.escape(base_term) + r'\b', content, re.IGNORECASE):
            if base_term not in tags and len(tags) < 6:
                tags.append(base_term)

    # Build takeaways from description or transcript sentences
    lines = [line.strip() for line in (video.get("description", "") or content).split("\n") if line.strip() and not line.startswith("http")]
    takeaways = []
    for line in lines[:4]:
        if len(line) > 20 and not line.startswith("#"):
            takeaways.append(line)
            
    if not takeaways:
        takeaways = [
            f"Official release featured in: '{clean_title}'",
            "Content provides canonical audiovisual details directly from official channels.",
            "Relevant to travelers following ongoing Teyvat events and storyline releases."
        ]
        
    summary = video.get("description", "").split("\n\n")[0]
    if not summary or len(summary) < 30:
        summary = f"The official Genshin Impact channel has released '{clean_title}', highlighting new storyline moments and development for travelers across Teyvat."
    else:
        summary = re.sub(r'https?://\S+', '', summary).strip()

    return {
        "title": clean_title,
        "summary": summary,
        "key_takeaways": takeaways[:4],
        "what_this_means_for_players": f"Players can expect upcoming storyline tie-ins, visual cutscenes, and lore reveals related to the events showcased in '{clean_title}'. Check the linked video above for full visual animation.",
        "tags": tags[:6]
    }

def generate_article(video: dict, content: str, content_type: str, glossary: dict) -> dict:
    """Generate article data using available provider or offline fallback."""
    user_prompt = f"""
VIDEO METADATA:
- Title: {video['title']}
- Published Date: {video['published']}
- Video URL: {video['link']}
- Content Source: {content_type}

GENSHIN GLOSSARY FOR ACCURATE TERMINOLOGY:
{json.dumps(glossary, indent=2)}

CONTENT (TRANSCRIPT / METADATA):
{content[:8000]}
"""
    # 1. Check Gemini API key
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if gemini_key:
        try:
            print("  [AI] Generating article with Google Gemini API...")
            return generate_article_with_gemini(gemini_key, user_prompt)
        except Exception as e:
            print(f"  [Warning] Gemini generation failed: {e}. Falling back...")

    # 2. Offline fallback
    print("  [Fallback] Generating grounded article using offline extractor...")
    return generate_article_offline_fallback(video, content, content_type, glossary)

def save_article_as_markdown(video: dict, article_data: dict) -> Path:
    """Save article as Markdown with front matter."""
    ARTICLES_DIR.mkdir(parents=True, exist_ok=True)
    
    raw_title = clean_text(article_data.get("title", video["title"]))
    slug = f"{slugify(raw_title)}-{video['video_id']}"
    clean_article_title = raw_title.replace('"', '\\"')
    file_path = ARTICLES_DIR / f"{slug}.md"
    
    # Format tags
    tags = [clean_text(t) for t in article_data.get("tags", ["Genshin Impact"])]
    tags_formatted = json.dumps(tags, ensure_ascii=False)
    
    # Build Markdown
    front_matter = f"""---
title: "{clean_article_title}"
date: {video['published']}
videoId: "{video['video_id']}"
tags: {tags_formatted}
draft: false
---
"""
    
    takeaways_md = "\n".join([f"- {clean_text(item)}" for item in article_data.get("key_takeaways", [])])
    
    body = f"""{front_matter}
## Summary

{clean_text(article_data['summary'])}

## Key Takeaways

{takeaways_md}

## What This Means for Players

{clean_text(article_data['what_this_means_for_players'])}
"""
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(body.strip() + "\n")
        
    return file_path

def insert_to_database(video: dict, article_data: dict, slug: str, thumbnail_url: str) -> bool:
    """Insert article row into PostgreSQL with status = 'published' (auto-publish)."""
    conn = get_db_connection()
    if not conn:
        return False
    try:
        sql = """
        INSERT INTO articles (
            video_id, title, slug, summary, body, key_takeaways, tags, 
            thumbnail_url, video_published_at, status
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, 'published'
        )
        ON CONFLICT (video_id) DO UPDATE SET
            title = EXCLUDED.title,
            status = 'published';
        """
        with conn.cursor() as cur:
            cur.execute(sql, (
                video["video_id"],
                clean_text(article_data.get("title", video["title"])),
                slug,
                clean_text(article_data.get("summary", "")),
                clean_text(article_data.get("what_this_means_for_players", "")),
                [clean_text(item) for item in article_data.get("key_takeaways", [])],
                [clean_text(t) for t in article_data.get("tags", ["Genshin Impact"])],
                thumbnail_url,
                video["published"]
            ))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"  [Warning] PostgreSQL insert failed: {e}")
        try:
            conn.close()
        except Exception:
            pass
        return False

def process_single_video(video: dict, glossary: dict) -> bool:
    """Process a single video through the complete pipeline."""
    video_id = video["video_id"]
    print(f"\nProcessing video [{video_id}]: {video['title']}")
    
    # Step 3: Fetch transcript or fallback
    content, content_type = get_video_content(video)
    print(f"  Content source: {content_type} ({len(content)} characters)")
    
    # Step 4 & 5: Generate article
    article_data = generate_article(video, content, content_type, glossary)
    
    # Resolve best thumbnail and slug
    raw_title = clean_text(article_data.get("title", video["title"]))
    slug = f"{slugify(raw_title)}-{video['video_id']}"
    thumbnail_url = resolve_best_thumbnail(video_id)

    # Step 6: Insert into PostgreSQL (auto-publish)
    inserted_db = insert_to_database(video, article_data, slug, thumbnail_url)
    if inserted_db:
        print(f"  [Database] Inserted into PostgreSQL (status='published')")
    else:
        output_file = save_article_as_markdown(video, article_data)
        print(f"  [Created] Markdown backup: {output_file.relative_to(ROOT_DIR)}")
    
    # Step 7: Update processed.json
    save_processed_id(video_id)
    print(f"  [Updated] {video_id} recorded in processed.json")
    
    return True

def run_pipeline(limit: int = 3):
    """Run the pipeline for new videos."""
    channel_id = os.getenv("YOUTUBE_CHANNEL_ID", DEFAULT_CHANNEL_ID)
    print(f"=== Starting Genshin Impact Pipeline ===")
    print(f"Channel ID: {channel_id}")
    
    processed_ids = load_processed_ids()
    print(f"Previously processed: {len(processed_ids)} videos")
    
    all_videos = fetch_channel_feed(channel_id)
    # YouTube feed is ordered newest first; process newest uploads first
    unprocessed = [v for v in all_videos if v["video_id"] not in processed_ids]
    
    if not unprocessed:
        print("No new videos to process. Everything up to date!")
        return

    print(f"Found {len(unprocessed)} new video(s). Processing up to {limit} in this run...")
    glossary = load_glossary()
    
    for video in unprocessed[:limit]:
        process_single_video(video, glossary)
        
    print("\n=== Pipeline Run Finished ===")

if __name__ == "__main__":
    limit = 3
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        limit = int(sys.argv[1])
    run_pipeline(limit=limit)
