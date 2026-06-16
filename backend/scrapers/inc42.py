"""
Inc42 — RSS Scraper
"""

import feedparser
from .utils import process_feed

RSS_URLS = [
    "https://inc42.com/feed/"
]
SOURCE_NAME = "Inc42"

async def scrape() -> list[dict]:
    all_articles = []
    seen_urls = set()
    
    for url in RSS_URLS:
        try:
            import urllib.request
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            response = urllib.request.urlopen(req, timeout=10).read()
            feed = feedparser.parse(response)
            
            articles = process_feed(feed, SOURCE_NAME, max_items=20, strict_filter=True, year_filter="2026")
            
            for article in articles:
                if article["url"] not in seen_urls:
                    seen_urls.add(article["url"])
                    all_articles.append(article)
        except Exception as e:
            print(f"[{SOURCE_NAME}] Error fetching feed {url}: {e}")
            
    return all_articles[:20]
