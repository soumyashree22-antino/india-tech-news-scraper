import os
import re
import httpx
from bs4 import BeautifulSoup
from groq import AsyncGroq
import trafilatura

# ---------------------------------------------------------------------------
# Setup & Config
# ---------------------------------------------------------------------------
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
client = AsyncGroq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

MODEL_NAME = "llama-3.1-8b-instant"

SUMMARY_PROMPT = """You are a professional news summarizer. Focus strictly on the Title and Excerpt. Ignore any website navigation menus, generic newspaper descriptions, or cookie banners that might appear in the Website Text.

Summarize the actual news event in exactly this format and nothing else. You MUST include the exact section headers "1) What is the news?", "2) Why / How?", and "3) Conclusion".

1) What is the news?
[Respond with exactly one short sentence here]

2) Why / How?
[Respond with a detailed explanation in 3 to 4 bullet points. Each bullet must start with a new line and a '-' character]

3) Conclusion
[Respond with exactly one short sentence here]

Article Data: {article_text}"""

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def fetch_article_text(url: str, limit: int = 2000) -> str:
    """Fetch article HTML, extract main text using trafilatura, and return text."""
    try:
        async with httpx.AsyncClient() as http_client:
            resp = await http_client.get(url, timeout=15.0, headers={'User-Agent': 'Mozilla/5.0'})
            resp.raise_for_status()
            
            # Use trafilatura for clean text extraction (bypasses most paywall/login UI text)
            extracted = trafilatura.extract(resp.text)
            if extracted:
                return extracted[:limit] if limit else extracted
            
            # Fallback to basic paragraph extraction
            soup = BeautifulSoup(resp.text, 'html.parser')
            paragraphs = soup.find_all('p')
            text = "\n\n".join([p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True)])
            return text[:limit] if limit else text
    except Exception as e:
        print(f"[Summarizer] Failed to fetch article text: {e}")
        return ""

def parse_summary(text: str) -> dict:
    """Parse the structured output from the LLM."""
    summary = {"what": "", "why_how": "", "conclusion": ""}
    current_section = None
    
    for line in text.split("\n"):
        line_clean = line.strip()
        if not line_clean: continue
        lower_line = line_clean.lower()
        
        if re.search(r'^\**1[\)\.]?\s*\*?', lower_line) or "what is the news" in lower_line:
            current_section = "what"
            content = re.sub(r'^\**1[\)\.]?\s*\*?(what is the news\??)?\**\s*[:-]?\s*', '', line_clean, flags=re.IGNORECASE)
            summary[current_section] = content.strip()
        elif re.search(r'^\**2[\)\.]?\s*\*?', lower_line) or "why / how" in lower_line or "why/how" in lower_line:
            current_section = "why_how"
            content = re.sub(r'^\**2[\)\.]?\s*\*?(why\s*/\s*how\??)?\**\s*[:-]?\s*', '', line_clean, flags=re.IGNORECASE)
            summary[current_section] = content.strip()
        elif re.search(r'^\**3[\)\.]?\s*\*?', lower_line) or "conclusion" in lower_line:
            current_section = "conclusion"
            content = re.sub(r'^\**3[\)\.]?\s*\*?(conclusion\??)?\**\s*[:-]?\s*', '', line_clean, flags=re.IGNORECASE)
            summary[current_section] = content.strip()
        elif current_section:
            if summary[current_section]:
                summary[current_section] += "\n" + line_clean
            else:
                summary[current_section] = line_clean
                
    return summary

# ---------------------------------------------------------------------------
# Main Summarize Entrypoint
# ---------------------------------------------------------------------------

async def summarize(url: str, title: str, summary_text: str = "") -> dict:
    """Summarize the article using Groq API."""
    fallback = {
        "what": "Unavailable",
        "why_how": "Groq error",
        "conclusion": ""
    }
    
    if not client:
        print("[Summarizer] Missing GROQ_API_KEY")
        return fallback

    # Fetch full text from URL
    full_text = await fetch_article_text(url)
    
    # Combine title, RSS summary, and fetched text to give Groq maximum context
    combined_context = f"Title: {title}\n"
    
    if summary_text and len(summary_text.strip()) > 40:
        combined_context += f"Excerpt: {summary_text}\n"
    elif full_text.strip():
        # Only use fetched text if RSS summary is weak or missing
        combined_context += f"Website Text: {full_text[:1500]}\n"
        
    prompt = SUMMARY_PROMPT.format(article_text=combined_context)
    
    try:
        response = await client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=MODEL_NAME,
            max_tokens=300,
            temperature=0.15
        )
        generated_text = response.choices[0].message.content
        return parse_summary(generated_text)
    except Exception as e:
        print(f"[Summarizer] Groq API error: {e}")
        return fallback
