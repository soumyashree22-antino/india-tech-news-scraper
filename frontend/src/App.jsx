import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import ArticleCard from './components/ArticleCard';
import ArticleDetail from './components/ArticleDetail';
import FilterBar from './components/FilterBar';
import './index.css';

const SOURCES = [
  { key: 'toi',    label: 'Times of India',   color: '#ef4444' },
  { key: 'hindu',  label: 'The Hindu',         color: '#3b82f6' },
  { key: 'ht',     label: 'Hindustan Times',   color: '#f97316' },
  { key: 'et',     label: 'Economic Times',    color: '#22c55e' },
  { key: 'ie',     label: 'Indian Express',    color: '#a855f7' },
  { key: 'inc42',  label: 'Inc42',             color: '#ec4899' },
  { key: 'lapaas', label: 'Lapaas Voice',      color: '#06b6d4' },
];

const DOMAINS = [
  { key: 'tech',     label: 'Tech & Gadgets',          keywords: ['tech', 'software', 'app', 'smartphone', 'gadget', 'apple', 'google', 'microsoft', 'cybersecurity', 'device', 'it sector'] },
  { key: 'ai',       label: 'Artificial Intelligence', keywords: ['ai ', ' ai', 'artificial intelligence', 'machine learning', 'llm', 'generative', 'openai', 'chatgpt', 'algorithm'] },
  { key: 'startups', label: 'Startups & Funding',      keywords: ['startup', 'founder', 'funding', 'seed', 'venture', 'incubator', 'unicorn', 'investor', 'capital'] },
  { key: 'economy',  label: 'Economy & Markets',       keywords: ['economy', 'market', 'bse', 'nse', 'inflation', 'revenue', 'profit', 'stock', 'shares', 'finance', 'rbi'] },
];

