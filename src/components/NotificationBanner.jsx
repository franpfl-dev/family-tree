/**
 * NotificationBanner.jsx
 * Sticky banner that appears at the top of the Home screen on first visit,
 * asking for notification permission.
 * Dismissed state is persisted in localStorage — never shown again after dismiss.
 */

import { useState } from 'react';
import { X, Bell } from 'lucide-react';
import {
  notificationsSupported,
  notifPermission,
  requestPermission,
  isBannerDismissed,
  dismissBanner,
} from '../utils/notifications';

export default function NotificationBanner({ onPermissionGranted }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'asking' | 'granted' | 'denied'
  const [visible, setVisible] = useState(true);

  // Don't render if: no browser support, already answered, already dismissed
  if (!notificationsSupported()) return null;
  if (isBannerDismissed()) return null;
  if (notifPermission() === 'granted') return null;
  if (notifPermission() === 'denied') return null;
  if (!visible) return null;

  async function handleAllow() {
    setStatus('asking');
    const result = await requestPermission();
    if (result === 'granted') {
      setStatus('granted');
      dismissBanner();
      onPermissionGranted?.();
      setTimeout(() => setVisible(false), 3500);
    } else {
      setStatus('denied');
      dismissBanner();
      setTimeout(() => setVisible(false), 2000);
    }
  }

  function handleNotNow() {
    dismissBanner();
    setVisible(false);
  }

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 200,
      background: status === 'granted'
        ? 'linear-gradient(135deg, #1E8449, #27AE60)'
        : 'linear-gradient(135deg, var(--color-primary), #A0522D)',
      color: '#FFF8F0',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      boxShadow: '0 2px 12px rgba(44,26,14,0.2)',
      animation: 'fadeInUp 0.35s ease',
      flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>
        {status === 'granted' ? '🎉' : status === 'denied' ? '🔕' : '🔔'}
      </span>

      <p style={{ flex: 1, fontSize: '0.85rem', fontFamily: 'var(--font-body)', fontWeight: 500, minWidth: '180px' }}>
        {status === 'granted'
          ? "You'll be notified on important family dates 🎉"
          : status === 'denied'
            ? 'Notifications blocked. You can enable them in browser settings.'
            : 'Get notified on birthdays, anniversaries & remembrance dates?'}
      </p>

      {status === 'idle' && (
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button
            id="btn-notif-allow"
            onClick={handleAllow}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '8px', border: '1.5px solid rgba(255,248,240,0.6)',
              background: 'rgba(255,248,240,0.15)',
              color: '#FFF8F0', fontSize: '0.82rem', fontWeight: 700,
              fontFamily: 'var(--font-body)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,248,240,0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,248,240,0.15)'}
          >
            <Bell size={13} /> Allow
          </button>
          <button
            id="btn-notif-notnow"
            onClick={handleNotNow}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '8px', border: '1.5px solid rgba(255,248,240,0.25)',
              background: 'transparent',
              color: 'rgba(255,248,240,0.7)', fontSize: '0.82rem',
              fontFamily: 'var(--font-body)', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#FFF8F0'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,248,240,0.7)'}
          >
            Not now
          </button>
        </div>
      )}

      {status === 'asking' && (
        <p style={{ fontSize: '0.82rem', opacity: 0.8 }}>Waiting for permission…</p>
      )}

      {(status === 'granted' || status === 'denied') && (
        <button
          onClick={() => setVisible(false)}
          style={{
            width: '28px', height: '28px', borderRadius: '50%', border: 'none',
            background: 'rgba(255,248,240,0.15)', color: '#FFF8F0',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
