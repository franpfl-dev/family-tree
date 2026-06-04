/**
 * PersonDeleteModal.jsx
 * Confirmation dialog before deleting a person (with cascade warning).
 * If the person is the root, also warns that the entire tree will be deleted.
 */

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function PersonDeleteModal({ person, tree, onConfirm, onCancel }) {
  const isRoot = person.level === 0;
  const hasChildren = (person.children || []).length > 0;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(44,26,14,0.5)',
      backdropFilter: 'blur(4px)',
      zIndex: 900,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
      animation: 'pdmFadeIn 0.2s ease',
    }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '2rem',
          width: '100%',
          maxWidth: '420px',
          boxShadow: 'var(--shadow-panel)',
          animation: 'pdmSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Icon */}
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'rgba(192,57,43,0.1)',
          border: '1px solid rgba(192,57,43,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem',
        }}>
          <AlertTriangle size={26} color="var(--color-accent)" />
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-primary)',
          fontSize: '1.25rem',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: '0.5rem',
        }}>
          {isRoot ? `Delete Tree "${tree?.name}"?` : `Delete "${person.name}"?`}
        </h3>

        {/* Body */}
        <p style={{
          color: 'var(--color-muted)',
          fontSize: '0.875rem',
          textAlign: 'center',
          lineHeight: 1.6,
          marginBottom: '1.25rem',
        }}>
          {isRoot
            ? 'This person is the root of the tree. Deleting them will permanently remove the entire tree and all its members.'
            : hasChildren
              ? `Deleting ${person.name} will also permanently delete all their descendants in this tree. This action cannot be undone.`
              : `This will permanently remove ${person.name} from the tree. This action cannot be undone.`
          }
        </p>

        {/* Extra warning for root */}
        {isRoot && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '9px',
            background: 'rgba(192,57,43,0.06)',
            border: '1px solid rgba(192,57,43,0.2)',
            marginBottom: '1.25rem',
          }}>
            <p style={{ color: 'var(--color-accent)', fontSize: '0.8rem', lineHeight: 1.5, margin: 0 }}>
              ⚠️ <strong>Entire tree will be deleted.</strong> All members, spouses, and cross-links in "{tree?.name}" will be removed permanently.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            id="pdm-cancel"
            onClick={onCancel}
            style={{
              flex: 1, padding: '0.7rem',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-muted)',
              fontSize: '0.875rem', fontWeight: 600,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={14} /> Cancel
          </button>
          <button
            id="pdm-confirm"
            onClick={onConfirm}
            style={{
              flex: 1.5, padding: '0.7rem',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #C0392B, #922B21)',
              color: '#fff',
              fontSize: '0.875rem', fontWeight: 700,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(192,57,43,0.35)',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Trash2 size={14} />
            {isRoot ? 'Delete Tree' : 'Delete Person'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pdmFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pdmSlideUp {
          from { opacity: 0; transform: translateY(20px) }
          to   { opacity: 1; transform: none }
        }
      `}</style>
    </div>
  );
}
