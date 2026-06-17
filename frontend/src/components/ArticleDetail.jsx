import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ExternalLink, Sparkles, ChevronLeft, ChevronRight, Newspaper, Zap, CheckCircle } from 'lucide-react';

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

function formatBullets(text, mutedColor) {
  if (!text) return null;
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const items = lines.length > 1 || text.startsWith('-') || text.startsWith('*') ? lines : [text];
  return (
    <ul style={{ paddingLeft: 0, margin: '8px 0 0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((line, i) => (
        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{
            flexShrink: 0, marginTop: 6,
            width: 6, height: 6, borderRadius: '50%',
            backgroundColor: mutedColor, display: 'inline-block',
          }} />
          <span style={{ fontSize: 14, color: mutedColor, lineHeight: 1.6 }}>
            {line.replace(/^[-*]\s*/, '')}
          </span>
        </li>
      ))}
    </ul>
  );
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

  const bg          = darkMode ? '#080808' : '#f4f4f6';
  const cardBg      = darkMode ? '#111111' : '#ffffff';
  const border      = darkMode ? '#222' : '#e0e0e8';
  const textColor   = darkMode ? '#ffffff' : '#0a0a0a';
  const mutedColor  = darkMode ? '#aaa' : '#4b5563';
  const subtleColor = darkMode ? '#555' : '#9ca3af';

  const hasDbSummary = summary && summary.what;
  const [summaryData, setSummaryData] = useState(hasDbSummary ? summary : null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [showSummary, setShowSummary] = useState(!!hasDbSummary);

  const handleSummarize = async () => {
    if (summaryData) { setShowSummary(true); return; }
    setIsSummarizing(true);
    setSummaryError('');
    try {
      const API_BASE = process.env.REACT_APP_API_URL || '';
      const res = await fetch(`${API_BASE}/api/summarize`, {
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ 
        height: '100vh', 
        width: '100vw',
        overflow: 'hidden', 
        backgroundColor: bg, 
        fontFamily: 'Inter, sans-serif',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* ── Header (Fixed Height) ── */}
      <div style={{
        height: 64, flexShrink: 0,
        backgroundColor: darkMode ? 'rgba(8,8,8,0.85)' : 'rgba(255,255,255,0.85)',
        borderBottom: `1px solid ${border}`,
        padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(16px)', zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 12,
              border: `1px solid ${border}`, backgroundColor: cardBg,
              color: textColor, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          {onPrev && onNext && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
              <button onClick={onPrev} disabled={!hasPrev} style={{
                width: 36, height: 36, borderRadius: 10, border: `1px solid ${border}`,
                backgroundColor: cardBg, color: hasPrev ? textColor : subtleColor,
                cursor: hasPrev ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: hasPrev ? 1 : 0.5, transition: 'all 0.2s'
              }}>
                <ChevronLeft size={18} />
              </button>
              <button onClick={onNext} disabled={!hasNext} style={{
                width: 36, height: 36, borderRadius: 10, border: `1px solid ${border}`,
                backgroundColor: cardBg, color: hasNext ? textColor : subtleColor,
                cursor: hasNext ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: hasNext ? 1 : 0.5, transition: 'all 0.2s'
              }}>
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        <a href={url} target="_blank" rel="noopener noreferrer" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 20px', borderRadius: 12, backgroundColor: '#000',
          color: '#fff', fontSize: 14, fontWeight: 600,
          textDecoration: 'none', transition: 'all 0.2s',
        }}>
          Read Full Article <ExternalLink size={14} />
        </a>
      </div>

      {/* ── Main Dashboard Area (Fills remaining height perfectly) ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: 24,
        padding: 24,
        overflow: 'hidden', // No scrolling allowed on the main wrapper
      }}>
        
        {/* ── LEFT PANEL: Hero Card ── */}
        <div style={{
          flex: '0 0 40%', 
          position: 'relative',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          backgroundColor: '#000'
        }}>
          <img
            src={displayImage}
            alt={title}
            style={{ 
              position: 'absolute', inset: 0, 
              width: '100%', height: '100%', objectFit: 'cover', 
              opacity: 0.6 
            }}
            onError={e => { e.currentTarget.src = STOCK_IMAGES[0]; }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 100%)',
          }} />
          
          <div style={{ position: 'relative', padding: 32, zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 999,
                backgroundColor: badgeColor,
              }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {source}
                </span>
              </div>
              {formattedDate && (
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{formattedDate}</span>
              )}
            </div>
            
            <h1 style={{
              fontSize: 32, fontWeight: 800, color: '#fff',
              lineHeight: 1.25, letterSpacing: '-0.02em', margin: 0,
            }}>
              {title}
            </h1>
          </div>
        </div>

        {/* ── RIGHT PANEL: AI Summary Grid ── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: cardBg,
          borderRadius: 24,
          border: `1px solid ${border}`,
          padding: 24,
          overflow: 'hidden', // Ensures the panel itself never scrolls outside
          boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
        }}>
          
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexShrink: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: textColor, margin: 0 }}>AI Digest</h2>
            
            {!showSummary && !isSummarizing && (
              <button
                onClick={handleSummarize}
                style={{
                  marginLeft: 'auto', padding: '8px 20px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                }}
              >
                Generate Summary
              </button>
            )}
          </div>

          <div style={{ height: 1, backgroundColor: border, marginBottom: 20, flexShrink: 0 }} />

          {/* Grid Content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
              {isSummarizing && (
                <motion.div key="skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '100%' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
                    <div className="skeleton" style={{ width: '100%', height: '30%', borderRadius: 16 }} />
                    <div style={{ display: 'flex', gap: 16, flex: 1 }}>
                      <div className="skeleton" style={{ flex: 1, borderRadius: 16 }} />
                      <div className="skeleton" style={{ flex: 1, borderRadius: 16 }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {showSummary && summaryData && (
                <motion.div key="summary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ height: '100%' }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gridTemplateRows: 'auto minmax(0, 1fr)', 
                    gap: 16, 
                    height: '100%' 
                  }}>
                    
                    {/* What is the news (Spans full width top) */}
                    <div style={{
                      gridColumn: '1 / -1',
                      padding: 20, borderRadius: 16,
                      backgroundColor: darkMode ? '#1a1a1a' : '#f9fafb',
                      border: `1px solid ${border}`, borderLeft: `4px solid ${textColor}`,
                      display: 'flex', flexDirection: 'column'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Newspaper size={16} color={textColor} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: textColor, textTransform: 'uppercase' }}>What is the news?</span>
                      </div>
                      <p style={{ fontSize: 15, color: textColor, margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
                        {summaryData.what}
                      </p>
                    </div>

                    {/* Why / How (Left Column, Scrollable internally if needed) */}
                    <div style={{
                      padding: 20, borderRadius: 16,
                      backgroundColor: darkMode ? '#1a1a1a' : '#f9fafb',
                      border: `1px solid ${border}`, borderLeft: `4px solid ${textColor}`,
                      display: 'flex', flexDirection: 'column',
                      overflowY: 'auto'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexShrink: 0 }}>
                        <Zap size={16} color={textColor} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: textColor, textTransform: 'uppercase' }}>Why / How?</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        {formatBullets(summaryData.why_how, mutedColor)}
                      </div>
                    </div>

                    {/* Conclusion (Right Column, Scrollable internally if needed) */}
                    <div style={{
                      padding: 20, borderRadius: 16,
                      backgroundColor: darkMode ? '#1a1a1a' : '#f9fafb',
                      border: `1px solid ${border}`, borderLeft: `4px solid ${textColor}`,
                      display: 'flex', flexDirection: 'column',
                      overflowY: 'auto'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexShrink: 0 }}>
                        <CheckCircle size={16} color={textColor} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: textColor, textTransform: 'uppercase' }}>Conclusion</span>
                      </div>
                      <p style={{ fontSize: 14, color: mutedColor, margin: 0, lineHeight: 1.6 }}>
                        {summaryData.conclusion}
                      </p>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {summaryError && <p style={{ color: '#ef4444', fontSize: 13, margin: '12px 0 0' }}>{summaryError}</p>}
        </div>
      </div>
    </motion.div>
  );
}
