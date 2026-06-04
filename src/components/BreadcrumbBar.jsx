/**
 * BreadcrumbBar.jsx
 * Navigation bar at the top of the tree canvas.
 * Shows: Home > Tree Name > [Back]
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ChevronRight, ArrowLeft, TreePine, Search } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function BreadcrumbBar({ tree, onSearchClick }) {
  const navigate = useNavigate();
  const { state, popHistory } = useAppContext();

  const canGoBack = state.navigationHistory.length > 0;

  function handleHome() {
    navigate('/');
  }

  function handleBack() {
    if (canGoBack) {
      const prevTreeId = state.navigationHistory[state.navigationHistory.length - 1];
      popHistory();
      navigate(`/tree/${prevTreeId}`);
    } else {
      navigate('/');
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'rgba(255,248,240,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--color-border)',
      boxShadow: '0 2px 16px rgba(123,63,0,0.08)',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 1.5rem',
      gap: '0.75rem',
    }}>
      {/* Home button */}
      <button
        id="btn-breadcrumb-home"
        onClick={handleHome}
        title="Go to Home"
        style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '7px',
          border: 'none',
          background: 'transparent',
          color: 'var(--color-muted)',
          fontSize: '0.8rem',
          fontWeight: 600,
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,169,106,0.12)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-muted)'; }}
      >
        <Home size={14} /> Home
      </button>

      <ChevronRight size={14} color="var(--color-border)" />

      {/* Tree name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <TreePine size={15} color="var(--color-primary)" />
        <span style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-primary)',
          fontSize: '0.95rem',
          fontWeight: 700,
        }}>
          {tree?.name || 'Family Tree'}
        </span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Search button */}
      {onSearchClick && (
        <button
          id="btn-global-search"
          onClick={onSearchClick}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.4rem 0.875rem',
            borderRadius: '20px',
            border: '1px solid var(--color-border)',
            background: 'rgba(212,169,106,0.08)',
            color: 'var(--color-muted)',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-muted)'; }}
        >
          <Search size={13} /> Search people...
        </button>
      )}

      {/* Back button */}
      <button
        id="btn-breadcrumb-back"
        onClick={handleBack}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.4rem 0.875rem',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          background: canGoBack ? 'var(--color-primary)' : 'transparent',
          color: canGoBack ? '#FFF8F0' : 'var(--color-muted)',
          fontSize: '0.8rem',
          fontWeight: 600,
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: canGoBack ? '0 2px 8px rgba(123,63,0,0.25)' : 'none',
        }}
        onMouseEnter={e => { if (!canGoBack) { e.currentTarget.style.background = 'rgba(212,169,106,0.1)'; } else { e.currentTarget.style.opacity = '0.9'; }}}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = canGoBack ? 'var(--color-primary)' : 'transparent'; }}
      >
        <ArrowLeft size={13} /> Back
      </button>
    </div>
  );
}
