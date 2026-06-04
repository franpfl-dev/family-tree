/**
 * PersonNode.jsx
 * Single person card node rendered on the tree canvas.
 * Handles: photo/icon, name, DOB, deceased marker, placeholder styling,
 *          and collapse/expand toggle button for nodes with children.
 */

import React, { useRef, useState } from 'react';
import { formatDateShort } from '../utils/familyUtils';
import { NODE_W, NODE_H } from '../hooks/useTreeLayout';

export default function PersonNode({
  person,
  x,
  y,
  onClick,
  onContextMenu,
  onLongPress,
  isHighlighted,
  hasChildren,
  isCollapsed,
  onToggleCollapse,
  hiddenCount,
}) {
  const touchTimeout = useRef(null);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const hasTriggeredLongPress = useRef(false);

  if (!person) return null;

  const isDeceased = !!person.dod;
  const isPlaceholder = !!person.isPlaceholder;

  const borderColor = isHighlighted
    ? 'var(--color-link)'
    : isDeceased
      ? 'var(--color-deceased)'
      : isPlaceholder
        ? 'rgba(212,169,106,0.5)'
        : 'var(--color-border)';

  const bgColor = isPlaceholder
    ? 'rgba(253,246,236,0.5)'
    : isDeceased
      ? 'rgba(245,245,245,0.95)'
      : 'var(--color-surface)';

  const handleTouchStart = (e) => {
    if (isPlaceholder) return;
    if (e.touches.length > 1) return;
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    hasTriggeredLongPress.current = false;

    touchTimeout.current = setTimeout(() => {
      hasTriggeredLongPress.current = true;
      if (onLongPress) {
        onLongPress(e, person);
      }
    }, 500);
  };

  const handleTouchMove = (e) => {
    if (touchTimeout.current) {
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartPos.current.x;
      const dy = touch.clientY - touchStartPos.current.y;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        clearTimeout(touchTimeout.current);
        touchTimeout.current = null;
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (touchTimeout.current) {
      clearTimeout(touchTimeout.current);
      touchTimeout.current = null;
    }
    if (hasTriggeredLongPress.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      data-node="true"
      onClick={isPlaceholder ? undefined : (e) => { e.stopPropagation(); onClick(e, person); }}
      onContextMenu={isPlaceholder ? undefined : (e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, person); }}
      onTouchStart={isPlaceholder ? undefined : handleTouchStart}
      onTouchMove={isPlaceholder ? undefined : handleTouchMove}
      onTouchEnd={isPlaceholder ? undefined : handleTouchEnd}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: NODE_W,
        height: NODE_H,
        background: bgColor,
        border: `${isHighlighted ? 2.5 : 1.5}px ${isPlaceholder ? 'dashed' : 'solid'} ${borderColor}`,
        borderRadius: '14px',
        padding: '0.75rem',
        cursor: isPlaceholder ? 'default' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.3rem',
        boxShadow: isHighlighted
          ? '0 0 0 4px rgba(26,107,138,0.2), 0 4px 16px rgba(123,63,0,0.12)'
          : 'var(--shadow-node)',
        transition: 'box-shadow 0.2s, transform 0.15s, border-color 0.2s',
        userSelect: 'none',
        opacity: isDeceased ? 0.85 : 1,
      }}
      onMouseEnter={e => {
        if (isPlaceholder) return;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(123,63,0,0.18)';
      }}
      onMouseLeave={e => {
        if (isPlaceholder) return;
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = isHighlighted
          ? '0 0 0 4px rgba(26,107,138,0.2), 0 4px 16px rgba(123,63,0,0.12)'
          : 'var(--shadow-node)';
      }}
    >
      {/* Avatar */}
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: person.profilePhoto
          ? `url(${person.profilePhoto}) center/cover`
          : person.gender === 'female'
            ? 'linear-gradient(135deg, #FFB6C1, #FF8FAB)'
            : person.gender === 'male'
              ? 'linear-gradient(135deg, #87CEEB, #4682B4)'
              : 'linear-gradient(135deg, #D4A96A, #A0856C)',
        border: `2px solid ${isDeceased ? 'var(--color-deceased)' : 'var(--color-border)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '1.25rem',
        fontWeight: 700,
        flexShrink: 0,
        overflow: 'hidden',
        filter: isDeceased ? 'grayscale(0.4)' : 'none',
      }}>
        {!person.profilePhoto && (
          isPlaceholder
            ? <span style={{ fontSize: '1.4rem' }}>👤</span>
            : person.name?.charAt(0)?.toUpperCase() || '?'
        )}
      </div>

      {/* Name */}
      <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
        {isPlaceholder ? (
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            color: 'var(--color-muted)',
            fontStyle: 'italic',
          }}>
            {person.name}
          </p>
        ) : (
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: isDeceased ? 'var(--color-muted)' : 'var(--color-text)',
            maxWidth: NODE_W - 20,
            wordBreak: 'break-word',
          }}>
            {person.name}
          </p>
        )}
      </div>

      {/* DOB */}
      {person.dob && !isPlaceholder && (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.68rem',
          color: 'var(--color-muted)',
        }}>
          b. {formatDateShort(person.dob)}
        </p>
      )}

      {/* Death */}
      {isDeceased && !isPlaceholder && (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.68rem',
          color: 'var(--color-deceased)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.2rem',
        }}>
          ✝ {formatDateShort(person.dod)}
        </p>
      )}

      {/* Cross-link badge */}
      {person.crossLinks && person.crossLinks.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          background: 'var(--color-link)',
          color: '#fff',
          borderRadius: '10px',
          padding: '1px 6px',
          fontSize: '0.65rem',
          fontWeight: 700,
          border: '1.5px solid #fff',
          boxShadow: '0 1px 4px rgba(26,107,138,0.3)',
          pointerEvents: 'none',
        }}>
          🔗 {person.crossLinks.length}
        </div>
      )}

      {/* Collapse/expand toggle button (bottom-center, outside click area) */}
      {hasChildren && !isPlaceholder && (
        <CollapseBtn
          isCollapsed={isCollapsed}
          hiddenCount={hiddenCount}
          onToggle={(e) => { e.stopPropagation(); onToggleCollapse?.(); }}
        />
      )}
    </div>
  );
}

// ── Collapse toggle button ────────────────────────────────────────────────────
function CollapseBtn({ isCollapsed, hiddenCount, onToggle }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onToggle}
      title={isCollapsed ? 'Expand branch' : 'Collapse branch'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        bottom: '-12px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '22px',
        height: '22px',
        borderRadius: '50%',
        border: `1.5px solid ${hovered ? 'var(--color-border)' : 'rgba(160,133,108,0.4)'}`,
        background: hovered ? 'rgba(212,169,106,0.18)' : 'rgba(255,248,240,0.9)',
        color: 'var(--color-muted)',
        fontSize: '9px',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 4px rgba(123,63,0,0.1)',
        transition: 'all 0.15s',
        lineHeight: 1,
        padding: 0,
        gap: '1px',
        zIndex: 10,
        minWidth: '22px',
      }}
    >
      <span style={{ fontSize: '8px' }}>{isCollapsed ? '▶' : '▼'}</span>
      {isCollapsed && hiddenCount > 0 && (
        <span style={{ fontSize: '8px' }}>{hiddenCount}</span>
      )}
    </button>
  );
}
