/**
 * GlobalSearch.jsx
 * 5D — Full-screen global search across all persons in all trees.
 * Triggered from BreadcrumbBar search button.
 */

import { useState, useEffect, useRef } from 'react';
import { Search, X, ExternalLink, TreePine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { searchPersons, getTreeName, formatDateShort } from '../utils/familyUtils';

export default function GlobalSearch({ onClose }) {
  const { state, pushHistory, setActiveTree } = useAppContext();
  const { persons, trees, activeTreeId } = state;
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [query, setQuery] = useState('');

  // Autofocus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Escape key closes
  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const results = query.trim().length >= 1
    ? searchPersons(query, persons)
    : [];

  function handleResultClick(person) {
    // Push history if navigating away from current tree
    if (activeTreeId && activeTreeId !== person.treeId) {
      pushHistory(activeTreeId);
    }
    setActiveTree(person.treeId);
    navigate(`/tree/${person.treeId}?highlight=${person.id}`);
    onClose();
  }

  // Group results by tree
  const grouped = {};
  for (const person of results) {
    const treeName = getTreeName(person, trees);
    if (!grouped[treeName]) grouped[treeName] = [];
    grouped[treeName].push(person);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(44,26,14,0.5)',
          backdropFilter: 'blur(6px)',
          zIndex: 600,
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: '10vh',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '580px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '18px',
        boxShadow: '0 24px 64px rgba(44,26,14,0.3)',
        zIndex: 700,
        overflow: 'hidden',
        animation: 'searchIn 0.2s ease',
      }}>
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '1rem 1.25rem',
          borderBottom: query.trim() && results.length > 0
            ? '1px solid rgba(212,169,106,0.2)'
            : 'none',
        }}>
          <Search size={20} color="var(--color-primary)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            id="global-search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search any person across all trees…"
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: '1.05rem', fontFamily: 'var(--font-body)',
              color: 'var(--color-text)', outline: 'none',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', padding: '2px' }}
            >
              <X size={16} />
            </button>
          )}
          <kbd style={{
            fontSize: '0.7rem', background: 'rgba(212,169,106,0.15)',
            border: '1px solid var(--color-border)',
            borderRadius: '5px', padding: '2px 6px',
            color: 'var(--color-muted)', fontFamily: 'var(--font-body)',
            flexShrink: 0,
          }}>ESC</kbd>
        </div>

        {/* Results */}
        {query.trim() && (
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {results.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</p>
                <p style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
                  No persons match "<strong>{query}</strong>"
                </p>
              </div>
            ) : (
              Object.entries(grouped).map(([treeName, treePersons]) => (
                <div key={treeName}>
                  {/* Tree group header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.5rem 1.25rem 0.3rem',
                    background: 'rgba(253,240,224,0.4)',
                    borderBottom: '1px solid rgba(212,169,106,0.1)',
                  }}>
                    <TreePine size={12} color="var(--color-primary)" />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {treeName}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
                      ({treePersons.length})
                    </span>
                  </div>

                  {treePersons.map(person => (
                    <SearchResultRow
                      key={person.id}
                      person={person}
                      query={query}
                      onClick={() => handleResultClick(person)}
                    />
                  ))}
                </div>
              ))
            )}

            {/* Footer hint */}
            {results.length > 0 && (
              <div style={{ padding: '0.625rem 1.25rem', borderTop: '1px solid rgba(212,169,106,0.12)', fontSize: '0.7rem', color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
                {results.length} result{results.length !== 1 ? 's' : ''} — click to navigate
              </div>
            )}
          </div>
        )}

        {!query.trim() && (
          <div style={{ padding: '1.5rem 1.25rem', color: 'var(--color-muted)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', lineHeight: 1.7 }}>
            <p>Start typing to search across <strong style={{ color: 'var(--color-primary)' }}>{persons.length}</strong> people in <strong style={{ color: 'var(--color-primary)' }}>{trees.length}</strong> tree{trees.length !== 1 ? 's' : ''}.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes searchIn { from { opacity: 0; transform: translateX(-50%) translateY(-16px) } to { opacity: 1; transform: translateX(-50%) translateY(0) } }
      `}</style>
    </>
  );
}

function SearchResultRow({ person, query, onClick }) {
  const [hovered, setHovered] = useState(false);

  // Highlight matched substring
  function highlightMatch(text) {
    if (!text || !query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: 'rgba(212,169,106,0.4)', borderRadius: '2px', padding: '0 1px' }}>
          {text.slice(idx, idx + query.length)}
        </mark>
        {text.slice(idx + query.length)}
      </>
    );
  }

  const isDeceased = !!person.dod;
  const crossLinkCount = (person.crossLinks || []).length;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.875rem',
        padding: '0.75rem 1.25rem',
        background: hovered ? 'rgba(212,169,106,0.08)' : 'transparent',
        borderBottom: '1px solid rgba(212,169,106,0.08)',
        cursor: 'pointer', transition: 'background 0.15s',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
        background: person.profilePhoto
          ? `url(${person.profilePhoto}) center/cover`
          : person.gender === 'female'
            ? 'linear-gradient(135deg, #FFB6C1, #FF8FAB)'
            : 'linear-gradient(135deg, #87CEEB, #4682B4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: '0.95rem',
        border: `1.5px solid ${isDeceased ? 'var(--color-deceased)' : 'var(--color-border)'}`,
        filter: isDeceased ? 'grayscale(0.4)' : 'none',
        overflow: 'hidden',
      }}>
        {!person.profilePhoto && person.name?.charAt(0)?.toUpperCase()}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '0.9rem',
          color: isDeceased ? 'var(--color-muted)' : 'var(--color-text)',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          flexWrap: 'wrap',
        }}>
          {highlightMatch(person.name)}
          {isDeceased && <span style={{ fontSize: '0.72rem', color: 'var(--color-deceased)' }}>✝</span>}
          {person.isPlaceholder && <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>(placeholder)</span>}
        </p>
        <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', fontFamily: 'var(--font-body)', marginTop: '1px' }}>
          Level {person.level}
          {person.dob && ` · b. ${formatDateShort(person.dob)}`}
          {crossLinkCount > 0 && ` · 🔗 ${crossLinkCount} links`}
        </p>
      </div>

      {/* Navigate arrow */}
      <ExternalLink size={14} color={hovered ? 'var(--color-primary)' : 'var(--color-muted)'} style={{ flexShrink: 0, transition: 'color 0.15s' }} />
    </div>
  );
}
