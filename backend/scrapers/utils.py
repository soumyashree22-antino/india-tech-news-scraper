"""
utils.py — Shared helpers for all RSS-based scrapers.
"""

import re
from email.utils import parsedate_to_datetime



def _extract_image(entry) -> str:
    """Try to pull an image URL from various RSS media fields."""
    media = getattr(entry, "media_content", None)
    if media and isinstance(media, list) and media[0].get("url"):
        return media[0]["url"]

    media_thumb = getattr(entry, "media_thumbnail", None)
    if media_thumb and isinstance(media_thumb, list) and media_thumb[0].get("url"):
        return media_thumb[0]["url"]

    enclosures = getattr(entry, "enclosures", [])
    for enc in enclosures:
        if enc.get("type", "").startswith("image"):
            return enc.get("url", "")

    summary_html = entry.get("summary", "") or entry.get("content", [{}])[0].get("value", "")
    img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', summary_html)
    if img_match:
        return img_match.group(1)

    return ""


def _strip_html(html: str) -> str:
    """Remove HTML tags and normalise whitespace."""
    text = re.sub(r"<[^>]+>", " ", html or "")
    return re.sub(r"\s+", " ", text).strip()


def _parse_date(entry) -> str:
    """Return an ISO date string from the RSS entry, or empty string."""
    published_parsed = getattr(entry, "published_parsed", None)
    if published_parsed:
        try:
            from datetime import datetime, timezone
            return datetime(*published_parsed[:6], tzinfo=timezone.utc).isoformat()
        except Exception:
            pass

    raw = entry.get("published", "") or entry.get("updated", "")
    if raw:
        try:
            return parsedate_to_datetime(raw).isoformat()
        except Exception:
            return raw

    return ""





def parse_entry(entry, source_name: str) -> dict:
    """
    Convert a feedparser entry into a standardised article dict.
    """
    title = _strip_html(entry.get("title", "")).strip()
    raw_summary = entry.get("summary", "")
    summary = _strip_html(raw_summary).strip()[:300]
    
    url = entry.get("link", "")

    return {
        "title":     title,
        "summary":   summary,
        "url":       url,
        "source":    source_name,
        "date":      _parse_date(entry),
        "image_url": _extract_image(entry),
    }

def process_feed(feed, source_name: str, max_items: int = 15, strict_filter: bool = True, year_filter: str = "2026") -> list[dict]:
    """
    Processes the feed entries, applying keyword and year filters.
    Returns up to max_items articles.
    """
    articles = []
    for entry in feed.entries:
        parsed = parse_entry(entry, source_name)
        
        # 1. Year Filter
        date_str = parsed.get("date", "")
        if year_filter and year_filter not in date_str:
            continue
            

            
        articles.append(parsed)
        if len(articles) >= max_items:
            break
            
    return articles
