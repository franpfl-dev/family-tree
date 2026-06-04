/**
 * ContextMenu.jsx
 * Right-click / long-press context menu that appears near a node.
 * Options: Edit Details, Delete Person, Add Child, Add/Edit Spouse,
 *          Add Cross-Link, Add Level Below (leaf + non-root only).
 * On mobile it renders as a bottom sheet.
 */

import React, { useEffect, useRef } from 'react';
import { Pencil, Trash2, Baby, Heart, Link2, Plus } from 'lucide-react';

const MENU_W = 220;

export default function ContextMenu({
  person,
  position,   // { x, y } — cursor position in viewport coords
  tree,
  onClose,
  onEditDetails,
  onDeletePerson,
  onAddChild,
  onAddSpouse,
  onAddCrossLink,
  onAddLevelBelow,
}) {
  const menuRef = useRef(null);

  // Close on outside click/tap (with a tiny delay so the opening click doesn't immediately close)
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('touchstart', handleClick);
    }, 60);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!person || !position) return null;

  const maxHeight = tree?.maxHeight ?? 3;
  const canAddChild = person.level < maxHeight - 1;
  const hasSpouse = !!person.spouseId;
  const hasChildren = (person.children || []).length > 0;
  // "Add Level Below" = leaf node (no children) that is NOT the root
  const canAddLevelBelow = !hasChildren && person.level > 0 && person.level >= maxHeight - 1;

  const isMobile = window.innerWidth <= 640;
  const MENU_H = 280; // estimate for flip logic

  // Keep menu inside viewport
  const flipX = !isMobile && position.x + MENU_W > window.innerWidth - 8;
  const flipY = !isMobile && position.y + MENU_H > window.innerHeight - 8;
  const menuX = flipX ? Math.max(8, position.x - MENU_W) : position.x;
  const menuY = flipY ? Math.max(8, position.y - MENU_H) : position.y;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(44,26,14,0.28)',
            zIndex: 499,
            animation: 'ctxFadeIn 0.18s ease',
          }}
        />
      )}

      <div
        ref={menuRef}
        className={isMobile ? 'context-menu-sheet' : ''}
        role="menu"
        aria-label={`Actions for ${person.name}`}
        style={{
          position: 'fixed',
          left: isMobile ? 0 : menuX,
          top: isMobile ? 'auto' : menuY,
          bottom: isMobile ? 0 : 'auto',
          width: isMobile ? '100vw' : MENU_W,
          maxHeight: isMobile ? '85vh' : 'none',
          background: 'var(--color-surface)',
          border: isMobile ? 'none' : '1px solid var(--color-border)',
          borderTop: isMobile ? '1.5px solid var(--color-border)' : undefined,
          borderRadius: isMobile ? '18px 18px 0 0' : '12px',
          boxShadow: 'var(--shadow-panel)',
          zIndex: 500,
          overflow: 'hidden',
          display: isMobile ? 'flex' : 'block',
          flexDirection: isMobile ? 'column' : undefined,
          animation: isMobile
            ? 'ctxSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            : 'ctxPopIn 0.15s ease',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '0.65rem 0.9rem',
          borderBottom: '1px solid rgba(212,169,106,0.18)',
          background: 'linear-gradient(135deg, rgba(253,240,224,0.7), rgba(255,248,240,0.9))',
        }}>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            margin: 0,
          }}>
            {person.name || 'Person'}
          </p>
          <p style={{ fontSize: '0.67rem', color: 'var(--color-muted)', fontFamily: 'var(--font-body)', margin: 0, marginTop: '1px' }}>
            Level {person.level}{person.gender ? ` · ${person.gender}` : ''}
          </p>
        </div>

        {/* Menu items */}
        <div style={{ padding: '0.3rem 0', overflowY: isMobile ? 'auto' : 'visible', flex: isMobile ? '1 1 auto' : undefined, paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0.5rem)' : '0.3rem' }}>
          <MenuItem
            id={`ctx-edit-${person.id}`}
            icon={<Pencil size={14} />}
            label="Edit Details"
            onClick={() => { onEditDetails(person); onClose(); }}
          />

          {canAddChild && (
            <MenuItem
              id={`ctx-add-child-${person.id}`}
              icon={<Baby size={14} />}
              label="Add Child"
              onClick={() => { onAddChild(person); onClose(); }}
            />
          )}

          <MenuItem
            id={`ctx-spouse-${person.id}`}
            icon={hasSpouse ? <Pencil size={14} /> : <Heart size={14} />}
            label={hasSpouse ? 'Edit Spouse' : 'Add Spouse'}
            onClick={() => { onAddSpouse(person); onClose(); }}
          />

          <MenuItem
            id={`ctx-crosslink-${person.id}`}
            icon={<Link2 size={14} />}
            label="Add Cross-Link"
            onClick={() => { onAddCrossLink(person); onClose(); }}
          />

          {canAddLevelBelow && (
            <>
              <div style={{ margin: '0.25rem 0.75rem', borderTop: '1px solid rgba(212,169,106,0.2)' }} />
              <MenuItem
                id={`ctx-level-below-${person.id}`}
                icon={<Plus size={14} />}
                label="Add Level Below"
                onClick={() => { onAddLevelBelow(person); onClose(); }}
                accent
              />
            </>
          )}

          <div style={{ margin: '0.25rem 0.75rem', borderTop: '1px solid rgba(212,169,106,0.2)' }} />

          <MenuItem
            id={`ctx-delete-${person.id}`}
            icon={<Trash2 size={14} />}
            label="Delete Person"
            onClick={() => { onDeletePerson(person); onClose(); }}
            danger
          />
        </div>
      </div>

      <style>{`
        @keyframes ctxPopIn {
          from { opacity: 0; transform: scale(0.92) translateY(-6px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes ctxSlideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes ctxFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ── Menu item ─────────────────────────────────────────────────────────────────
function MenuItem({ id, icon, label, onClick, accent, danger }) {
  const [hovered, setHovered] = React.useState(false);

  const textColor = danger
    ? (hovered ? '#C0392B' : 'var(--color-muted)')
    : accent
      ? 'var(--color-primary)'
      : hovered
        ? 'var(--color-text)'
        : 'var(--color-muted)';

  const bg = hovered
    ? danger
      ? 'rgba(192,57,43,0.08)'
      : accent
        ? 'rgba(123,63,0,0.07)'
        : 'rgba(212,169,106,0.1)'
    : 'transparent';

  return (
    <button
      id={id}
      role="menuitem"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.5rem 0.9rem',
        background: bg,
        border: 'none',
        color: textColor,
        fontSize: '0.82rem',
        fontWeight: accent || danger ? 700 : 500,
        fontFamily: 'var(--font-body)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.12s, color 0.12s',
      }}
    >
      <span style={{ color: danger ? (hovered ? '#C0392B' : 'rgba(192,57,43,0.6)') : accent ? 'var(--color-primary)' : 'var(--color-border)', transition: 'color 0.12s' }}>
        {icon}
      </span>
      {label}
    </button>
  );
}
