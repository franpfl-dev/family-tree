/**
 * modalShared.jsx
 * Shared primitives used across all modal components:
 * Modal shell, FormField, ToggleRow, and shared style constants.
 */

/* eslint-disable react-refresh/only-export-components */
import { X } from 'lucide-react';

// ─── Modal Shell ──────────────────────────────────────────────────────────────
export function Modal({ title, subtitle, icon, onClose, children }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(44,26,14,0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 400,
          animation: 'fadeIn 0.2s ease',
        }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%', maxWidth: '520px', maxHeight: '90vh',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '18px',
        boxShadow: 'var(--shadow-panel)',
        zIndex: 500,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: 'modalIn 0.25s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(212,169,106,0.2)',
          background: 'linear-gradient(135deg, rgba(253,240,224,0.8), rgba(255,248,240,0.95))',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          {icon && (
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #FDF0E0, #F5DEB3)',
              border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-primary)', flexShrink: 0,
            }}>
              {icon}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontFamily: 'var(--font-display)', color: 'var(--color-primary)',
              fontSize: '1.1rem', fontWeight: 700,
            }}>{title}</h3>
            {subtitle && (
              <p style={{ color: 'var(--color-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--color-muted)', cursor: 'pointer',
              padding: '4px', borderRadius: '6px', flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalIn {
          from { opacity: 0; transform: translate(-50%, -46%) scale(0.95) }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1) }
        }
      `}</style>
    </>
  );
}

// ─── FormField ────────────────────────────────────────────────────────────────
export function FormField({ label, id, error, children }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block', color: 'var(--color-text)',
            fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem',
          }}
        >
          {label}
        </label>
      )}
      {children}
      {error && (
        <p style={{ color: 'var(--color-accent)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── ToggleRow ────────────────────────────────────────────────────────────────
export function ToggleRow({ label, value, onChange, icon }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.45rem 0', cursor: 'pointer', marginBottom: '0.25rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {icon}
        <span style={{ color: 'var(--color-text)', fontSize: '0.875rem', fontWeight: 600 }}>
          {label}
        </span>
      </div>
      <div style={{
        width: '40px', height: '22px', borderRadius: '11px',
        background: value
          ? 'linear-gradient(135deg, var(--color-primary), #A0522D)'
          : 'rgba(212,169,106,0.3)',
        position: 'relative', transition: 'background 0.25s', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: '3px',
          left: value ? '20px' : '3px',
          width: '16px', height: '16px', borderRadius: '50%',
          background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          transition: 'left 0.25s',
        }} />
      </div>
    </div>
  );
}

// ─── Style constants (not components — kept separate so Fast Refresh is happy) ─
export const inputStyle = {
  width: '100%', padding: '0.575rem 0.75rem',
  borderRadius: '8px', border: '1.5px solid rgba(212,169,106,0.5)',
  background: 'var(--color-bg)', color: 'var(--color-text)',
  fontSize: '0.875rem', fontFamily: 'var(--font-body)', outline: 'none',
};

export const primaryBtnStyle = {
  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
  padding: '0.7rem', borderRadius: '10px', border: 'none',
  background: 'linear-gradient(135deg, var(--color-primary), #A0522D)',
  color: '#FFF8F0', fontSize: '0.9rem', fontWeight: 700,
  fontFamily: 'var(--font-body)', cursor: 'pointer',
  boxShadow: '0 2px 10px rgba(123,63,0,0.3)', transition: 'all 0.2s',
};

export const cancelBtnStyle = {
  flex: 1, padding: '0.7rem', borderRadius: '10px',
  border: '1px solid var(--color-border)', background: 'transparent',
  color: 'var(--color-muted)', fontSize: '0.9rem', fontWeight: 600,
  fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'all 0.2s',
};
