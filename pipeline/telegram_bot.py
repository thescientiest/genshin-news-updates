#!/usr/bin/env python3
"""
Teyvat Chronicle Interactive Telegram Bot.
Allows users to query AWS RDS PostgreSQL database directly via Telegram commands:
- /start: Welcome & guide
- /latest: Show 3 newest published articles with website links
- /search <term>: Search articles in database
- /website: Link to live web application
"""

import os
import sys
import json
import time
import urllib.request
import urllib.parse
from pathlib import Path
import psycopg2

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

def load_env():
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

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
DB_URL = os.getenv("DATABASE_URL", "")
SITE_URL = os.getenv("SITE_URL", "https://genshin-news-updates.vercel.app").rstrip("/")

def send_telegram_api(method: str, payload: dict) -> dict:
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/{method}"
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"[Bot Error] {method}: {e}")
        return {"ok": False, "error": str(e)}

def escape_html(text: str) -> str:
    if not text:
        return ""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def get_db_connection():
    if not DB_URL:
        return None
    try:
        return psycopg2.connect(DB_URL, connect_timeout=8)
    except Exception as e:
        print(f"[DB Error] {e}")
        return None

def handle_start(chat_id: int, user_first_name: str):
    welcome_text = (
        f"✦ <b>Welcome to Teyvat Chronicle, {escape_html(user_first_name)}!</b> ✦\n\n"
        "I am your automated Genshin Impact dispatch assistant. I continuously track official broadcasts, "
        "synthesize lore drops with AI, and publish articles directly to our cloud database.\n\n"
        "<b>Available Commands:</b>\n"
        "📜 <b>/latest</b> — Read the 3 most recent dispatches\n"
        "🔍 <b>/search &lt;term&gt;</b> — Search database for a character or event\n"
        "🌐 <b>/website</b> — Visit the live Next.js web application\n"
        "ℹ️ <b>/help</b> — Display this instruction menu\n\n"
        "<i>Enjoy the journey across Teyvat!</i>"
    )
    reply_markup = {
        "inline_keyboard": [
            [
                {"text": "📜 View Latest Articles", "callback_data": "cmd_latest"},
                {"text": "🌐 Open Website", "url": SITE_URL}
            ]
        ]
    }
    send_telegram_api("sendMessage", {
        "chat_id": chat_id,
        "text": welcome_text,
        "parse_mode": "HTML",
        "reply_markup": reply_markup
    })