function AnimatedCounter({ value }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!value) return;
    let start = 0;
    const increment = value / 60;
    let timer = setInterval(() => {
      start += increment;
      if (start >= value) { setCount(value); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{count.toLocaleString()}</span>;
}

function NewsTicker({ articles }) {
  if (!articles || articles.length === 0) return null;
  const items = [...articles, ...articles]; // duplicate for seamless loop
  return (
    <div className="ticker-wrap flex-1 mx-8">
      <div className="ticker-track">
        {items.map((a, i) => (
          <span key={i} className="flex items-center gap-3 shrink-0 pr-12 text-[11px]" style={{ color: '#555' }}>
            <span className="w-1 h-1 rounded-full bg-[#333] shrink-0" />
            {a.title}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [articles, setArticles] = useState([]);
  const [status, setStatus] = useState({ last_run: 'Unknown', next_run: 'Unknown', total_articles_in_db: 0, articles_today: 0 });
  const [loading, setLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Filters
  const [globalSearch, setGlobalSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [activeSource, setActiveSource] = useState('all');
  const [activeDomain, setActiveDomain] = useState('all');

  // View State
  const [viewMode, setViewMode] = useState('grid');
  const [singleViewIndex, setSingleViewIndex] = useState(0);

  useEffect(() => {
    document.documentElement.className = darkMode ? '' : 'light';
  }, [darkMode]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const fetchArticles = useCallback(async (filter) => {
    setLoading(true);
    try {
      const endpoint = filter === 'today' ? '/api/articles/today' : '/api/articles';
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.success) setArticles(data.articles || []);
    } catch (err) {
      console.error('[App] Failed to fetch articles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.success) setStatus(data);
    } catch (err) {
      console.error('[App] Failed to fetch status:', err);
    }
  }, []);

  useEffect(() => { fetchArticles('today'); fetchStatus(); }, [fetchArticles, fetchStatus]);

  const filteredArticles = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today); last7Days.setDate(last7Days.getDate() - 7);

    return articles.filter(a => {
      if (dateFilter !== 'all' && a.scraped_at) {
        const d = new Date(a.scraped_at);
        if (dateFilter === 'today' && d < today) return false;
        if (dateFilter === 'yesterday' && (d < yesterday || d >= today)) return false;
        if (dateFilter === 'last7days' && d < last7Days) return false;
      }
      if (activeSource !== 'all' && a.source !== SOURCES.find(s => s.key === activeSource)?.label) return false;
      if (activeDomain !== 'all') {
        const dom = DOMAINS.find(d => d.key === activeDomain);
        if (dom) {
          const txt = `${a.title} ${a.summary?.what || ''} ${a.summary?.why_how || ''}`.toLowerCase();
          if (!dom.keywords.some(kw => txt.includes(kw))) return false;
        }
      }
      if (globalSearch) {
        const q = globalSearch.toLowerCase();
        if (!a.title.toLowerCase().includes(q) && !(a.summary?.what || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [articles, dateFilter, activeSource, activeDomain, globalSearch]);

  useEffect(() => { setSingleViewIndex(0); }, [filteredArticles]);

  const handleManualScrape = async () => {
    setIsScraping(true);
    const scrapePromise = fetch('/api/scrape/manual', { method: 'POST' })
      .then(async () => { await fetchStatus(); await fetchArticles(dateFilter); })
      .catch(err => { console.error('[App] Manual scrape failed:', err); throw err; })
      .finally(() => setIsScraping(false));

    toast.promise(scrapePromise, {
      loading: 'Scraping all 7 sources...',
      success: 'Articles updated successfully!',
      error: 'Scrape failed. Please try again.',
    }, {
      style: { background: '#111', color: '#fff', border: '1px solid #222', fontSize: '13px' },
      success: { icon: '✓' },
      error: { icon: '✗' },
    });
  };

  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
    fetchArticles(filter === 'today' ? 'today' : 'all');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.055 } }
  };

  const DATE_LABELS = { today: 'Today', yesterday: 'Yesterday', last7days: 'Last 7 Days', all: 'All' };

  return (
    <div style={{ backgroundColor: 'var(--background)', color: 'var(--text)', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Toaster position="bottom-right" />

      {/* ══ Article Detail View ══ */}
      <AnimatePresence>
        {selectedArticle && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, overflowY: 'auto', backgroundColor: darkMode ? '#080808' : '#ffffff' }}>
            <ArticleDetail
              article={selectedArticle}
              darkMode={darkMode}
              onBack={() => setSelectedArticle(null)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════ STATUS BAR ══════════════════ */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        backgroundColor: 'var(--status-bg)',
        borderBottom: '1px solid #1f1f1f',
        height: scrolled ? '36px' : '40px',
        transition: 'height 0.2s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', gap: '16px'
      }}>
        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
            <span className="animate-ping" style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: '#22c55e', opacity: 0.7 }} />
            <span style={{ position: 'relative', borderRadius: '50%', width: 8, height: 8, backgroundColor: '#22c55e', display: 'inline-block' }} />
          </span>
          <span style={{ color: '#22c55e', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Live</span>
        </div>

        {/* Ticker */}
        <NewsTicker articles={filteredArticles.slice(0, 20)} />

        {/* Stats */}
        <div style={{ flexShrink: 0, fontSize: 11, color: '#555', display: 'flex', alignItems: 'center', gap: 16 }}>
          <span>
            Last scraped: <span style={{ color: '#888' }}>
              {status.last_run === 'Unknown' ? 'Just now' : new Date(status.last_run).toLocaleTimeString()}
            </span>
          </span>
          <span style={{ color: '#333' }}>·</span>
          <span style={{ color: '#888' }}><AnimatedCounter value={status.total_articles_in_db} /> indexed</span>
        </div>
      </div>

      {/* ══════════════════ HEADER ══════════════════ */}
      <header className={`header-glow header-grid`} style={{ padding: '80px 24px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Antino Logo */}
        <a href="https://antino.com" target="_blank" rel="noreferrer" style={{ position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img
            src="https://www.antino.com/assets/images/Logo.svg"
            alt="Antino Labs"
            style={{ height: 22, opacity: 0.7, filter: darkMode ? 'brightness(0) invert(1)' : 'none', transition: 'opacity 0.2s' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </a>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(d => !d)}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            position: 'absolute', top: 24, right: 24,
            width: 36, height: 36, borderRadius: '50%',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="title-shimmer"
          style={{ fontSize: 72, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, marginBottom: 20 }}
        >
          India Tech News
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.7 }}
        >
          Aggregating live tech &amp; AI insights from India's top sources, powered by AI summaries.
        </motion.p>

        {/* Stat Pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}
        >
          {[
            { label: `${status.total_articles_in_db} Articles`, dot: '#6366f1' },
            { label: '7 Sources', dot: '#22c55e' },
            { label: 'Updated Daily', dot: '#f97316' },
          ].map(({ label, dot }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '6px 14px', borderRadius: 999,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              fontSize: 12, fontWeight: 500, color: 'var(--muted)'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: dot, flexShrink: 0 }} />
              {label}
            </div>
          ))}
        </motion.div>
      </header>

      {/* ══════════════════ CONTROLS ══════════════════ */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px 80px' }}>

        <FilterBar
          sources={SOURCES}
          domains={DOMAINS}
          activeSource={activeSource}
          activeDomain={activeDomain}
          onSourceChange={setActiveSource}
          onDomainChange={setActiveDomain}
          globalSearch={globalSearch}
          onSearchChange={setGlobalSearch}
          dateFilter={dateFilter}
          onDateChange={handleDateFilterChange}
          viewMode={viewMode}
          onViewChange={setViewMode}
          isScraping={isScraping}
          onManualScrape={handleManualScrape}
          darkMode={darkMode}
        />


        {/* ══════════════════ ARTICLES ══════════════════ */}
        {loading ? (
          /* Skeleton grid */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ borderRadius: 16, border: '1px solid var(--border)', backgroundColor: 'var(--surface)', overflow: 'hidden' }}>
                <div className="skeleton" style={{ height: 220, width: '100%' }} />
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="skeleton" style={{ height: 12, width: '30%', borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 18, width: '90%', borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 18, width: '70%', borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 40, width: '100%', borderRadius: 8, marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredArticles.length > 0 ? (
          viewMode === 'grid' ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}
            >
              {filteredArticles.map((article, idx) => (
                <ArticleCard key={article.id || idx} article={article} darkMode={darkMode} onReadInApp={setSelectedArticle} />
              ))}
            </motion.div>
          ) : (
            /* Single View — full ArticleDetail layout with built-in Prev/Next */
            filteredArticles[singleViewIndex] && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={singleViewIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}
                >
                  <ArticleDetail
                    article={filteredArticles[singleViewIndex]}
                    darkMode={darkMode}
                    onBack={() => setViewMode('grid')}
                    onPrev={() => setSingleViewIndex(i => Math.max(0, i - 1))}
                    onNext={() => setSingleViewIndex(i => Math.min(filteredArticles.length - 1, i + 1))}
                    hasPrev={singleViewIndex > 0}
                    hasNext={singleViewIndex < filteredArticles.length - 1}
                    currentIndex={singleViewIndex}
                    total={filteredArticles.length}
                  />
                </motion.div>
              </AnimatePresence>
            )
          )
        ) : (
          /* Empty state */
          <div style={{ textAlign: 'center', padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="31" stroke="var(--border)" strokeWidth="2" />
              <path d="M22 32h20M32 22v20" stroke="var(--border)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>No articles found</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>Try a different filter or time range</p>
            <button
              onClick={() => { setActiveSource('all'); setActiveDomain('all'); setGlobalSearch(''); handleDateFilterChange('today'); }}
              style={{
                marginTop: 8, padding: '10px 22px', borderRadius: 10,
                border: '1px solid #6366f1', backgroundColor: '#6366f115',
                color: '#6366f1', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                fontFamily: 'Inter',
              }}
            >
              Clear all filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
