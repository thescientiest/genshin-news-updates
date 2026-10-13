#!/usr/bin/env python3
"""
Telegram Broadcast & Notification Engine for Genshin Impact Fan Website.
Sends rich announcements with thumbnails, key takeaways, and web links
whenever new articles are published.
"""

import os
import json
import urllib.request
import urllib.parse
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

def load_env():
    """Load environment variables from pipeline/.env or root .env."""
    for path in [BASE_DIR / ".env", ROOT_DIR / ".env"]:
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip("'\"")
                        if k and k not in os.environ:
                            os.environ[k] = v

load_env()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8986555183:AAGnCD7ou8Z0yBik2C8VKoC3HIF0CWRhwFk")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
SITE_URL = os.getenv("SITE_URL", "https://genshin-news-updates.vercel.app")

def get_latest_chat_id() -> str:
    """Fetch the most recent chat ID from Telegram bot updates if not configured."""
    global TELEGRAM_CHAT_ID
    if TELEGRAM_CHAT_ID:
        return TELEGRAM_CHAT_ID

    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("ok") and data.get("result"):
                # Grab the most recent message's chat ID
                last_update = data["result"][-1]
                chat = last_update.get("message", {}).get("chat", {}) or last_update.get("channel_post", {}).get("chat", {})
                chat_id = str(chat.get("id", ""))
                if chat_id:
                    return chat_id
    except Exception as e:
        print(f"[Telegram] Error fetching chat ID: {e}")
    return ""

def escape_html(text: str) -> str:
    """Escape special HTML characters for Telegram HTML mode."""
    if not text:
        return ""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def send_telegram_article_broadcast(article_data: dict, slug: str, thumbnail_url: str = "") -> bool:
    """
    Broadcast a newly published article to Telegram.
    Includes photo thumbnail, title, summary, key takeaways, and read button.
    """
    token = os.getenv("TELEGRAM_BOT_TOKEN", TELEGRAM_BOT_TOKEN)
    chat_id = os.getenv("TELEGRAM_CHAT_ID") or get_latest_chat_id()

    if not token:
        print("[Telegram] Bot token missing. Skipping notification.")
        return False

    if not chat_id:
        print("[Telegram] No TELEGRAM_CHAT_ID found. Please send a message to @giupdatesbot first.")
        return False

    title = escape_html(article_data.get("title", "New Dispatch"))
    summary = escape_html(article_data.get("summary", ""))
    takeaways = article_data.get("key_takeaways", [])
    tags = article_data.get("tags", ["Genshin Impact"])
    site_base = os.getenv("SITE_URL", SITE_URL).rstrip("/")
    article_url = f"{site_base}/articles/{slug}"

    # Build takeaways list
    takeaways_text = ""
    if takeaways:
        items = [f"• {escape_html(t)}" for t in takeaways[:3]]
        takeaways_text = "\n" + "\n".join(items)

    # Build tags
    tags_formatted = " ".join([f"#{t.replace(' ', '')}" for t in tags[:4]])

    # Build caption (limit to 1024 chars for Telegram photo captions)
    caption = f"✦ <b>NEW GENSHIN IMPACT DISPATCH</b> ✦\n\n"
    caption += f"<b>{title}</b>\n\n"
    if summary:
        short_summary = summary[:250] + ("..." if len(summary) > 250 else "")
        caption += f"📝 <b>Summary:</b>\n{short_summary}\n\n"
    if takeaways_text:
        caption += f"📌 <b>Key Takeaways:</b>{takeaways_text}\n\n"
    if tags_formatted:
        caption += f"🏷️ {tags_formatted}"

    if len(caption) > 1000:
        caption = caption[:997] + "..."

    # Inline button linking to website article
    reply_markup = {
        "inline_keyboard": [
            [
                {"text": "📖 Read Full Article", "url": article_url}
            ]
        ]
    }

    # Try sending photo first
    if thumbnail_url:
        endpoint = f"https://api.telegram.org/bot{token}/sendPhoto"
        payload = {
            "chat_id": chat_id,
            "photo": thumbnail_url,
            "caption": caption,
            "parse_mode": "HTML",
            "reply_markup": reply_markup
        }
        try:
            req = urllib.request.Request(
                endpoint,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                if result.get("ok"):
                    print(f"✓ Telegram broadcast sent successfully to chat [{chat_id}]!")
                    return True
        except Exception as e:
            print(f"[Telegram] Failed to send photo: {e}. Falling back to text message...")

    # Fallback to sendMessage
    endpoint = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": caption,
        "parse_mode": "HTML",
        "reply_markup": reply_markup,
        "disable_web_page_preview": False
    }
    try:
        req = urllib.request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            if result.get("ok"):
                print(f"✓ Telegram text broadcast sent to chat [{chat_id}]!")
                return True
    except Exception as e:
        print(f"[Telegram] Failed to send message: {e}")
        return False

    return False

if __name__ == "__main__":
    # Test send with latest article from DB
    import psycopg2
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL missing.")
        exit(1)
    
    print("Testing Telegram broadcast with latest article from database...")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("SELECT title, summary, key_takeaways, tags, slug, thumbnail_url FROM articles ORDER BY video_published_at DESC LIMIT 1;")
    row = cur.fetchone()
    cur.close()
    conn.close()

    if row:
        title, summary, takeaways, tags, slug, thumb = row
        article_sample = {
            "title": title,
            "summary": summary,
            "key_takeaways": takeaways,
            "tags": tags
        }
        send_telegram_article_broadcast(article_sample, slug, thumb)
    else:
        print("No articles found in DB to test.")
