import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ExternalLink, Sparkles, X } from 'lucide-react';

const SOURCE_COLORS = {
  'Times of India': '#ef4444',
  'The Hindu': '#3b82f6',
  'Hindustan Times': '#f97316',
  'Economic Times': '#22c55e',
  'Indian Express': '#a855f7',
  'Inc42': '#ec4899',
  'Lapaas Voice': '#06b6d4',
};

const STOCK_IMAGES = [
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&q=80',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80',
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80',
];

function formatBullets(text) {
  if (!text) return null;
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length > 1 || text.startsWith('-') || text.startsWith('*')) {
    return (
      <ul style={{ paddingLeft: 22, margin: '8px 0 0', listStyleType: 'disc' }}>
        {lines.map((line, i) => (
          <li key={i} style={{ fontSize: 15, color: '#666', lineHeight: 1.7, marginBottom: i < lines.length - 1 ? 6 : 0 }}>
            {line.replace(/^[-*]\s*/, '')}
          </li>
        ))}
      </ul>
    );
  }
  return <p style={{ fontSize: 15, color: '#666', lineHeight: 1.7, marginTop: 8 }}>{text}</p>;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return dateStr; }
}

export default function ArticleDetail({ article, onBack, darkMode = false, onPrev, onNext, hasPrev, hasNext, currentIndex, total }) {
  const { title, summary, url, source, date, image_url } = article;
  const badgeColor = SOURCE_COLORS[source] || '#6366f1';
  const formattedDate = formatDate(date);
  const displayImage = image_url || STOCK_IMAGES[(title?.length || 0) % STOCK_IMAGES.length];

  const bg = darkMode ? '#080808' : '#ffffff';
  const cardBg = darkMode ? '#111111' : '#f9f9f9';
  const border = darkMode ? '#222' : '#e5e5e5';
  const textColor = darkMode ? '#ffffff' : '#0a0a0a';
  const mutedColor = darkMode ? '#888' : '#666';
  const subtleColor = darkMode ? '#555' : '#999';

  const hasDbSummary = summary && summary.what;
  const [summaryData, setSummaryData] = useState(hasDbSummary ? summary : null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [showSummary, setShowSummary] = useState(!!hasDbSummary);

  const [fullText, setFullText] = useState('');
  const [isFetchingText, setIsFetchingText] = useState(false);
  const [textError, setTextError] = useState('');

  // Auto-fetch article full text on mount
  useEffect(() => {
    const fetchText = async () => {
      setIsFetchingText(true);
      try {
        const res = await fetch('/api/article/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (data.success && data.text) setFullText(data.text);
        else setTextError('Could not fetch the article text. Open the original link instead.');
      } catch {
        setTextError('Failed to load article text.');
      } finally {
        setIsFetchingText(false);
      }
    };
    fetchText();
  }, [url]);

  const handleSummarize = async () => {
    if (summaryData) { setShowSummary(true); return; }
    setIsSummarizing(true);
    setSummaryError('');
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title, summary: '' }),
      });
      const data = await res.json();
      if (data.success && data.summary) { setSummaryData(data.summary); setShowSummary(true); }
      else setSummaryError(data.message || 'Could not summarize.');
    } catch { setSummaryError('Summarization failed.'); }
    finally { setIsSummarizing(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.28 }}
      style={{ minHeight: '100vh', backgroundColor: bg, fontFamily: 'Inter, sans-serif' }}
    >
      {/* ── Top Nav ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: bg,
        borderBottom: `1px solid ${border}`,
        padding: '0 16px',
        height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        backdropFilter: 'blur(10px)',
      }}>
        {/* Left: Back button */}
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 14px', borderRadius: 9,
            border: `1px solid ${border}`,
            backgroundColor: 'transparent',
            color: mutedColor, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'Inter', transition: 'all 0.15s',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = textColor; e.currentTarget.style.borderColor = textColor; }}
          onMouseLeave={e => { e.currentTarget.style.color = mutedColor; e.currentTarget.style.borderColor = border; }}
        >
          <ArrowLeft size={14} />
          Back to feed
        </button>

        {/* Centre: Prev / counter / Next — only in single-view mode */}
        {onPrev && onNext && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={onPrev}
              disabled={!hasPrev}
              style={{
                padding: '7px 14px', borderRadius: 9,
                border: `1px solid ${border}`, backgroundColor: 'transparent',
                color: hasPrev ? textColor : subtleColor,
                fontSize: 13, fontWeight: 500, cursor: hasPrev ? 'pointer' : 'not-allowed',
                fontFamily: 'Inter', transition: 'all 0.15s', opacity: hasPrev ? 1 : 0.4,
              }}
            >
              ← Prev
            </button>
            <span style={{ fontSize: 12, color: subtleColor, padding: '0 8px', whiteSpace: 'nowrap' }}>
              {currentIndex + 1} / {total}
            </span>
            <button
              onClick={onNext}
              disabled={!hasNext}
              style={{
                padding: '7px 14px', borderRadius: 9,
                border: `1px solid ${border}`, backgroundColor: 'transparent',
                color: hasNext ? textColor : subtleColor,
                fontSize: 13, fontWeight: 500, cursor: hasNext ? 'pointer' : 'not-allowed',
                fontFamily: 'Inter', transition: 'all 0.15s', opacity: hasNext ? 1 : 0.4,
              }}
            >
              Next →
            </button>
          </div>
        )}

        {/* Right: Open original */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 9,
            border: '1px solid #6366f1',
            backgroundColor: '#6366f115',
            color: '#6366f1', fontSize: 13, fontWeight: 500,
            textDecoration: 'none', cursor: 'pointer', transition: 'all 0.15s',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#6366f125'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#6366f115'}
        >
          Open original <ExternalLink size={12} />
        </a>
      </div>

      {/* ── Hero Image ── */}
      <div style={{ position: 'relative', width: '100%', height: 420, overflow: 'hidden' }}>
        <img
          src={displayImage}
          alt={title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.currentTarget.src = STOCK_IMAGES[0]; }}
        />
        {/* Strong gradient fade to background */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%',
          background: `linear-gradient(to bottom, transparent 0%, ${bg} 100%)`,
        }} />
        {/* Source badge */}
        <div style={{
          position: 'absolute', bottom: 24, left: 40,
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '5px 14px', borderRadius: 999,
          backgroundColor: `${badgeColor}20`,
          border: `1px solid ${badgeColor}`,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: badgeColor }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: badgeColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {source}
          </span>
        </div>
      </div>

      {/* ── Article Content ── */}
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Date */}
        {formattedDate && (
          <p style={{ fontSize: 13, color: subtleColor, marginBottom: 12 }}>{formattedDate}</p>
        )}

        {/* Title */}
        <h1 style={{
          fontSize: 36, fontWeight: 800, color: textColor,
          lineHeight: 1.25, letterSpacing: '-0.5px', marginBottom: 24,
          fontFamily: 'Inter, sans-serif',
        }}>
          {title}
        </h1>

        {/* AI Summary Card */}
        <div style={{
          backgroundColor: cardBg,
          border: `1px solid ${border}`,
          borderLeft: `4px solid ${badgeColor}`,
          borderRadius: 12, padding: 24, marginBottom: 40,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={15} color="#6366f1" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                AI Summary
              </span>
            </div>
            {!showSummary && !isSummarizing && (
              <button
                onClick={handleSummarize}
                style={{
                  padding: '6px 14px', borderRadius: 8,
                  border: '1px solid #6366f1',
                  backgroundColor: '#6366f115', color: '#6366f1',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter',
                }}
              >
                Generate Summary
              </button>
            )}
            {showSummary && summaryData && (
              <button onClick={() => setShowSummary(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: subtleColor }}>
                <X size={14} />
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {isSummarizing && (
              <motion.div key="skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[['40%', 14], ['90%', 20], ['70%', 20], ['35%', 14], ['85%', 40]].map(([w, h], i) => (
                    <div key={i} className="skeleton" style={{ width: w, height: h, borderRadius: 6 }} />
                  ))}
                </div>
              </motion.div>
            )}
            {showSummary && summaryData && (
              <motion.div key="summary" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {[
                    { icon: '📌', label: 'What is the news?', content: summaryData.what, isText: true },
                    { icon: '🔍', label: 'Why / How?', content: summaryData.why_how, isText: false },
                    { icon: '✅', label: 'Conclusion', content: summaryData.conclusion, isText: true },
                  ].map(({ icon, label, content, isText }, i, arr) => (
                    <div key={label}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: textColor, marginBottom: 4 }}>{icon} {label}</p>
                      {isText
                        ? <p style={{ fontSize: 15, color: mutedColor, lineHeight: 1.7 }}>{content}</p>
                        : formatBullets(content)
                      }
                      {i < arr.length - 1 && <div style={{ height: 1, backgroundColor: border, marginTop: 18 }} />}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            {!showSummary && !isSummarizing && (
              <motion.p key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 14, color: mutedColor }}>
                Click "Generate Summary" to get an AI-powered breakdown of this article.
              </motion.p>
            )}
          </AnimatePresence>
          {summaryError && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 10 }}>{summaryError}</p>}
        </div>


      </div>
    </motion.div>
  );
}
