"""
Times of India — RSS Scraper (Tech, Economy, Startups)
"""

import feedparser
import asyncio
from .utils import process_feed

# We use the Business and Tech feeds to capture Economy, Startups, and Tech
RSS_URLS = [
    "https://timesofindia.indiatimes.com/rssfeeds/5880659.cms",    # Tech
    "https://timesofindia.indiatimes.com/rssfeeds/66949542.cms",   # Tech (Alternative)
    "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms"     # Business/Economy
]
SOURCE_NAME = "Times of India"

async def scrape() -> list[dict]:
    """Fetch and parse multiple TOI RSS feeds."""
    all_articles = []
    seen_urls = set()
    
    # We run them synchronously since feedparser is blocking,
    # but asyncio.to_thread could be used if it was a bottleneck.
    # For a few feeds, it's fast enough.
    for url in RSS_URLS:
        try:
            # feedparser.parse can handle URLs directly
            # TOI needs a user-agent to avoid blocking
            import urllib.request
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            response = urllib.request.urlopen(req, timeout=10).read()
            feed = feedparser.parse(response)
            
            # Request max 20 per feed, since we are combining feeds
            articles = process_feed(feed, SOURCE_NAME, max_items=20, strict_filter=True, year_filter="2026")
            
            for article in articles:
                if article["url"] not in seen_urls:
                    seen_urls.add(article["url"])
                    all_articles.append(article)
                    
        except Exception as e:
            print(f"[{SOURCE_NAME}] Error fetching feed {url}: {e}")
            
    # Return at most 15-20 articles total from this source
    return all_articles[:20]
