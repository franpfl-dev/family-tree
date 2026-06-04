/**
 * PersonEditModal.jsx
 * Full-screen edit modal opened from right-click > Edit Details.
 * Edits: name, gender, DOB, DOD toggle, profile photo, anniversary date.
 * Shows spouse read-only with "Change Spouse" option.
 * Shows "Last edited" timestamp after saving.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Upload, Pencil, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { formatDateFull } from '../utils/familyUtils';

const inputStyle = {
  width: '100%',
  padding: '0.55rem 0.75rem',
  borderRadius: '8px',
  border: '1.5px solid rgba(212,169,106,0.45)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  fontSize: '0.875rem',
  fontFamily: 'var(--font-body)',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  color: 'var(--color-muted)',
  fontSize: '0.73rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.3rem',
};

export default function PersonEditModal({ person, tree, onClose, onOpenAddSpouse }) {
  const { state, updatePerson } = useAppContext();
  const { persons } = state;
  const photoRef = useRef(null);

  const [form, setForm] = useState({
    name: person.name || '',
    gender: person.gender || 'other',
    dob: person.dob || '',
    hasDod: !!person.dod,
    dod: person.dod || '',
    profilePhoto: person.profilePhoto || null,
    anniversaryDate: person.anniversaryDate || '',
  });
  const [dirty, setDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const spouse = person.spouseId ? persons.find(p => p.id === person.spouseId) : null;

  // Re-sync form when person changes (e.g., saved from another panel)
  useEffect(() => {
    setForm({
      name: person.name || '',
      gender: person.gender || 'other',
      dob: person.dob || '',
      hasDod: !!person.dod,
      dod: person.dod || '',
      profilePhoto: person.profilePhoto || null,
      anniversaryDate: person.anniversaryDate || '',
    });
    setDirty(false);
  }, [person.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setDirty(true);
  }

  function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => update('profilePhoto', evt.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleSave() {
    if (!form.name.trim()) return;
    updatePerson(person.id, {
      name: form.name.trim(),
      gender: form.gender,
      dob: form.dob || '',
      dod: form.hasDod ? (form.dod || null) : null,
      profilePhoto: form.profilePhoto,
      anniversaryDate: form.anniversaryDate || null,
      lastEditedAt: new Date().toISOString(),
    });
    setDirty(false);
    setLastSaved(new Date());
  }

  const genderGradient = form.gender === 'female'
    ? 'linear-gradient(135deg, #FFB6C1, #FF8FAB)'
    : form.gender === 'male'
      ? 'linear-gradient(135deg, #87CEEB, #4682B4)'
      : 'linear-gradient(135deg, #D4A96A, #A0856C)';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(44,26,14,0.4)',
          backdropFilter: 'blur(3px)',
          zIndex: 700,
          animation: 'pemFadeIn 0.2s ease',
        }}
      />

      {/* Modal — full-screen on mobile, centered card on desktop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit Person"
        className="modal-fullscreen-mobile"
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '18px',
          boxShadow: '0 16px 48px rgba(44,26,14,0.28)',
          zIndex: 800,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'pemSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.1rem 1.4rem',
          borderBottom: '1px solid rgba(212,169,106,0.2)',
          background: 'linear-gradient(135deg, rgba(253,240,224,0.8), rgba(255,248,240,0.95))',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: genderGradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
              overflow: 'hidden',
            }}>
              {form.profilePhoto
                ? <img src={form.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (form.name?.charAt(0)?.toUpperCase() || '?')
              }
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                Edit Person
              </h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.7rem', margin: 0 }}>
                {tree?.name} · Level {person.level}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--color-muted)', cursor: 'pointer',
              padding: '4px', borderRadius: '6px', display: 'flex',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.4rem' }}>

          {/* Photo + name row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.1rem' }}>
            <div style={{ flexShrink: 0 }}>
              <div
                onClick={() => photoRef.current?.click()}
                style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: form.profilePhoto ? `url(${form.profilePhoto}) center/cover` : genderGradient,
                  border: '2px dashed var(--color-border)',
                  cursor: 'pointer', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '1.4rem', fontWeight: 700,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {!form.profilePhoto && (form.name?.charAt(0)?.toUpperCase() || <Upload size={22} />)}
              </div>
              <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={labelStyle}>Full Name *</label>
              <input
                id="pem-name"
                autoFocus
                value={form.name}
                onChange={e => update('name', e.target.value)}
                style={inputStyle}
                placeholder="Enter full name"
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  style={{
                    fontSize: '0.72rem', padding: '3px 10px', borderRadius: '6px',
                    border: '1px solid var(--color-border)', background: 'transparent',
                    color: 'var(--color-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}
                >
                  <Upload size={11} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
                  {form.profilePhoto ? 'Change photo' : 'Upload photo'}
                </button>
                {form.profilePhoto && (
                  <button
                    type="button"
                    onClick={() => update('profilePhoto', null)}
                    style={{
                      fontSize: '0.72rem', padding: '3px 10px', borderRadius: '6px',
                      border: '1px solid rgba(192,57,43,0.3)', background: 'transparent',
                      color: 'var(--color-accent)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Gender */}
          <div style={{ marginBottom: '0.875rem' }}>
            <label htmlFor="pem-gender" style={labelStyle}>Gender</label>
            <select id="pem-gender" value={form.gender} onChange={e => update('gender', e.target.value)} style={inputStyle}>
              <option value="male">👨 Male</option>
              <option value="female">👩 Female</option>
              <option value="other">🧑 Other</option>
            </select>
          </div>

          {/* DOB */}
          <div style={{ marginBottom: '0.875rem' }}>
            <label htmlFor="pem-dob" style={labelStyle}>Date of Birth</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input id="pem-dob" type="date" value={form.dob} onChange={e => update('dob', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              {form.dob && (
                <button onClick={() => update('dob', '')} style={{ padding: '0 0.5rem', border: '1px solid rgba(212,169,106,0.4)', borderRadius: '7px', background: 'transparent', color: 'var(--color-muted)', cursor: 'pointer', fontSize: '0.75rem' }}>Clear</button>
              )}
            </div>
          </div>

          {/* Deceased toggle */}
          <div
            onClick={() => update('hasDod', !form.hasDod)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0', cursor: 'pointer', marginBottom: '0.4rem' }}
          >
            <span style={{ color: 'var(--color-text)', fontSize: '0.85rem', fontWeight: 600 }}>Deceased</span>
            <div style={{
              width: '40px', height: '22px', borderRadius: '11px',
              background: form.hasDod ? 'linear-gradient(135deg, var(--color-primary), #A0522D)' : 'rgba(212,169,106,0.3)',
              position: 'relative', transition: 'background 0.25s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: '3px', left: form.hasDod ? '20px' : '3px',
                width: '16px', height: '16px', borderRadius: '50%',
                background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                transition: 'left 0.25s',
              }} />
            </div>
          </div>

          {form.hasDod && (
            <div style={{ marginBottom: '0.875rem', animation: 'pemFadeIn 0.2s ease' }}>
              <label htmlFor="pem-dod" style={labelStyle}>Date of Death</label>
              <input id="pem-dod" type="date" value={form.dod} onChange={e => update('dod', e.target.value)} style={inputStyle} />
            </div>
          )}

          {/* Spouse */}
          {spouse && (
            <div style={{
              marginTop: '0.875rem', padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(253,240,224,0.5), rgba(255,248,240,0.8))',
              border: '1px solid rgba(212,169,106,0.25)',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: spouse.gender === 'female' ? 'linear-gradient(135deg, #FFB6C1, #FF8FAB)' : 'linear-gradient(135deg, #87CEEB, #4682B4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '0.9rem', fontWeight: 700, flexShrink: 0, overflow: 'hidden',
              }}>
                {spouse.profilePhoto
                  ? <img src={spouse.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : spouse.name?.charAt(0)?.toUpperCase()
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.85rem', margin: 0 }}>
                  💍 {spouse.name}
                </p>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.7rem', margin: 0 }}>
                  Spouse · {spouse.dob ? `b. ${formatDateFull(spouse.dob)}` : 'DOB unknown'}
                </p>
              </div>
              {onOpenAddSpouse && (
                <button
                  onClick={() => { onOpenAddSpouse(person); onClose(); }}
                  style={{
                    fontSize: '0.72rem', padding: '4px 10px', borderRadius: '7px',
                    border: '1px solid var(--color-border)', background: 'transparent',
                    color: 'var(--color-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Pencil size={11} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
                  Change
                </button>
              )}
            </div>
          )}

          {/* Anniversary */}
          {spouse && (
            <div style={{ marginTop: '0.875rem' }}>
              <label htmlFor="pem-anniversary" style={labelStyle}>Anniversary Date</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  id="pem-anniversary"
                  type="date"
                  value={form.anniversaryDate}
                  onChange={e => update('anniversaryDate', e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                {form.anniversaryDate && (
                  <button onClick={() => update('anniversaryDate', '')} style={{ padding: '0 0.5rem', border: '1px solid rgba(212,169,106,0.4)', borderRadius: '7px', background: 'transparent', color: 'var(--color-muted)', cursor: 'pointer', fontSize: '0.75rem' }}>Clear</button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.9rem 1.4rem',
          borderTop: '1px solid rgba(212,169,106,0.2)',
          background: 'var(--color-surface)',
          display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0,
        }}>
          {lastSaved && (
            <p style={{ fontSize: '0.7rem', color: 'var(--color-muted)', margin: 0, flex: 1 }}>
              ✓ Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          {!lastSaved && <span style={{ flex: 1 }} />}
          <button
            onClick={onClose}
            style={{
              padding: '0.6rem 1.1rem', borderRadius: '9px',
              border: '1px solid var(--color-border)', background: 'transparent',
              color: 'var(--color-muted)', fontSize: '0.875rem', fontWeight: 600,
              fontFamily: 'var(--font-body)', cursor: 'pointer',
            }}
          >
            Close
          </button>
          <button
            id="pem-save"
            onClick={handleSave}
            disabled={!dirty || !form.name.trim()}
            style={{
              padding: '0.6rem 1.3rem', borderRadius: '9px', border: 'none',
              background: (!dirty || !form.name.trim())
                ? 'rgba(212,169,106,0.2)'
                : 'linear-gradient(135deg, var(--color-primary), #A0522D)',
              color: (!dirty || !form.name.trim()) ? 'var(--color-muted)' : '#FFF8F0',
              fontSize: '0.875rem', fontWeight: 700, fontFamily: 'var(--font-body)',
              cursor: (!dirty || !form.name.trim()) ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              transition: 'all 0.2s',
            }}
          >
            <Check size={14} /> Save
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pemFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pemSlideUp {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 20px)); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </>
  );
}
