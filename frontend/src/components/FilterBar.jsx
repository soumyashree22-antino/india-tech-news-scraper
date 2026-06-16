import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import {
  Search, RefreshCw, Grid, LayoutList,
  Newspaper, Tag, Cpu, Bot, TrendingUp, BarChart2, LayoutGrid,
} from 'lucide-react';

const TOPIC_ICONS = {
  all:      LayoutGrid,
  tech:     Cpu,
  ai:       Bot,
  startups: TrendingUp,
  economy:  BarChart2,
};

const DATE_OPTIONS = [
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7days', label: 'Last 7 Days' },
  { key: 'all',       label: 'All' },
];

export default function FilterBar({
  sources,
  domains,
  activeSource,
  activeDomain,
  onSourceChange,
  onDomainChange,
  globalSearch,
  onSearchChange,
  dateFilter,
  onDateChange,
  viewMode,
  onViewChange,
  isScraping,
  onManualScrape,
  darkMode,
}) {
  const [searchFocused, setSearchFocused] = useState(false);

  const bg = darkMode ? '#111111' : '#ffffff';
  const border = darkMode ? '#262626' : '#efefef';
  const filterBg = darkMode ? '#0e0e0e' : '#f9f9f9';
  const textColor = darkMode ? '#ffffff' : '#111111';
  const mutedColor = darkMode ? '#777' : '#999';
  const subtleColor = darkMode ? '#2a2a2a' : '#f0f0f0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>

      {/* ━━━━ ROW 1: Controls ━━━━ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Manual Scrape */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onManualScrape}
          disabled={isScraping}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 18px', borderRadius: 10,
            backgroundColor: darkMode ? '#1a1a1a' : '#111',
            color: '#fff',
            border: 'none',
            fontSize: 13, fontWeight: 600,
            cursor: isScraping ? 'not-allowed' : 'pointer',
            opacity: isScraping ? 0.7 : 1,
            fontFamily: 'Inter, sans-serif',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => { if (!isScraping) e.currentTarget.style.backgroundColor = '#333'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = darkMode ? '#1a1a1a' : '#111'; }}
        >
          <motion.div animate={{ rotate: isScraping ? 360 : 0 }} transition={{ repeat: isScraping ? Infinity : 0, duration: 1, ease: 'linear' }}>
            <RefreshCw size={14} />
          </motion.div>
          {isScraping ? 'Scraping...' : 'Manual Scrape'}
        </motion.button>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search
            size={14}
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: mutedColor, pointerEvents: 'none', transition: 'color 0.2s' }}
          />
          <input
            type="search"
            value={globalSearch}
            onChange={e => onSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search across all sources..."
            style={{
              width: '100%',
              paddingLeft: 40, paddingRight: globalSearch ? 36 : 14,
              paddingTop: 9, paddingBottom: 9,
              borderRadius: 10,
              border: `1px solid ${searchFocused ? '#6366f1' : border}`,
              backgroundColor: searchFocused ? bg : filterBg,
              color: textColor,
              fontSize: 13, outline: 'none',
              fontFamily: 'Inter, sans-serif',
              boxShadow: searchFocused ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
              transition: 'all 0.2s',
            }}
          />
          {/* Keyboard shortcut badge */}
          <AnimatePresence>
            {!searchFocused && !globalSearch && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  display: 'flex', alignItems: 'center', gap: 3,
                  padding: '2px 7px', borderRadius: 6,
                  border: `1px solid ${border}`,
                  backgroundColor: filterBg,
                  fontSize: 11, color: mutedColor, fontFamily: 'Inter, sans-serif',
                  pointerEvents: 'none',
                }}
              >
                <span style={{ fontSize: 10 }}>⌘</span> K
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Date Pill Group */}
        <div style={{
          display: 'flex', position: 'relative',
          padding: 4, borderRadius: 10,
          border: `1px solid ${border}`,
          backgroundColor: filterBg,
          gap: 2, flexShrink: 0,
        }}>
          {DATE_OPTIONS.map(({ key, label }) => {
            const isActive = dateFilter === key;
            return (
              <button
                key={key}
                onClick={() => onDateChange(key)}
                style={{
                  position: 'relative', padding: '6px 14px', borderRadius: 7,
                  border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: isActive ? 600 : 500,
                  color: isActive ? (darkMode ? '#fff' : '#111') : mutedColor,
                  backgroundColor: 'transparent',
                  fontFamily: 'Inter, sans-serif',
                  zIndex: 1, transition: 'color 0.2s',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="date-indicator"
                    style={{
                      position: 'absolute', inset: 0, borderRadius: 7,
                      backgroundColor: darkMode ? '#222' : '#fff',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                      zIndex: -1,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                {label}
              </button>
            );
          })}
        </div>

        {/* Grid / List Toggle */}
        <div style={{
          display: 'flex', padding: 4, borderRadius: 10,
          border: `1px solid ${border}`, backgroundColor: filterBg, gap: 2, flexShrink: 0,
        }}>
          {[{ mode: 'grid', Icon: Grid }, { mode: 'single', Icon: LayoutList }].map(({ mode, Icon }) => {
            const isActive = viewMode === mode;
            return (
              <button
                key={mode}
                onClick={() => onViewChange(mode)}
                style={{
                  position: 'relative', width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 7, border: 'none', cursor: 'pointer',
                  backgroundColor: 'transparent',
                  color: isActive ? (darkMode ? '#fff' : '#111') : mutedColor,
                  zIndex: 1, transition: 'color 0.2s',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="view-indicator"
                    style={{
                      position: 'absolute', inset: 0, borderRadius: 7,
                      backgroundColor: darkMode ? '#222' : '#fff',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                      zIndex: -1,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <Icon size={15} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ━━━━ ROW 2: Sources + Topics ━━━━ */}
      <div style={{
        backgroundColor: filterBg,
        border: `1px solid ${border}`,
        borderRadius: 14, overflow: 'hidden',
      }}>

        {/* Sources row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '12px 16px' }}>
          {/* Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 100, flexShrink: 0 }}>
            <Newspaper size={13} color={mutedColor} />
            <span style={{ fontSize: 11, fontWeight: 700, color: mutedColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Sources
            </span>
          </div>
          {/* Divider */}
          <div style={{ width: 1, height: 22, backgroundColor: border, flexShrink: 0, marginRight: 16 }} />

          {/* Pills */}
          <div className="scrollbar-hide" style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 1 }}>
            {/* All Sources */}
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => onSourceChange('all')}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 14px', borderRadius: 999,
                border: `1px solid ${activeSource === 'all' ? (darkMode ? '#fff' : '#111') : border}`,
                backgroundColor: activeSource === 'all' ? (darkMode ? '#fff' : '#111') : 'transparent',
                color: activeSource === 'all' ? (darkMode ? '#111' : '#fff') : mutedColor,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
              }}
            >
              <LayoutGrid size={12} />
              All Sources
            </motion.button>

            {sources.map((s, i) => {
              const isActive = activeSource === s.key;
              return (
                <motion.button
                  key={s.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => onSourceChange(s.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '5px 14px', borderRadius: 999,
                    border: `1px solid ${isActive ? s.color + '99' : border}`,
                    backgroundColor: isActive ? s.color + '18' : 'transparent',
                    color: isActive ? s.color : (darkMode ? '#ccc' : '#555'),
                    fontSize: 13, fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    fontFamily: 'Inter, sans-serif', transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = subtleColor; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', backgroundColor: s.color, flexShrink: 0,
                    boxShadow: isActive ? `0 0 6px ${s.color}` : 'none',
                    transition: 'box-shadow 0.2s',
                  }} />
                  {s.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Horizontal divider */}
        <div style={{ height: 1, backgroundColor: border, margin: '0 16px' }} />

        {/* Topics row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '12px 16px' }}>
          {/* Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 100, flexShrink: 0 }}>
            <Tag size={13} color={mutedColor} />
            <span style={{ fontSize: 11, fontWeight: 700, color: mutedColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Topics
            </span>
          </div>
          {/* Divider */}
          <div style={{ width: 1, height: 22, backgroundColor: border, flexShrink: 0, marginRight: 16 }} />

          {/* Pills */}
          <div className="scrollbar-hide" style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 1 }}>
            {[{ key: 'all', label: 'All Topics' }, ...domains].map((d, i) => {
              const isActive = activeDomain === d.key;
              const TopicIcon = TOPIC_ICONS[d.key] || LayoutGrid;
              const accent = '#6366f1';
              return (
                <motion.button
                  key={d.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => onDomainChange(d.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 14px', borderRadius: 999,
                    border: isActive
                      ? (d.key === 'all' ? `1px solid ${darkMode ? '#fff' : '#111'}` : `1px solid ${accent}99`)
                      : `1px solid ${border}`,
                    backgroundColor: isActive
                      ? (d.key === 'all' ? (darkMode ? '#fff' : '#111') : accent + '15')
                      : 'transparent',
                    color: isActive
                      ? (d.key === 'all' ? (darkMode ? '#111' : '#fff') : accent)
                      : (darkMode ? '#ccc' : '#555'),
                    fontSize: 13, fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    fontFamily: 'Inter, sans-serif', transition: 'all 0.15s ease',
                    boxShadow: isActive && d.key !== 'all' ? `0 0 12px rgba(99,102,241,0.2)` : 'none',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = subtleColor; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <TopicIcon size={12} />
                  {d.label}
                </motion.button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
