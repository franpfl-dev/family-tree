/**
 * NodeTooltip.jsx
 * Small floating info box appearing near a clicked node.
 * Automatically closes on outside click/tap, Escape key, or after 3 seconds.
 */

import { useEffect, useRef } from 'react';

export default function NodeTooltip({ person, position, onClose }) {
  const tooltipRef = useRef(null);

  // Close on outside click/tap
  useEffect(() => {
    function handleClick(e) {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        onClose();
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('touchstart', handleClick);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!person || !position) return null;

  const width = 180;
  // Position tooltip slightly offset from cursor, ensuring it doesn't go offscreen
  const tooltipX = Math.min(position.x + 10, window.innerWidth - width - 16);
  const tooltipY = Math.min(position.y + 10, window.innerHeight - 80 - 16);

  const genderIcon = person.gender === 'female' ? '👩' : person.gender === 'male' ? '👨' : '🧑';
  const levelName = person.level === 0 ? 'Root' : person.level === 1 ? 'Child' : 'Grandchild';

  return (
    <div
      ref={tooltipRef}
      style={{
        position: 'fixed',
        left: tooltipX,
        top: tooltipY,
        width: `${width}px`,
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: '10px',
        padding: '0.6rem 0.8rem',
        boxShadow: 'var(--shadow-node)',
        zIndex: 600,
        pointerEvents: 'auto',
        animation: 'tooltipIn 0.15s ease',
      }}
    >
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: '0.82rem',
        fontWeight: 700,
        color: 'var(--color-primary)',
        margin: 0,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {person.name}
      </p>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '0.25rem',
        fontSize: '0.72rem',
        color: 'var(--color-muted)',
        fontFamily: 'var(--font-body)',
      }}>
        <span>{genderIcon} {person.gender?.charAt(0).toUpperCase() + person.gender?.slice(1)}</span>
        <span style={{
          background: 'rgba(212,169,106,0.15)',
          padding: '1px 5px',
          borderRadius: '4px',
          fontWeight: 600,
          color: 'var(--color-primary)',
        }}>
          {levelName}
        </span>
      </div>
      <style>{`
        @keyframes tooltipIn {
          from { opacity: 0; transform: scale(0.95) translateY(4px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
