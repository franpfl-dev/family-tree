/**
 * DeleteConfirmModal.jsx
 * Confirmation dialog before deleting a tree.
 */

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DeleteConfirmModal({ treeName, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(44,26,14,0.55)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '2rem',
        width: '100%',
        maxWidth: '420px',
        boxShadow: 'var(--shadow-panel)',
        animation: 'slideUp 0.25s ease',
      }}>
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

        <h3 style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-primary)',
          fontSize: '1.3rem',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: '0.5rem',
        }}>Delete "{treeName}"?</h3>

        <p style={{
          color: 'var(--color-muted)',
          fontSize: '0.875rem',
          textAlign: 'center',
          lineHeight: 1.6,
          marginBottom: '1.75rem',
        }}>
          This will permanently remove the tree and all its members.
          Cross-links from other trees pointing to members of this family will also be removed.
          This action cannot be undone.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '0.75rem',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-muted)',
              fontSize: '0.9rem',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Cancel
          </button>
          <button
            id="btn-confirm-delete"
            onClick={onConfirm}
            style={{
              flex: 1, padding: '0.75rem',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #C0392B, #922B21)',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 700,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(192,57,43,0.35)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Delete Tree
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: none } }
      `}</style>
    </div>
  );
}
