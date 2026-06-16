/**
 * SourceSection.jsx
 *
 * Renders a full collapsible section for ONE newspaper source:
 *  - Header row: source name, badge, article count, Scrape button, timestamp
 *  - Loading state: spinner + message
 *  - Error state: error banner
 *  - Articles: responsive card grid (filtered by globalSearch)
 */

import React, { useState } from 'react';
import ArticleCard from './ArticleCard';

export default function SourceSection({ source, state, onScrape, globalSearch }) {
  const { label, shortLabel, color, icon, key } = source;
  const { articles, loading, error, scrapedAt } = state;
  const [collapsed, setCollapsed] = useState(false);

  // Filter articles by global search query
  const lower = globalSearch.trim().toLowerCase();
  const displayed = lower
    ? articles.filter((a) =>
        `${a.title} ${a.summary}`.toLowerCase().includes(lower)
      )
    : articles;

  const formattedTime = scrapedAt
    ? new Date(scrapedAt).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      })
    : null;

  const hasResults = articles.length > 0;
  const showEmpty  = !loading && !error && hasResults && displayed.length === 0;

  return (
    <section
      className="source-section"
      id={`section-${key}`}
      style={{ '--source-color': color }}
    >
      {/* ── Section Header ── */}
      <div className="source-header">
        <div className="source-header-left">
          {/* Colour accent bar */}
          <span className="source-accent-bar" style={{ background: color }} />

          <span className="source-icon" aria-hidden="true">{icon}</span>

          <div className="source-title-group">
            <h2 className="source-title">{label}</h2>
            {hasResults && !loading && (
              <span className="source-article-count" style={{ color }}>
                {displayed.length !== articles.length
                  ? `${displayed.length} / ${articles.length} articles`
                  : `${articles.length} articles`}
              </span>
            )}
            {formattedTime && (
              <span className="source-timestamp">· scraped {formattedTime}</span>
            )}
          </div>
        </div>

        <div className="source-header-right">
          {/* Scrape button */}
          <button
            id={`scrape-btn-${key}`}
            className="scrape-btn source-scrape-btn"
            style={loading ? {} : { background: color }}
            onClick={onScrape}
            disabled={loading}
            aria-busy={loading}
          >
            <span
              className={`btn-icon ${loading ? 'spinning' : ''}`}
              aria-hidden="true"
            >
              ⟳
            </span>
            {loading ? 'Scraping…' : `Scrape ${shortLabel}`}
          </button>

          {/* Collapse toggle (only when there are results) */}
          {hasResults && (
            <button
              className="collapse-btn"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand section' : 'Collapse section'}
              title={collapsed ? 'Show articles' : 'Hide articles'}
            >
              {collapsed ? '▼' : '▲'}
            </button>
          )}
        </div>
      </div>

      {/* ── Content area ── */}
      {!collapsed && (
        <div className="source-body">
          {/* Loading */}
          {loading && (
            <div className="source-loading">
              <div
                className="source-spinner"
                style={{ borderTopColor: color }}
                aria-hidden="true"
              />
              <p className="source-loading-text">
                Fetching articles from <strong>{label}</strong>…
                <span className="source-loading-sub"> this may take 20–40 seconds</span>
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="source-error" role="alert">
              <span aria-hidden="true">⚠️</span>
              <div>
                <strong>Failed to scrape {label}</strong>
                <p>{error}</p>
              </div>
              <button
                className="retry-btn"
                onClick={onScrape}
                style={{ borderColor: color, color }}
              >
                Retry
              </button>
            </div>
          )}

          {/* No-results initial state */}
          {!loading && !error && !hasResults && (
            <div className="source-empty-initial">
              <span aria-hidden="true">📰</span>
              <p>Click <strong>Scrape {shortLabel}</strong> to fetch articles</p>
            </div>
          )}

          {/* Search empty state */}
          {showEmpty && (
            <div className="source-empty-search">
              No articles from <strong>{label}</strong> match "<em>{globalSearch}</em>"
            </div>
          )}

          {/* Article grid */}
          {!loading && displayed.length > 0 && (
            <div className="article-grid source-article-grid">
              {displayed.map((article, idx) => (
                <ArticleCard key={`${key}-${idx}`} article={article} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Collapsed summary */}
      {collapsed && hasResults && (
        <div className="source-collapsed-bar" style={{ borderColor: color }}>
          {articles.length} articles hidden · click ▼ to expand
        </div>
      )}
    </section>
  );
}
