/**
 * CoupleBlock.jsx
 * Renders a joined husband+wife block with a 💍 center connector.
 * Husband on left, wife on right, heart/ring connector in the middle.
 */

import React from 'react';
import { Heart } from 'lucide-react';
import { formatDateShort } from '../utils/familyUtils';
import { COUPLE_W, COUPLE_H, NODE_W } from '../hooks/useTreeLayout';

const CONNECTOR_W = COUPLE_W - NODE_W * 2; // = 10px gap between nodes

export default function CoupleBlock({ leftPerson, rightPerson, x, y, onClickPerson, onContextMenuPerson, onLongPressPerson, highlightedId }) {
  if (!leftPerson) return null;

  const anniversaryDate = leftPerson.anniversaryDate || rightPerson?.anniversaryDate;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: COUPLE_W,
        height: COUPLE_H,
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        userSelect: 'none',
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
        {anniversaryDate && (
          <p style={{
            fontSize: '0.58rem',
            color: 'var(--color-muted)',
            fontFamily: 'var(--font-body)',
            textAlign: 'center',
            lineHeight: 1.2,
            maxWidth: CONNECTOR_W - 4,
          }}>
            {formatDateShort(anniversaryDate)}
          </p>
        )}
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
  );
}

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

      {/* Deceased */}
      {isDeceased && (
        <p style={{ fontSize: '0.63rem', color: 'var(--color-deceased)', fontFamily: 'var(--font-body)' }}>
          ✝ {formatDateShort(person.dod)}
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
