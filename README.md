# India Tech News Scraper

A full-stack automated news aggregation platform that scrapes technology, startup, and business news from 7 major Indian newspapers.

It runs autonomously on a daily cron schedule, summarizing every new article using **Groq (Llama 3.1)**, saving it to a local **SQLite** database, and sending a daily **HTML Email Digest**.

## Tech Stack
- **Backend**: FastAPI, Python `sqlite3`, APScheduler, Groq SDK, `httpx`, `BeautifulSoup`
- **Frontend**: React, Vite
- **Data Source**: Official RSS feeds from Times of India, The Hindu, Hindustan Times, Economic Times, Indian Express, Inc42, and Lapaas Voice.

## Setup Instructions

### 1. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. Copy the `.env.example` file to a new file named `.env`:
   ```bash
   cp .env.example .env
   ```
3. Fill in your credentials inside `.env`:
   - `GROQ_API_KEY`: Your Groq API key for fast Llama summarization.
   - `GMAIL_SENDER`: Your Gmail address.
   - `GMAIL_APP_PASSWORD`: You must use a generated App Password. 
     *(Go to Google Account → Security → 2-Step Verification → App Passwords).*
   - `RECIPIENT_EMAIL`: The email address where the daily digest should be sent.

4. Start the FastAPI server (it will automatically initialize the database and start the cron scheduler):
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Automated Cron Schedule
- **Scraping**: Runs automatically every day at 7:00 AM.
- **Deduplication**: Automatically merges identical breaking news from different newspapers.
- **Summarization**: Only new, unseen articles are summarized by Groq to save quota.
- **Digest**: An HTML email digest is automatically sent to `RECIPIENT_EMAIL` containing the 3-point summaries of the top 30 new articles.
- **Manual Trigger**: You can bypass the cron job at any time by clicking "Manual Scrape" in the React UI, or hitting `POST /api/scrape/manual`.
