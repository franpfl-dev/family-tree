/**
 * ToastContainer.jsx
 * Renders floating toast notifications for API success/error/warning messages.
 * Reads from AppContext toasts state.
 */

import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function ToastContainer() {
  const { toasts, dismissToast } = useAppContext();

  if (!toasts.length) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '5rem',
      right: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      zIndex: 2000,
      maxWidth: '360px',
      width: 'calc(100vw - 2.5rem)',
    }}>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  const configs = {
    error:   { bg: 'rgba(192,57,43,0.95)',  border: 'rgba(192,57,43,0.5)',  icon: <AlertTriangle size={16} />, label: 'Error' },
    warning: { bg: 'rgba(211,84,0,0.93)',   border: 'rgba(211,84,0,0.5)',   icon: <AlertTriangle size={16} />, label: 'Warning' },
    success: { bg: 'rgba(39,174,96,0.93)',  border: 'rgba(39,174,96,0.5)', icon: <CheckCircle size={16} />,  label: 'Success' },
    info:    { bg: 'rgba(26,107,138,0.93)', border: 'rgba(26,107,138,0.5)', icon: <Info size={16} />,         label: 'Info' },
  };

  const cfg = configs[toast.type] || configs.info;

  return (
    <div
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        color: '#fff',
        fontSize: '0.82rem',
        fontFamily: 'var(--font-body)',
        lineHeight: 1.5,
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.625rem',
        animation: 'toastIn 0.2s ease',
        backdropFilter: 'blur(8px)',
      }}
    >
      <span style={{ flexShrink: 0, marginTop: '1px' }}>{cfg.icon}</span>
      <p style={{ flex: 1, margin: 0 }}>{toast.message}</p>
      <button
        onClick={onDismiss}
        style={{
          background: 'transparent', border: 'none',
          color: 'rgba(255,255,255,0.75)', cursor: 'pointer',
          padding: '0', flexShrink: 0, display: 'flex',
        }}
      >
        <X size={14} />
      </button>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
