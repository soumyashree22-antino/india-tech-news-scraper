import asyncio
from datetime import datetime, timezone

from scrapers.orchestrator import scrape_all
from summarizer import summarize
from database import article_exists, save_article

async def run_pipeline_job(is_manual=False):
    """
    The core pipeline:
    1. Scrape all sources
    2. Check DB for duplicates
    3. Summarize new articles
    4. Save to DB
    5. Send email digest
    """
    print(f"\n[{datetime.now(timezone.utc).isoformat()}] [Pipeline] Starting daily news pipeline...")
    
    try:
        # Step 1: Scrape
        scrape_result = await scrape_all()
        if not scrape_result.get("success"):
            print("[Pipeline] Scrape failed. Aborting pipeline.")
            return

        articles = scrape_result.get("articles", [])
        print(f"[Pipeline] Fetched {len(articles)} total articles from sources.")
        
        new_articles = []
        
        # Step 2: Check DB & Summarize New
        for article in articles:
            url = article.get("url")
            if not url:
                continue
                
            if article_exists(url):
                continue
                
            # Step 3: Summarize
            print(f"[Pipeline] Summarizing new article: {article.get('title')}")
            summary_data = await summarize(url, article.get("title", ""), article.get("summary", ""))
            article["summary_data"] = summary_data
            
            # Step 4: Save to DB
            save_article(article)
            new_articles.append(article)
            
        print(f"[Pipeline] Pipeline complete. {len(new_articles)} new articles saved.")
        
    except Exception as e:
        print(f"[Pipeline] CRITICAL ERROR in pipeline: {e}")
