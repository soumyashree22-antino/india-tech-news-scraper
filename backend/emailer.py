import os
import smtplib
from email.message import EmailMessage
from datetime import datetime, timezone

def send_digest_email(articles: list[dict], is_forced: bool = False):
    """Sends a daily HTML digest email of the scraped articles."""
    sender_email = os.getenv("GMAIL_SENDER")
    sender_password = os.getenv("GMAIL_APP_PASSWORD")
    recipient_email = os.getenv("RECIPIENT_EMAIL")

    if not sender_email or not sender_password or not recipient_email:
        print("[Emailer] Missing email credentials in .env, skipping email digest.")
        return

    today_date = datetime.now(timezone.utc).strftime("%B %d, %Y")
    total_articles = len(articles)

    # Calculate source breakdown
    source_counts = {}
    for a in articles:
        src = a.get("source", "Unknown")
        source_counts[src] = source_counts.get(src, 0) + 1
        
    breakdown_html = "".join([f"<li><strong>{src}</strong>: {count}</li>" for src, count in source_counts.items()])

    # Article HTML (Top 30 max)
    articles_html = ""
    for i, a in enumerate(articles[:30]):
        summary = a.get("summary", {})
        what = summary.get("what", "N/A")
        why = summary.get("why_how", "N/A")
        conclusion = summary.get("conclusion", "N/A")
        
        why_lines = [l.strip() for l in why.split('\n') if l.strip()]
        if len(why_lines) > 1 or why.startswith('-') or why.startswith('*'):
            why_html = '<ul style="margin: 4px 0; padding-left: 24px; line-height: 1.6;">'
            for line in why_lines:
                clean_line = line.lstrip('-* ')
                why_html += f'<li style="margin-bottom: 6px;">{clean_line}</li>'
            why_html += '</ul>'
        else:
            why_html = why.replace('\n', '<br/>')
        
        articles_html += f"""
        <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 8px;">
            <span style="background-color: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; color: #333; margin-bottom: 10px; display: inline-block;">{a.get('source')}</span>
            <p style="margin-top: 5px;"><strong>What:</strong> {what}</p>
            <p style="margin-top: 8px;"><strong>Why/How:</strong>{why_html}</p>
            <p style="margin-top: 8px;"><strong>Conclusion:</strong> {conclusion}</p>
            <p style="margin-top: 15px;"><a href="{a.get('url')}" style="color: #1a73e8; text-decoration: none; font-weight: bold;">Read Full Article →</a></p>
        </div>
        """

    html_content = f"""
    <html>
    <head></head>
    <body style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto;">
        <h1 style="border-bottom: 2px solid #1a73e8; padding-bottom: 10px; color: #1a73e8;">{'Manual Test Digest' if is_forced else 'Daily Tech News Digest'}</h1>
        <p><strong>Date:</strong> {today_date}</p>
        <p><strong>{'Total Articles Included' if is_forced else 'Total New Articles Scraped'}:</strong> {total_articles}</p>
        
        <h3>Source Breakdown:</h3>
        <ul>
            {breakdown_html}
        </ul>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <h2>Top Articles Summary</h2>
        {articles_html}
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="text-align: center; font-size: 12px; color: #888;">Powered by India Tech News Scraper</p>
    </body>
    </html>
    """

    msg = EmailMessage()
    if is_forced:
        msg['Subject'] = f"Manual Test Digest — {today_date} | Latest {total_articles} articles"
    else:
        msg['Subject'] = f"Daily Tech News Digest — {today_date} | {total_articles} new articles"
    msg['From'] = sender_email
    msg['To'] = recipient_email
    msg.set_content("Your email client does not support HTML emails.")
    msg.add_alternative(html_content, subtype='html')

    try:
        print("[Emailer] Connecting to Gmail SMTP...")
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(sender_email, sender_password)
            smtp.send_message(msg)
        print(f"[Emailer] Successfully sent email digest to {recipient_email}")
    except Exception as e:
        print(f"[Emailer] Failed to send email: {e}")
