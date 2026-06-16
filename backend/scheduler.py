import asyncio
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from scrapers.orchestrator import scrape_all
from summarizer import summarize
from database import article_exists, save_article
from emailer import send_digest_email

CRON_HOUR = 7
CRON_MINUTE = 0

scheduler = AsyncIOScheduler()

async def run_pipeline_job(is_manual=False):
    """
    The core pipeline:
    1. Scrape all sources
    2. Check DB for duplicates
    3. Summarize new articles
    4. Save to DB
    5. Send email digest
    """
    print(f"\n[{datetime.now(timezone.utc).isoformat()}] [Cron] Starting daily news pipeline...")
    
    try:
        # Step 1: Scrape
        scrape_result = await scrape_all()
        if not scrape_result.get("success"):
            print("[Cron] Scrape failed. Aborting pipeline.")
            return

        articles = scrape_result.get("articles", [])
        print(f"[Cron] Fetched {len(articles)} total articles from sources.")
        
        new_articles = []
        
        # Step 2: Check DB & Summarize New
        for article in articles:
            url = article.get("url")
            if not url:
                continue
                
            if article_exists(url):
                continue
                
            # Step 3: Summarize
            print(f"[Cron] Summarizing new article: {article.get('title')}")
            summary_data = await summarize(url, article.get("title", ""), article.get("summary", ""))
            article["summary_data"] = summary_data
            
            # Step 4: Save to DB
            save_article(article)
            new_articles.append(article)
            
        print(f"[Cron] Pipeline complete. {len(new_articles)} new articles saved.")
        
        # Step 5: Send Email Digest
        if new_articles:
            print("[Cron] Sending email digest with new articles...")
            send_digest_email(new_articles, is_forced=is_manual)
        elif is_manual:
            print("[Cron] Manual trigger: No new articles, sending top existing articles instead.")
            from database import get_today_articles
            top_articles = get_today_articles()[:30]
            if top_articles:
                send_digest_email(top_articles, is_forced=True)
            else:
                print("[Cron] No articles exist in DB to email.")
        else:
            print("[Cron] No new articles to email today.")
            
    except Exception as e:
        print(f"[Cron] CRITICAL ERROR in pipeline: {e}")


def setup_scheduler():
    """Configure and add the job."""
    # Add job to run every day at CRON_HOUR:CRON_MINUTE
    scheduler.add_job(
        run_pipeline_job,
        CronTrigger(hour=CRON_HOUR, minute=CRON_MINUTE, timezone="Asia/Kolkata"),
        id="daily_news_pipeline",
        replace_existing=True
    )
