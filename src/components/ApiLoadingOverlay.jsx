/**
 * ApiLoadingOverlay.jsx
 * Full-screen overlay shown while the initial API data load is in progress.
 */

import React from 'react';

export default function ApiLoadingOverlay() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--color-bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      gap: '1.25rem',
    }}>
      {/* Spinner */}
      <div style={{
        width: '52px', height: '52px',
        borderRadius: '50%',
        border: '4px solid rgba(212,169,106,0.25)',
        borderTop: '4px solid var(--color-primary)',
        animation: 'apiSpin 0.75s linear infinite',
      }} />

      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-primary)',
          fontSize: '1.1rem',
          fontWeight: 700,
          marginBottom: '0.25rem',
        }}>
          Loading your family tree…
        </p>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-body)' }}>
          Connecting to the server
        </p>
      </div>

      <style>{`
        @keyframes apiSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
