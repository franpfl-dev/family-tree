/**
 * CoupleBlock.jsx
 * Renders a joined husband+wife block with a 💍 center connector.
 * Husband on left, wife on right, heart/ring connector in the middle.
 *
 * Features:
 *  - Anniversary badge above the block (when date is set)
 *  - Deceased pill(s) below the block (when a spouse is deceased)
 *  - Collapse/expand toggle button below the block (when there are children)
 */

import React from 'react';
import { Heart } from 'lucide-react';
import { formatDateShort } from '../utils/familyUtils';
import { COUPLE_W, COUPLE_H, NODE_W } from '../hooks/useTreeLayout';

const CONNECTOR_W = COUPLE_W - NODE_W * 2; // = 10px gap between nodes

/** Format "YYYY-MM-DD" → "21 May 2002" */
function formatBadgeDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

export default function CoupleBlock({
  leftPerson,
  rightPerson,
  x,
  y,
  onClickPerson,
  onContextMenuPerson,
  onLongPressPerson,
  highlightedId,
  hasChildren,
  isCollapsed,
  onToggleCollapse,
  hiddenCount,
}) {
  if (!leftPerson) return null;

  const anniversaryDate = leftPerson.anniversaryDate || rightPerson?.anniversaryDate;

  // Deceased pills: show for each deceased spouse
  const deceasedPills = [];
  if (leftPerson.dod) {
    deceasedPills.push({ name: leftPerson.name, dod: leftPerson.dod });
  }
  if (rightPerson?.dod) {
    deceasedPills.push({ name: rightPerson.name, dod: rightPerson.dod });
  }

  // Badge height offset (so the couple block y position stays stable for SVG connectors)
  const BADGE_H = anniversaryDate ? 26 : 0;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y - BADGE_H, // shift up to make room for badge without moving connectors
        width: COUPLE_W,
        userSelect: 'none',
      }}
    >
      {/* ── Anniversary badge (above couple block) ─────────────────────────── */}
      {anniversaryDate && (
        <div style={{
          height: BADGE_H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: '4px',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'linear-gradient(135deg, #FDF0E0, #FFF8F0)',
            border: '1px solid rgba(212,169,106,0.55)',
            borderRadius: '20px',
            padding: '2px 10px',
            fontSize: '11px',
            fontFamily: 'var(--font-display)',
            color: 'var(--color-primary)',
            boxShadow: '0 1px 4px rgba(123,63,0,0.1)',
            whiteSpace: 'nowrap',
          }}>
            💍 {formatBadgeDate(anniversaryDate)}
          </div>
        </div>
      )}

      {/* ── Couple block row ───────────────────────────────────────────────── */}
      <div
        style={{
          width: COUPLE_W,
          height: COUPLE_H,
          display: 'flex',
          alignItems: 'center',
          gap: 0,
        }}
      >
        {/* Left person (husband / main) */}
        <MiniPersonCard
          person={leftPerson}
          isLeft
          onClick={(e) => { e.stopPropagation(); onClickPerson(e, leftPerson); }}
          onContextMenu={(e) => { onContextMenuPerson(e, leftPerson); }}
          onLongPress={(e) => { onLongPressPerson(e, leftPerson); }}
          isHighlighted={highlightedId === leftPerson.id}
        />

        {/* Center connector */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: CONNECTOR_W,
          height: COUPLE_H,
          gap: '0.25rem',
          flexShrink: 0,
          background: 'linear-gradient(180deg, rgba(253,246,236,0) 0%, rgba(253,240,224,0.6) 50%, rgba(253,246,236,0) 100%)',
          zIndex: 1,
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #FDF0E0, #FFF8F0)',
            border: '1.5px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(123,63,0,0.12)',
          }}>
            <Heart size={13} color="var(--color-accent)" fill="var(--color-accent)" />
          </div>
        </div>

        {/* Right person (wife / spouse) */}
        {rightPerson && (
          <MiniPersonCard
            person={rightPerson}
            isLeft={false}
            onClick={(e) => { e.stopPropagation(); onClickPerson(e, rightPerson); }}
            onContextMenu={(e) => { onContextMenuPerson(e, rightPerson); }}
            onLongPress={(e) => { onLongPressPerson(e, rightPerson); }}
            isHighlighted={highlightedId === rightPerson.id}
          />
        )}
      </div>

      {/* ── Below-block row: deceased pills + collapse toggle ─────────────── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        marginTop: '4px',
      }}>
        {/* Deceased pills */}
        {deceasedPills.map((p) => (
          <div key={p.name} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(158,158,158,0.12)',
            border: '1px solid rgba(158,158,158,0.3)',
            borderRadius: '20px',
            padding: '2px 8px',
            fontSize: '10px',
            fontFamily: 'var(--font-body)',
            color: 'var(--color-deceased)',
            whiteSpace: 'nowrap',
          }}>
            ✝ {p.name} · {formatDateShort(p.dod)}
          </div>
        ))}

        {/* Collapse/expand toggle */}
        {hasChildren && (
          <CollapseBtn
            isCollapsed={isCollapsed}
            hiddenCount={hiddenCount}
            onToggle={(e) => { e.stopPropagation(); onToggleCollapse?.(); }}
          />
        )}
      </div>
    </div>
  );
}

