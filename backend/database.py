import sqlite3
import os
from datetime import datetime, timezone

db_env = os.environ.get("DATABASE_URL", "")
if db_env.startswith("sqlite:///"):
    DB_PATH = db_env.replace("sqlite:///", "")
elif db_env:
    DB_PATH = db_env
else:
    DB_PATH = os.path.join(os.path.dirname(__file__), "news.db")

def get_connection():
    return sqlite3.connect(DB_PATH, check_same_thread=False)

def init_db():
    """Create table if it doesn't exist."""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS articles (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                title               TEXT NOT NULL,
                url                 TEXT UNIQUE NOT NULL,
                source              TEXT,
                date                TEXT,
                image_url           TEXT,
                summary_what        TEXT,
                summary_why_how     TEXT,
                summary_conclusion  TEXT,
                scraped_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
            conn.commit()
    except Exception as e:
        print(f"[DB ERROR] Failed to init DB: {e}")

def article_exists(url: str) -> bool:
    """Returns True if an article with that URL already exists in the DB."""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1 FROM articles WHERE url = ?", (url,))
            return cursor.fetchone() is not None
    except Exception as e:
        print(f"[DB ERROR] Failed to check if article exists: {e}")
        return False

def save_article(article: dict):
    """Inserts a new article into the DB. If URL already exists, skip silently."""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            # Handle empty summary dict if summarization failed
            summary = article.get("summary_data", {})
            
            cursor.execute("""
            INSERT OR IGNORE INTO articles 
            (title, url, source, date, image_url, summary_what, summary_why_how, summary_conclusion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                article.get("title", ""),
                article.get("url", ""),
                article.get("source", ""),
                article.get("date", ""),
                article.get("image_url", ""),
                summary.get("what", ""),
                summary.get("why_how", ""),
                summary.get("conclusion", "")
            ))
            conn.commit()
    except Exception as e:
        print(f"[DB ERROR] Failed to save article: {e}")

def row_to_dict(row) -> dict:
    return {
        "id": row[0],
        "title": row[1],
        "url": row[2],
        "source": row[3],
        "date": row[4],
        "image_url": row[5],
        "summary": {
            "what": row[6],
            "why_how": row[7],
            "conclusion": row[8]
        },
        "scraped_at": (row[9] + "Z") if row[9] and not row[9].endswith("Z") else row[9]
    }

def get_all_articles(limit: int = 200) -> list[dict]:
    """Returns most recent articles ordered by scraped_at DESC."""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT id, title, url, source, date, image_url, summary_what, summary_why_how, summary_conclusion, scraped_at 
            FROM articles 
            ORDER BY scraped_at DESC 
            LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            return [row_to_dict(row) for row in rows]
    except Exception as e:
        print(f"[DB ERROR] Failed to get all articles: {e}")
        return []

def get_today_articles() -> list[dict]:
    """Returns only articles scraped today."""
    try:
        today_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT id, title, url, source, date, image_url, summary_what, summary_why_how, summary_conclusion, scraped_at 
            FROM articles 
            WHERE date(scraped_at) = date('now') OR scraped_at LIKE ?
            ORDER BY scraped_at DESC 
            """, (f"{today_date}%",))
            rows = cursor.fetchall()
            return [row_to_dict(row) for row in rows]
    except Exception as e:
        print(f"[DB ERROR] Failed to get today's articles: {e}")
        return []

def get_articles_by_source(source: str) -> list[dict]:
    """Returns articles filtered by newspaper source."""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT id, title, url, source, date, image_url, summary_what, summary_why_how, summary_conclusion, scraped_at 
            FROM articles 
            WHERE source = ?
            ORDER BY scraped_at DESC 
            """, (source,))
            rows = cursor.fetchall()
            return [row_to_dict(row) for row in rows]
    except Exception as e:
        print(f"[DB ERROR] Failed to get articles by source: {e}")
        return []
