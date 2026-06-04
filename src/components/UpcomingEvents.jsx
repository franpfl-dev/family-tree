/**
 * UpcomingEvents.jsx
 * Shows a "📅 Upcoming" section on the Home screen with the next 30 days
 * of events (birthdays, anniversaries, remembrances) across all family trees.
 *
 * Sorted by soonest first.
 * TODAY events are highlighted in gold.
 * Clicking an event row navigates to that person's tree.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getUpcomingEvents } from '../utils/notifications';

const TYPE_META = {
  birthday:     { emoji: '🎂', label: 'Birthday',     color: '#D4A96A' },
  anniversary:  { emoji: '💍', label: 'Anniversary',  color: '#C0392B' },
  remembrance:  { emoji: '🕯️', label: 'Remembrance',  color: '#9E9E9E' },
};

/** Format "YYYY-MM-DD" → "16 Oct" */
function formatMonthDay(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    const d = new Date(new Date().getFullYear(), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch { return dateStr; }
}

function daysLabel(n) {
  if (n === 0) return { text: 'Today! 🎉', highlight: true };
  if (n === 1) return { text: 'Tomorrow', highlight: false };
  return { text: `in ${n} days`, highlight: false };
}

export default function UpcomingEvents() {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { persons, trees } = state;

  const events = useMemo(() => getUpcomingEvents(persons, trees, 30), [persons, trees]);

  if (events.length === 0) return null;

  return (
    <section style={{ marginTop: '3rem' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: 'linear-gradient(135deg, var(--color-primary), #A0522D)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem',
        }}>📅</div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)', fontSize: '1.35rem', fontWeight: 700 }}>
            Upcoming Events
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.78rem' }}>Next 30 days across all your family trees</p>
        </div>
      </div>

      {/* Event list */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid rgba(212,169,106,0.3)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-node)',
      }}>
        {events.map((ev, idx) => {
          const meta = TYPE_META[ev.type] || TYPE_META.birthday;
          const { text: dayText, highlight } = daysLabel(ev.daysAway);
          const isLast = idx === events.length - 1;

          return (
            <EventRow
              key={`${ev.type}-${ev.personId}-${idx}`}
              ev={ev}
              meta={meta}
              dayText={dayText}
              highlight={highlight}
              isLast={isLast}
              onClick={() => navigate(`/tree/${ev.treeId}`)}
            />
          );
        })}
      </div>
    </section>
  );
}

function EventRow({ ev, meta, dayText, highlight, isLast, onClick }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        padding: '0.875rem 1.25rem',
        cursor: 'pointer',
        background: highlight
          ? 'linear-gradient(135deg, rgba(212,169,106,0.18), rgba(255,248,240,0.8))'
          : hovered
            ? 'rgba(212,169,106,0.06)'
            : 'transparent',
        borderBottom: isLast ? 'none' : '1px solid rgba(212,169,106,0.12)',
        transition: 'background 0.15s',
        borderLeft: highlight ? '3px solid var(--color-border)' : '3px solid transparent',
      }}
    >
      {/* Avatar / Icon */}
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        background: ev.photo
          ? `url(${ev.photo}) center/cover`
          : `linear-gradient(135deg, ${meta.color}33, ${meta.color}55)`,
        border: `2px solid ${meta.color}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem', flexShrink: 0, overflow: 'hidden',
      }}>
        {!ev.photo && meta.emoji}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-text)',
          fontSize: '0.88rem',
          fontWeight: 700,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {ev.name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '2px',
            background: `${meta.color}18`, border: `1px solid ${meta.color}33`,
            borderRadius: '6px', padding: '1px 6px',
            color: meta.color, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.03em',
          }}>
            {meta.emoji} {meta.label}
          </span>
          <span style={{ color: 'var(--color-muted)', fontSize: '0.72rem' }}>{formatMonthDay(ev.dateStr)}</span>
          {ev.treeName && (
            <span style={{ color: 'var(--color-muted)', fontSize: '0.68rem', opacity: 0.7 }}>· {ev.treeName}</span>
          )}
        </div>
      </div>

      {/* Days away badge */}
      <div style={{
        padding: '0.25rem 0.625rem',
        borderRadius: '20px',
        background: highlight ? 'var(--color-border)' : 'rgba(212,169,106,0.1)',
        color: highlight ? 'var(--color-primary)' : 'var(--color-muted)',
        fontSize: '0.72rem', fontWeight: highlight ? 800 : 600,
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {dayText}
      </div>
    </div>
  );
}
