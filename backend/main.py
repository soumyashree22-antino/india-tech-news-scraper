import os
import traceback
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from dotenv import load_dotenv

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Load env variables at startup
load_dotenv()

from scrapers.orchestrator import scrape_source, scrape_all
from summarizer import summarize, fetch_article_text
from database import init_db, get_all_articles, get_today_articles, get_articles_by_source
from scheduler import scheduler, setup_scheduler, run_pipeline_job

class SummarizeRequest(BaseModel):
    url: str
    title: str
    summary: str = ""

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("[FastAPI] Initializing Database...")
    init_db()
    
    if not os.environ.get("VERCEL"):
        print("[FastAPI] Starting Scheduler...")
        setup_scheduler()
        scheduler.start()
        
    yield
    
    # Shutdown
    if not os.environ.get("VERCEL"):
        print("[FastAPI] Shutting down Scheduler...")
        scheduler.shutdown()

app = FastAPI(
    title="India Tech News Scraper API",
    description="Automated cron scraping, Groq summarization, and DB storage.",
    version="3.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    print(f"[API] Unhandled exception: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": str(exc), "message": "Unexpected server error."},
    )

# ---------------------------------------------------------------------------
# NEW DB-BACKED ENDPOINTS
# ---------------------------------------------------------------------------

@app.get("/api/articles", tags=["Database"])
async def get_articles():
    """Returns all articles from DB."""
    articles = get_all_articles()
    return {
        "success": True,
        "total": len(articles),
        "articles": articles
    }

@app.get("/api/articles/today", tags=["Database"])
async def get_articles_today():
    """Returns only today's articles from DB."""
    articles = get_today_articles()
    return {
        "success": True,
        "total": len(articles),
        "articles": articles
    }

@app.get("/api/articles/source/{source_name}", tags=["Database"])
async def get_articles_source(source_name: str):
    """Returns articles filtered by source from DB."""
    articles = get_articles_by_source(source_name)
    return {
        "success": True,
        "total": len(articles),
        "articles": articles
    }

@app.post("/api/scrape/manual", tags=["Pipeline"])
async def trigger_manual_scrape():
    """Manually triggers the full cron job pipeline immediately."""
    print("[API] Manual scrape triggered!")
    await run_pipeline_job(is_manual=True)
    return {
        "success": True,
        "message": "Manual pipeline execution completed. Check server logs for details."
    }

@app.get("/api/scrape/cron", tags=["Pipeline"])
async def vercel_cron_scrape(request: Request):
    """Triggered automatically by Vercel Cron."""
    # Optional but highly recommended: verify Vercel CRON_SECRET to prevent unauthorized triggers
    auth_header = request.headers.get("authorization")
    cron_secret = os.environ.get("CRON_SECRET")
    
    if cron_secret and auth_header != f"Bearer {cron_secret}":
        return JSONResponse(status_code=401, content={"success": False, "error": "Unauthorized cron trigger."})
        
    print("[API] Vercel Cron triggered daily scrape!")
    await run_pipeline_job(is_manual=False)
    return {
        "success": True,
        "message": "Cron pipeline executed successfully."
    }

@app.get("/api/status", tags=["Status"])
async def get_status():
    """Returns cron job status."""
    total_db = len(get_all_articles(999999))
    today_db = len(get_today_articles())
    
    last_run = "Unknown"
    next_run = "Unknown"
    
    if scheduler.running:
        job = scheduler.get_job("daily_news_pipeline")
        if job:
            next_run = job.next_run_time.isoformat() if job.next_run_time else "None"
            
    return {
        "success": True,
        "last_run": last_run, # APScheduler doesn't store last run time natively easily without a jobstore, mock it or leave unknown
        "next_run": next_run,
        "total_articles_in_db": total_db,
        "articles_today": today_db
    }

# ---------------------------------------------------------------------------
# LEGACY LIVE SCRAPING ENDPOINTS (Kept intact per instructions)
# ---------------------------------------------------------------------------

@app.get("/api/health", tags=["Health"])
async def health_check(): return {"status": "ok"}

@app.get("/api/scrape/toi", tags=["Scrape"])
async def scrape_toi(): return await scrape_source("toi")

@app.get("/api/scrape/thehindu", tags=["Scrape"])
async def scrape_thehindu(): return await scrape_source("hindu")

@app.get("/api/scrape/hindustantimes", tags=["Scrape"])
async def scrape_hindustantimes(): return await scrape_source("ht")

@app.get("/api/scrape/economictimes", tags=["Scrape"])
async def scrape_economictimes(): return await scrape_source("et")

@app.get("/api/scrape/indianexpress", tags=["Scrape"])
async def scrape_indianexpress(): return await scrape_source("ie")

@app.get("/api/scrape/inc42", tags=["Scrape"])
async def scrape_inc42(): return await scrape_source("inc42")

@app.get("/api/scrape/lapaas", tags=["Scrape"])
async def scrape_lapaas(): return await scrape_source("lapaas")

@app.get("/api/scrape/all", tags=["Scrape"])
async def scrape_all_sources(): return await scrape_all()

@app.post("/api/summarize", tags=["Summarize"])
async def summarize_article(req: SummarizeRequest):
    try:
        summary_result = await summarize(req.url, req.title, req.summary)
        return {"success": True, "title": req.title, "summary": summary_result}
    except Exception as exc:
        return JSONResponse(status_code=500, content={"success": False, "error": str(exc)})

class ArticleTextRequest(BaseModel):
    url: str

@app.post("/api/article/text", tags=["Summarize"])
async def get_article_text(req: ArticleTextRequest):
    try:
        text = await fetch_article_text(req.url, limit=None)
        return {"success": True, "text": text}
    except Exception as exc:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"success": False, "error": str(exc)})
