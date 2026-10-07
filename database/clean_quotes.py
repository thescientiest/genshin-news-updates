#!/usr/bin/env python3
"""
Clean escaped quotes and unicode escape artifacts from PostgreSQL articles.
"""

import os
import psycopg2
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

def get_db_url() -> str:
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

def sanitize_str(text: str) -> str:
    if not isinstance(text, str):
        return text
    # Remove literal backslash before double quote
    text = text.replace('\\"', '"')
    # Remove literal backslash before single quote
    text = text.replace("\\'", "'")
    # Replace literal \u00a0 with normal space
    text = text.replace('\\u00a0', ' ')
    # Replace non-breaking space char with normal space
    text = text.replace('\u00a0', ' ')
    return text

def sanitize_val(val):
    if isinstance(val, str):
        return sanitize_str(val)
    elif isinstance(val, list):
        return [sanitize_val(item) for item in val]
    return val

def main():
    db_url = get_db_url()
    if not db_url:
        print("DATABASE_URL not found!")
        return 1

    print("Connecting to database...")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    cur.execute("SELECT id, title, summary, key_takeaways, body FROM articles;")
    rows = cur.fetchall()

    updated_count = 0
    for aid, title, summary, takeaways, body in rows:
        new_title = sanitize_val(title)
        new_summary = sanitize_val(summary)
        new_takeaways = sanitize_val(takeaways)
        new_body = sanitize_val(body)

        if (new_title != title or new_summary != summary or 
            new_takeaways != takeaways or new_body != body):
            cur.execute("""
                UPDATE articles 
                SET title = %s, summary = %s, key_takeaways = %s, body = %s 
                WHERE id = %s;
            """, (new_title, new_summary, new_takeaways, new_body, aid))
            updated_count += 1
            print(f"✓ Fixed Article #{aid}: {title} -> {new_title}")

    conn.commit()
    print(f"\n🎉 Successfully sanitized {updated_count} articles in PostgreSQL!")
    cur.close()
    conn.close()
    return 0

if __name__ == "__main__":
    main()