def handle_latest(chat_id: int):
    conn = get_db_connection()
    if not conn:
        send_telegram_api("sendMessage", {
            "chat_id": chat_id,
            "text": "⚠️ Database connection error. Please try again later.",
            "parse_mode": "HTML"
        })
        return

    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT title, summary, slug, thumbnail_url, video_published_at 
                FROM articles 
                WHERE status = 'published' 
                ORDER BY video_published_at DESC 
                LIMIT 3;
            """)
            rows = cur.fetchall()
        conn.close()

        if not rows:
            send_telegram_api("sendMessage", {
                "chat_id": chat_id,
                "text": "No published articles found in the archives.",
                "parse_mode": "HTML"
            })
            return

        send_telegram_api("sendMessage", {
            "chat_id": chat_id,
            "text": "📜 <b>Top 3 Latest Genshin Impact Dispatches:</b>",
            "parse_mode": "HTML"
        })

        for title, summary, slug, thumb, pub_date in rows:
            article_url = f"{SITE_URL}/articles/{slug}"
            short_summary = (summary[:200] + "...") if summary and len(summary) > 200 else summary
            caption = (
                f"<b>{escape_html(title)}</b>\n\n"
                f"{escape_html(short_summary)}\n"
            )
            reply_markup = {
                "inline_keyboard": [
                    [{"text": "📖 Read Breakdown", "url": article_url}]
                ]
            }

            if thumb:
                send_telegram_api("sendPhoto", {
                    "chat_id": chat_id,
                    "photo": thumb,
                    "caption": caption,
                    "parse_mode": "HTML",
                    "reply_markup": reply_markup
                })
            else:
                send_telegram_api("sendMessage", {
                    "chat_id": chat_id,
                    "text": caption,
                    "parse_mode": "HTML",
                    "reply_markup": reply_markup
                })
    except Exception as e:
        print(f"[Latest Error] {e}")

def handle_search(chat_id: int, query: str):
    if not query.strip():
        send_telegram_api("sendMessage", {
            "chat_id": chat_id,
            "text": "Please provide a search term. Example: <code>/search snezhnaya</code> or <code>/search paimon</code>",
            "parse_mode": "HTML"
        })
        return

    conn = get_db_connection()
    if not conn:
        send_telegram_api("sendMessage", {
            "chat_id": chat_id,
            "text": "⚠️ Database temporarily unreachable.",
            "parse_mode": "HTML"
        })
        return

    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT title, summary, slug, thumbnail_url 
                FROM articles 
                WHERE status = 'published' AND (
                    title ILIKE %s OR summary ILIKE %s OR body ILIKE %s
                )
                ORDER BY video_published_at DESC 
                LIMIT 3;
            """, (f"%{query}%", f"%{query}%", f"%{query}%"))
            rows = cur.fetchall()
        conn.close()

        if not rows:
            send_telegram_api("sendMessage", {
                "chat_id": chat_id,
                "text": f"🔍 No articles found matching '<b>{escape_html(query)}</b>'. Try another keyword!",
                "parse_mode": "HTML"
            })
            return

        send_telegram_api("sendMessage", {
            "chat_id": chat_id,
            "text": f"🔍 <b>Found {len(rows)} article(s) matching '{escape_html(query)}':</b>",
            "parse_mode": "HTML"
        })

        for title, summary, slug, thumb in rows:
            article_url = f"{SITE_URL}/articles/{slug}"
            short_summary = (summary[:180] + "...") if summary and len(summary) > 180 else summary
            caption = (
                f"<b>{escape_html(title)}</b>\n\n"
                f"{escape_html(short_summary)}"
            )
            reply_markup = {
                "inline_keyboard": [
                    [{"text": "📖 Read Article", "url": article_url}]
                ]
            }
            send_telegram_api("sendMessage", {
                "chat_id": chat_id,
                "text": caption,
                "parse_mode": "HTML",
                "reply_markup": reply_markup
            })
    except Exception as e:
        print(f"[Search Error] {e}")

def run_bot_polling():
    """Long-polling loop for receiving commands in Telegram."""
    print(f"=== Teyvat Chronicle Telegram Bot Running ===")
    print("Press Ctrl+C to stop.")
    offset = 0

    while True:
        try:
            url = f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates?offset={offset}&timeout=20"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            if data.get("ok"):
                for update in data.get("result", []):
                    offset = update["update_id"] + 1

                    # Handle Callback Query (inline buttons)
                    if "callback_query" in update:
                        cb = update["callback_query"]
                        cb_data = cb.get("data")
                        cb_chat_id = cb.get("message", {}).get("chat", {}).get("id")
                        if cb_data == "cmd_latest" and cb_chat_id:
                            handle_latest(cb_chat_id)
                        continue

                    # Handle Messages
                    message = update.get("message", {})
                    text = message.get("text", "").strip()
                    chat_id = message.get("chat", {}).get("id")
                    user = message.get("from", {})
                    first_name = user.get("first_name", "Traveler")

                    if not text or not chat_id:
                        continue

                    print(f"[{first_name} ({chat_id})]: {text}")

                    if text.startswith("/start"):
                        handle_start(chat_id, first_name)
                    elif text.startswith("/latest"):
                        handle_latest(chat_id)
                    elif text.startswith("/search"):
                        query = text[7:].strip()
                        handle_search(chat_id, query)
                    elif text.startswith("/website"):
                        send_telegram_api("sendMessage", {
                            "chat_id": chat_id,
                            "text": f"🌐 Visit our live website here:\n{SITE_URL}",
                            "disable_web_page_preview": False
                        })
                    elif text.startswith("/help"):
                        handle_start(chat_id, first_name)
        except KeyboardInterrupt:
            print("\nBot stopped by user.")
            break
        except Exception as e:
            print(f"Polling warning: {e}")
            time.sleep(3)

if __name__ == "__main__":
    run_bot_polling()
