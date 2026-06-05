/**
 * EditSpouseModal.jsx
 * Edit an existing spouse's details + anniversary date.
 * Opened from right-click → "Edit Spouse" on either person in a couple.
 *
 * Props:
 *   person     — the person whose spouse we are editing (the one right-clicked,
 *                or the main person; we resolve the spouse from person.spouseId)
 *   tree       — current tree object
 *   onClose    — close callback
 */

import { useState, useRef, useEffect } from 'react';
import { Heart, Check, Upload, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Modal, FormField, ToggleRow, inputStyle, primaryBtnStyle, cancelBtnStyle } from './modalShared';

export default function EditSpouseModal({ person, onClose }) {
  const { state, updatePerson } = useAppContext();
  const { persons } = state;
  const photoRef = useRef(null);

  // Resolve the actual spouse object
  const spouse = persons.find((p) => p.id === person.spouseId);

  const [form, setForm] = useState(() => ({
    name:            spouse?.name            || '',
    gender:          spouse?.gender          || 'other',
    dob:             spouse?.dob             || '',
    hasDod:          !!spouse?.dod,
    dod:             spouse?.dod             || '',
    profilePhoto:    spouse?.profilePhoto    || null,
    anniversaryDate: person.anniversaryDate  || spouse?.anniversaryDate || '',
  }));

  const [dirty,   setDirty]   = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [errors,  setErrors]  = useState({});

  const initialSpouseId = useRef(spouse?.id);

  // Keep form in sync if spouse changes externally
  useEffect(() => {
    if (!spouse) return;
    if (spouse.id === initialSpouseId.current) return;
    setForm({
      name:            spouse.name            || '',
      gender:          spouse.gender          || 'other',
      dob:             spouse.dob             || '',
      hasDod:          !!spouse.dod,
      dod:             spouse.dod             || '',
      profilePhoto:    spouse.profilePhoto    || null,
      anniversaryDate: person.anniversaryDate || spouse.anniversaryDate || '',
    });
    setDirty(false);
  }, [spouse, person.anniversaryDate]);

  // Escape to close
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setDirty(true);
    setSaved(false);
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
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (!spouse) return;

    // Update the spouse person's details
    updatePerson(spouse.id, {
      name:         form.name.trim(),
      gender:       form.gender,
      dob:          form.dob  || '',
      dod:          form.hasDod ? (form.dod || null) : null,
      profilePhoto: form.profilePhoto,
      // Anniversary is stored on BOTH persons for symmetry
      anniversaryDate: form.anniversaryDate || null,
    });

    // Also sync the anniversary on the main person
    updatePerson(person.id, {
      anniversaryDate: form.anniversaryDate || null,
    });

    setDirty(false);
    setSaved(true);
    setErrors({});
    setTimeout(() => setSaved(false), 2000);
  }

  function handleUnlink() {
    if (!spouse) return;
    if (window.confirm(`Are you sure you want to unlink ${spouse.name} and ${person.name}? They will remain in the database but will no longer be shown as married.`)) {
      updatePerson(person.id, { spouseId: null, anniversaryDate: null });
      updatePerson(spouse.id, { spouseId: null, anniversaryDate: null });
      onClose();
    }
  }

  if (!spouse) {
    return (
      <Modal
        title="Edit Spouse"
        subtitle={`For: ${person.name}`}
        icon={<Heart size={18} color="var(--color-accent)" />}
        onClose={onClose}
      >
        <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: '2rem 0' }}>
          No spouse linked to this person.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onClose} style={cancelBtnStyle}>Close</button>
        </div>
      </Modal>
    );
  }

  const genderGradient = form.gender === 'female'
    ? 'linear-gradient(135deg, #FFB6C1, #FF8FAB)'
    : form.gender === 'male'
      ? 'linear-gradient(135deg, #87CEEB, #4682B4)'
      : 'linear-gradient(135deg, #D4A96A, #A0856C)';

  return (
    <Modal
      title="Edit Spouse"
      subtitle={`Editing: ${spouse.name} — partner of ${person.name}`}
      icon={<Heart size={18} color="var(--color-accent)" />}
      onClose={onClose}
    >
      {/* Photo + name */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ flexShrink: 0 }}>
          <div
            onClick={() => photoRef.current?.click()}
            style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: form.profilePhoto ? `url(${form.profilePhoto}) center/cover` : genderGradient,
              border: '2px dashed var(--color-border)',
              cursor: 'pointer', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '1.3rem', fontWeight: 700,
            }}
          >
            {!form.profilePhoto && (form.name?.charAt(0)?.toUpperCase() || <Upload size={20} />)}
          </div>
          <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <FormField label="Spouse Full Name *" id="es-name" error={errors.name}>
            <input
              id="es-name"
              autoFocus
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Spouse's full name"
              style={inputStyle}
            />
          </FormField>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                <X size={11} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gender + DOB */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
        <FormField label="Gender" id="es-gender">
          <select id="es-gender" value={form.gender} onChange={(e) => update('gender', e.target.value)} style={inputStyle}>
            <option value="male">👨 Male</option>
            <option value="female">👩 Female</option>
            <option value="other">🧑 Other</option>
          </select>
        </FormField>
        <FormField label="Date of Birth" id="es-dob">
          <input id="es-dob" type="date" value={form.dob} onChange={(e) => update('dob', e.target.value)} style={inputStyle} />
        </FormField>
      </div>

      <ToggleRow label="Deceased" value={form.hasDod} onChange={(v) => update('hasDod', v)} />
      {form.hasDod && (
        <FormField label="Date of Death" id="es-dod">
          <input id="es-dod" type="date" value={form.dod} onChange={(e) => update('dod', e.target.value)} style={inputStyle} />
        </FormField>
      )}

      {/* Anniversary (shared) */}
      <FormField label="Anniversary Date" id="es-anniversary">
        <input
          id="es-anniversary"
          type="date"
          value={form.anniversaryDate}
          onChange={(e) => update('anniversaryDate', e.target.value)}
          style={inputStyle}
        />
      </FormField>

      {saved && (
        <div style={{
          background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.25)',
          borderRadius: '8px', padding: '0.5rem 0.875rem',
          color: '#1E8449', fontSize: '0.82rem', marginBottom: '0.5rem',
        }}>
          ✓ Spouse details saved!
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
        <button
          onClick={handleUnlink}
          style={{
            ...cancelBtnStyle,
            color: 'var(--color-accent)',
            borderColor: 'rgba(192,57,43,0.3)',
            background: 'rgba(192,57,43,0.02)',
            fontWeight: 700,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(192,57,43,0.08)'; e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(192,57,43,0.02)'; e.currentTarget.style.borderColor = 'rgba(192,57,43,0.3)'; }}
        >
          Unlink Spouse
        </button>
        <button
          id="btn-edit-spouse-submit"
          onClick={handleSave}
          disabled={!dirty}
          style={{ ...primaryBtnStyle, opacity: dirty ? 1 : 0.55, cursor: dirty ? 'pointer' : 'default' }}
        >
          <Check size={15} /> Save Changes
        </button>
      </div>
    </Modal>
  );
}
