import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Sparkles } from 'lucide-react';

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
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
];

function formatBullets(text) {
  if (!text) return null;
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length > 1 || text.startsWith('-') || text.startsWith('*')) {
    return (
      <ul style={{ paddingLeft: 22, margin: '6px 0 0', listStyleType: 'disc' }}>
        {lines.map((line, i) => (
          <li key={i} style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6, marginBottom: i < lines.length - 1 ? 4 : 0 }}>
            {line.replace(/^[-*]\s*/, '')}
          </li>
        ))}
      </ul>
    );
  }
  return <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6, marginTop: 6 }}>{text}</div>;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 90, damping: 16 }
  }
};

export default function ArticleCard({ article, isExpanded, darkMode = true, onReadInApp }) {
  const { title, summary, url, source, date, image_url } = article;
  const badgeColor = SOURCE_COLORS[source] || '#6366f1';
  const formattedDate = formatDate(date);
  const fallbackImage = STOCK_IMAGES[(title?.length || 0) % STOCK_IMAGES.length];
  const displayImage = image_url || fallbackImage;

  const hasDbSummary = summary && summary.what;
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryData, setSummaryData] = useState(hasDbSummary ? summary : null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSummary, setShowSummary] = useState(!!hasDbSummary);

  const [fullText, setFullText] = useState(null);
  const [isFetchingFullText, setIsFetchingFullText] = useState(false);
  const [fullTextError, setFullTextError] = useState('');
  const [showFullText, setShowFullText] = useState(false);

  const [isHovered, setIsHovered] = useState(false);

  const handleFetchFullText = async () => {
    if (fullText) { setShowFullText(v => !v); return; }
    setIsFetchingFullText(true);
    setFullTextError('');
    setShowFullText(true);
    try {
      const res = await fetch('/api/article/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.success && data.text) setFullText(data.text);
      else { setFullTextError(data.error || 'Could not fetch the full text.'); setShowFullText(false); }
    } catch { setFullTextError('Could not fetch the full text.'); setShowFullText(false); }
    finally { setIsFetchingFullText(false); }
  };

  const handleSummarize = async () => {
    if (summaryData) { setShowSummary(true); return; }
    setIsSummarizing(true);
    setErrorMsg('');
    setShowSummary(true);
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title, summary: '' }),
      });
      const data = await res.json();
      if (data.success && data.summary) setSummaryData(data.summary);
      else { setErrorMsg(data.message || 'Could not summarize this article.'); setShowSummary(false); }
    } catch { setErrorMsg('Could not summarize this article.'); setShowSummary(false); }
    finally { setIsSummarizing(false); }
  };

  const cardBg = darkMode ? '#111111' : '#ffffff';
  const cardBorderDefault = darkMode ? '#222222' : '#e5e5e5';
  const summaryBg = darkMode ? '#0d0d0d' : '#f8f8f8';
  const textColor = darkMode ? '#ffffff' : '#0a0a0a';
  const mutedColor = darkMode ? '#888888' : '#666666';
  const subtleColor = darkMode ? '#555555' : '#999999';

  return (
    <motion.article
      variants={itemVariants}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 16,
        border: `1px solid ${isHovered ? badgeColor : cardBorderDefault}`,
        backgroundColor: cardBg,
        overflow: 'hidden',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
        boxShadow: isHovered
          ? `0 8px 30px ${badgeColor}28, 0 0 0 1px ${badgeColor}30`
          : darkMode ? '0 1px 3px rgba(0,0,0,0.5)' : '0 1px 3px rgba(0,0,0,0.08)',
        cursor: 'default',
      }}
    >
      {/* ── Image ── */}
      <div className="card-img-wrap" style={{ height: isExpanded ? 340 : 220, flexShrink: 0, position: 'relative' }}>
        <img
          src={displayImage}
          alt={title}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.currentTarget.src = STOCK_IMAGES[0]; }}
        />
        {/* Gradient overlay blending image into card */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
          background: `linear-gradient(to bottom, transparent 0%, ${cardBg} 100%)`,
          pointerEvents: 'none',
        }} />
        {/* Source badge floating on image */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 999,
          backgroundColor: `${cardBg}cc`,
          backdropFilter: 'blur(8px)',
          border: `1px solid ${cardBorderDefault}`,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: badgeColor, flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: badgeColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {source}
          </span>
        </div>
      </div>

      {/* ── Card Body ── */}
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, padding: isExpanded ? 32 : 20 }}>

        {/* Date */}
        {formattedDate && (
          <span style={{ fontSize: 11, color: subtleColor, marginBottom: 8, display: 'block' }}>{formattedDate}</span>
        )}

        {/* Title */}
        <h2 style={{
          fontSize: isExpanded ? 28 : 15,
          fontWeight: 600,
          color: textColor,
          lineHeight: 1.4,
          marginBottom: isExpanded ? 16 : 8,
          display: '-webkit-box',
          WebkitLineClamp: isExpanded ? 'unset' : 2,
          WebkitBoxOrient: 'vertical',
          overflow: isExpanded ? 'visible' : 'hidden',
          fontFamily: 'Inter, sans-serif',
        }}>
          {title}
        </h2>

        {/* Static string summary */}
        {!isExpanded && typeof summary === 'string' && summary && (
          <p style={{
            fontSize: 13, color: mutedColor, lineHeight: 1.6,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', marginBottom: 12,
          }}>
            {summary}
          </p>
        )}

        {/* Action row */}
        <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 13, fontWeight: 600, color: '#6366f1',
              textDecoration: 'none', transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Read Article <ExternalLink size={12} />
          </a>

        </div>

        {/* Summarize button */}
        {!hasDbSummary && !showSummary && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSummarize}
            disabled={isSummarizing}
            style={{
              marginTop: 12,
              width: '100%',
              padding: '9px 0',
              borderRadius: 10,
              border: `1px solid ${isHovered ? badgeColor : cardBorderDefault}`,
              backgroundColor: isHovered ? `${badgeColor}14` : 'transparent',
              color: isHovered ? badgeColor : mutedColor,
              fontSize: 13, fontWeight: 600,
              cursor: isSummarizing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              transition: 'all 0.2s', fontFamily: 'Inter',
              opacity: isSummarizing ? 0.6 : 1,
            }}
          >
            {isSummarizing ? (
              <>
                <div style={{ width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
                Summarizing...
              </>
            ) : (
              <>
                <Sparkles size={13} />
                AI Summary
              </>
            )}
          </motion.button>
        )}

        {errorMsg && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{errorMsg}</p>}
        {fullTextError && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{fullTextError}</p>}

        {/* ── Full Text Accordion ── */}
        <AnimatePresence>
          {showFullText && fullText && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="custom-scrollbar" style={{
                marginTop: 16, padding: 16,
                backgroundColor: summaryBg,
                border: `1px solid ${cardBorderDefault}`,
                borderRadius: 10,
                fontSize: 14, color: mutedColor,
                lineHeight: 1.7, whiteSpace: 'pre-wrap',
                maxHeight: 480, overflowY: 'auto',
              }}>
                {fullText}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── AI Summary Accordion ── */}
        <AnimatePresence>
          {showSummary && summaryData && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                position: 'relative',
                marginTop: 16,
                padding: 16,
                backgroundColor: summaryBg,
                borderLeft: `3px solid ${badgeColor}`,
                borderRadius: 10,
                border: `1px solid ${cardBorderDefault}`,
                borderLeftWidth: 3,
                borderLeftColor: badgeColor,
              }}>
                {!hasDbSummary && (
                  <button
                    onClick={() => setShowSummary(false)}
                    style={{
                      position: 'absolute', top: 10, right: 10,
                      width: 24, height: 24, borderRadius: 6,
                      border: 'none', backgroundColor: 'transparent',
                      color: subtleColor, cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      transition: 'color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = textColor; e.currentTarget.style.backgroundColor = darkMode ? '#1f1f1f' : '#f0f0f0'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = subtleColor; e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <X size={13} />
                  </button>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { icon: '📌', label: 'What is the news?', content: summaryData.what, isText: true },
                    { icon: '🔍', label: 'Why / How?', content: summaryData.why_how, isText: false },
                    { icon: '✅', label: 'Conclusion', content: summaryData.conclusion, isText: true },
                  ].map(({ icon, label, content, isText }, i, arr) => (
                    <div key={label}>
                      <strong style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textColor, marginBottom: 4 }}>
                        {icon} {label}
                      </strong>
                      {isText
                        ? <div style={{ fontSize: 13, color: mutedColor, lineHeight: 1.6 }}>{content}</div>
                        : formatBullets(content)
                      }
                      {i < arr.length - 1 && (
                        <div style={{ height: 1, backgroundColor: darkMode ? '#1f1f1f' : '#e8e8e8', marginTop: 14 }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Summarizing Skeleton ── */}
        <AnimatePresence>
          {isSummarizing && !summaryData && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                marginTop: 16, padding: 16,
                backgroundColor: summaryBg,
                borderLeft: `3px solid ${badgeColor}`,
                borderRadius: 10,
                border: `1px solid ${cardBorderDefault}`,
                borderLeftWidth: 3,
                borderLeftColor: badgeColor,
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                {[['30%', 12], ['90%', 18], ['65%', 18], ['25%', 12], ['85%', 40]].map(([w, h], i) => (
                  <div key={i} className="skeleton" style={{ width: w, height: h, borderRadius: 6 }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.article>
  );
}
