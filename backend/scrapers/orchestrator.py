"""
Orchestrator — runs all five RSS scrapers.

No longer needs Playwright or browser contexts. Just calls the async scrape()
functions of each module directly. Much faster and more reliable.
"""

import asyncio
import re
from datetime import datetime, timezone

from scrapers import toi, thehindu, hindustantimes, economictimes, indianexpress, inc42, lapaas

# Ordered list: (display_name, key, scraper_module)
SCRAPERS = [
    ("Times of India",  "toi",   toi),
    ("The Hindu",       "hindu", thehindu),
    ("Hindustan Times", "ht",    hindustantimes),
    ("Economic Times",  "et",    economictimes),
    ("Indian Express",  "ie",    indianexpress),
    ("Inc42",           "inc42", inc42),
    ("Lapaas Voice",    "lapaas", lapaas),
]

# ---------------------------------------------------------------------------
# Deduplication Helpers
# ---------------------------------------------------------------------------
STOPWORDS = {'at', 'in', 'of', 'and', 'to', 'for', 'the', 'a', 'is', 'on', 'with', 'as', 'by', 'it', 'from'}

def get_tokens(text: str) -> set:
    text = re.sub(r'[^a-z0-9]', ' ', text.lower())
    tokens = set(text.split())
    return tokens - STOPWORDS

def is_duplicate(t1: str, t2: str, threshold: float = 0.55) -> bool:
    s1 = get_tokens(t1)
    s2 = get_tokens(t2)
    if not s1 or not s2: return False
    intersection = len(s1.intersection(s2))
    overlap = intersection / min(len(s1), len(s2))
    return overlap >= threshold

# ---------------------------------------------------------------------------
# Public async functions — called from FastAPI route handlers
# ---------------------------------------------------------------------------

async def scrape_source(source_key: str) -> dict:
    """
    Scrapes a single newspaper source identified by its short key via RSS.
    """
    entry = next((s for s in SCRAPERS if s[1] == source_key), None)
    if entry is None:
        return {"success": False, "error": f"Unknown source key: {source_key}", "articles": []}

    display_name, key, scraper_module = entry
    print(f"\n[Orchestrator] Scraping single source via RSS: {display_name}")

    try:
        articles = await scraper_module.scrape()
    except Exception as e:
        print(f"[{display_name}] Error: {e}")
        articles = []

    print(f"[Orchestrator] {display_name}: {len(articles)} articles")

    return {
        "success":    True,
        "source":     display_name,
        "count":      len(articles),
        "scraped_at": datetime.now(timezone.utc).isoformat(),
        "articles":   articles,
    }


async def scrape_all() -> dict:
    """
    Scrapes all five sources concurrently using asyncio.gather.
    Returns merged results. Extremely fast since it's just HTTP GETs for RSS XML.
    """
    sources:      dict[str, dict] = {}
    all_articles: list[dict]      = []

    print("\n[Orchestrator] Scraping ALL sources concurrently via RSS...")
    
    # Run all scrapers concurrently
    tasks = [scraper_module.scrape() for _, _, scraper_module in SCRAPERS]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for i, (display_name, key, scraper_module) in enumerate(SCRAPERS):
        res = results[i]
        if isinstance(res, Exception):
            print(f"[{display_name}] Error: {res}")
            articles = []
        else:
            articles = res
            
        sources[display_name] = {"count": len(articles), "articles": articles}
        all_articles.extend(articles)

    # Deduplicate articles globally based on semantic headline similarity
    unique_articles = []
    for article in all_articles:
        is_dup = False
        for accepted in unique_articles:
            if is_duplicate(article.get("title", ""), accepted.get("title", "")):
                is_dup = True
                break
        if not is_dup:
            unique_articles.append(article)

    # Sort all unique articles by date descending
    unique_articles.sort(key=lambda a: a.get("date", "") or "", reverse=True)

    return {
        "success":        True,
        "total_articles": len(unique_articles),
        "scraped_at":     datetime.now(timezone.utc).isoformat(),
        "sources":        sources,
        "articles":       unique_articles,
    }
