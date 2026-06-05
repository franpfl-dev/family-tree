/**
 * NotificationSettings.jsx
 * Settings panel for configuring push notification preferences.
 * Rendered as a modal/panel from the Home screen.
 */

import { useState } from 'react';
import { X, Bell, BellOff } from 'lucide-react';
import {
  loadNotifPrefs,
  saveNotifPrefs,
  notificationsSupported,
  notifPermission,
  requestPermission,
  showTestNotification,
} from '../utils/notifications';

const HOURS = [
  { value: 7, label: '7:00 AM' },
  { value: 8, label: '8:00 AM' },
  { value: 9, label: '9:00 AM' },
  { value: 10, label: '10:00 AM' },
  { value: 12, label: '12:00 PM' },
];

export default function NotificationSettings({ onClose }) {
  const [prefs, setPrefs] = useState(() => loadNotifPrefs());
  const [permission, setPermission] = useState(() => notifPermission());
  const [testSent, setTestSent] = useState(false);
  const supported = notificationsSupported();

  function update(key, value) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    saveNotifPrefs(next);
  }

  async function handleEnable() {
    const result = await requestPermission();
    setPermission(result);
    if (result === 'granted') update('enabled', true);
  }

  function handleDisableAll() {
    const next = { ...prefs, enabled: false };
    setPrefs(next);
    saveNotifPrefs(next);
  }

  function handleTest() {
    showTestNotification();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(44,26,14,0.45)',
          zIndex: 900, backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Notification Settings"
        className="modal-fullscreen-mobile"
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: '100%', maxWidth: '440px',
          maxHeight: '90vh',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '18px',
          boxShadow: '0 20px 60px rgba(44,26,14,0.28)',
          zIndex: 901, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(212,169,106,0.2)',
          background: 'linear-gradient(135deg, rgba(253,240,224,0.6), rgba(255,248,240,0.9))',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--color-primary), #A0522D)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
            }}>🔔</div>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', fontSize: '1.1rem', fontWeight: 700 }}>
              Notification Settings
            </h2>
          </div>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '50%', border: 'none',
            background: 'rgba(212,169,106,0.1)', color: 'var(--color-muted)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {/* Not supported */}
          {!supported && (
            <div style={{
              padding: '1rem', borderRadius: '10px',
              background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)',
              color: 'var(--color-accent)', fontSize: '0.84rem', marginBottom: '1rem',
            }}>
              ⚠️ Your browser does not support push notifications.
            </div>
          )}

          {/* Permission status */}
          {supported && permission !== 'granted' && (
            <div style={{
              padding: '1rem', borderRadius: '10px',
              background: 'rgba(212,169,106,0.1)', border: '1px solid rgba(212,169,106,0.3)',
              marginBottom: '1.25rem',
            }}>
              <p style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                {permission === 'denied' ? '🔕 Notifications are blocked' : '🔔 Notifications not yet enabled'}
              </p>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.78rem', marginBottom: '0.75rem' }}>
                {permission === 'denied'
                  ? 'Please enable notifications in your browser settings, then refresh the page.'
                  : 'Enable to get reminders for birthdays, anniversaries, and remembrance days.'}
              </p>
              {permission !== 'denied' && (
                <button
                  onClick={handleEnable}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '8px', border: 'none',
                    background: 'linear-gradient(135deg, var(--color-primary), #A0522D)',
                    color: '#FFF8F0', fontSize: '0.82rem', fontWeight: 700,
                    fontFamily: 'var(--font-body)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                  }}
                >
                  <Bell size={13} /> Enable Notifications
                </button>
              )}
            </div>
          )}

          {/* Master toggle */}
          {supported && permission === 'granted' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <ToggleRow
                label="All notifications"
                sub="Master switch for all reminders"
                value={prefs.enabled}
                onChange={(v) => update('enabled', v)}
                bold
              />
            </div>
          )}

          {/* Individual toggles */}
          <div style={{
            background: 'rgba(253,246,236,0.5)',
            border: '1px solid rgba(212,169,106,0.2)',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '1.25rem',
            opacity: (permission !== 'granted' || !prefs.enabled) ? 0.5 : 1,
            pointerEvents: (permission !== 'granted' || !prefs.enabled) ? 'none' : 'all',
          }}>
            <ToggleRow label="🎂 Birthday reminders" value={prefs.birthdays} onChange={(v) => update('birthdays', v)} divider />
            <ToggleRow label="💍 Anniversary reminders" value={prefs.anniversaries} onChange={(v) => update('anniversaries', v)} divider />
            <ToggleRow label="🕯️ Remembrance days" value={prefs.remembrances} onChange={(v) => update('remembrances', v)} />
          </div>

          {/* Reminder time */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', color: 'var(--color-muted)', fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              Notification time
            </label>
            <select
              value={prefs.reminderHour}
              onChange={(e) => update('reminderHour', parseInt(e.target.value, 10))}
              disabled={permission !== 'granted' || !prefs.enabled}
              style={{
                width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                border: '1.5px solid rgba(212,169,106,0.45)',
                background: 'var(--color-bg)', color: 'var(--color-text)',
                fontSize: '0.875rem', fontFamily: 'var(--font-body)',
                opacity: (permission !== 'granted' || !prefs.enabled) ? 0.5 : 1,
              }}
            >
              {HOURS.map((h) => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleTest}
              disabled={permission !== 'granted'}
              style={{
                flex: 1, padding: '0.6rem',
                borderRadius: '8px', border: '1px solid var(--color-border)',
                background: testSent ? 'linear-gradient(135deg, #27AE60, #1E8449)' : 'var(--color-bg)',
                color: testSent ? '#FFF8F0' : 'var(--color-primary)',
                fontSize: '0.82rem', fontWeight: 600,
                fontFamily: 'var(--font-body)', cursor: permission !== 'granted' ? 'default' : 'pointer',
                opacity: permission !== 'granted' ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              {testSent ? '✅ Sent!' : '🔔 Test notification'}
            </button>

            <button
              onClick={handleDisableAll}
              disabled={!prefs.enabled}
              style={{
                flex: 1, padding: '0.6rem',
                borderRadius: '8px', border: '1px solid rgba(192,57,43,0.25)',
                background: 'rgba(192,57,43,0.06)',
                color: 'var(--color-accent)', fontSize: '0.82rem', fontWeight: 600,
                fontFamily: 'var(--font-body)', cursor: !prefs.enabled ? 'default' : 'pointer',
                opacity: !prefs.enabled ? 0.5 : 1,
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
              }}
            >
              <BellOff size={13} /> Disable all
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function ToggleRow({ label, sub, value, onChange, bold, divider }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.75rem 1rem',
      borderBottom: divider ? '1px solid rgba(212,169,106,0.12)' : 'none',
    }}>
      <div>
        <p style={{ color: 'var(--color-text)', fontSize: bold ? '0.9rem' : '0.83rem', fontWeight: bold ? 700 : 500 }}>{label}</p>
        {sub && <p style={{ color: 'var(--color-muted)', fontSize: '0.72rem', marginTop: '1px' }}>{sub}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: '44px', height: '24px', borderRadius: '12px', border: 'none',
          background: value ? 'var(--color-primary)' : 'rgba(160,133,108,0.3)',
          cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: '3px',
          left: value ? 'calc(100% - 21px)' : '3px',
          width: '18px', height: '18px', borderRadius: '50%',
          background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
          display: 'block',
        }} />
      </button>
    </div>
  );
}