// ── Collapse toggle button ────────────────────────────────────────────────────
function CollapseBtn({ isCollapsed, hiddenCount, onToggle }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      onClick={onToggle}
      title={isCollapsed ? 'Expand branch' : 'Collapse branch'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
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

// ── Mini person card ─────────────────────────────────────────────────────────
function MiniPersonCard({ person, isLeft, onClick, onContextMenu, onLongPress, isHighlighted }) {
  const touchTimeout = React.useRef(null);
  const touchStartPos = React.useRef({ x: 0, y: 0 });
  const hasTriggeredLongPress = React.useRef(false);

  const isDeceased = !!person.dod;
  const isPlaceholder = !!person.isPlaceholder;

  const borderColor = isHighlighted
    ? 'var(--color-link)'
    : isDeceased
      ? 'var(--color-deceased)'
      : 'var(--color-border)';

  const handleTouchStart = (e) => {
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
      onClick={onClick}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e); }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        width: NODE_W,
        height: COUPLE_H,
        background: isDeceased
          ? 'rgba(245,245,245,0.95)'
          : 'var(--color-surface)',
        border: `${isHighlighted ? 2.5 : 1.5}px solid ${borderColor}`,
        borderRadius: isLeft ? '14px 0 0 14px' : '0 14px 14px 0',
        padding: '0.75rem 0.6rem',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.3rem',
        boxShadow: isHighlighted
          ? '0 0 0 3px rgba(26,107,138,0.2)'
          : 'var(--shadow-node)',
        transition: 'box-shadow 0.2s, transform 0.15s',
        position: 'relative',
        opacity: isDeceased ? 0.85 : 1,
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.zIndex = '2';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.zIndex = '0';
      }}
    >
      {/* Avatar */}
      <div style={{
        width: '42px', height: '42px', borderRadius: '50%',
        background: person.profilePhoto
          ? `url(${person.profilePhoto}) center/cover`
          : person.gender === 'female'
            ? 'linear-gradient(135deg, #FFB6C1, #FF8FAB)'
            : person.gender === 'male'
              ? 'linear-gradient(135deg, #87CEEB, #4682B4)'
              : 'linear-gradient(135deg, #D4A96A, #A0856C)',
        border: `2px solid ${isDeceased ? 'var(--color-deceased)' : 'var(--color-border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: '1.1rem', fontWeight: 700,
        overflow: 'hidden', flexShrink: 0,
        filter: isDeceased ? 'grayscale(0.4)' : 'none',
      }}>
        {!person.profilePhoto && (person.name?.charAt(0)?.toUpperCase() || '?')}
      </div>

      {/* Name */}
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: isDeceased ? 'var(--color-muted)' : 'var(--color-text)',
        textAlign: 'center',
        lineHeight: 1.2,
        maxWidth: NODE_W - 12,
        wordBreak: 'break-word',
      }}>
        {person.name || '?'}
      </p>

      {/* DOB */}
      {person.dob && (
        <p style={{ fontSize: '0.63rem', color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
          b. {formatDateShort(person.dob)}
        </p>
      )}

      {/* Cross-link badge */}
      {person.crossLinks && person.crossLinks.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '-7px',
          right: '-7px',
          background: 'var(--color-link)',
          color: '#fff',
          borderRadius: '10px',
          padding: '1px 5px',
          fontSize: '0.6rem',
          fontWeight: 700,
          border: '1.5px solid #fff',
          pointerEvents: 'none',
        }}>
          🔗 {person.crossLinks.length}
        </div>
      )}
    </div>
  );
}
